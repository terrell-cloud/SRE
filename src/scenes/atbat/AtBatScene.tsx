// The one real-time surface in the game. A rAF loop drives a per-pitch
// phase machine; all timing uses performance.now()/event timestamps, never
// React state. Two-thumb batting: one pointer drags the PCI, the SWING
// button (separate DOM element) captures tap timing.

import { useEffect, useRef, useState } from 'react'
import { BALANCE } from '../../data/balance'
import { aiPitchPlan, applyControl } from '../../engine/atbat'
import { currentBatter, currentPitcher, type StepResult } from '../../engine/game'
import type { PitchActual, PitchPlan, PitchTypeId, ZoneXY } from '../../engine/types'
import { PITCH_TYPES } from '../../data/pitchTypes'
import { useGameStore } from '../../state/gameStore'
import { ballPathPoint, flightMs, makeLayout, pxToZone, type SceneLayout } from './flight'
import { accuracyToErrorScale, clampPci, toHumanSwing } from './input'
import { drawFrame, type PitcherPose, type SceneView } from './render'
import { useGameLoop } from './useGameLoop'

const S = BALANCE.scene
const RING_MAX = 1.0
const RING_MIN = 0.12
const RING_PERFECT = 0.3

export type SceneMode = 'bat' | 'pitch' | 'hold'

type Phase =
  | { k: 'ready'; at: number }
  | { k: 'select' }
  | { k: 'accuracy'; ringStart: number; plan: PitchPlan }
  | { k: 'windup'; until: number; pitch: PitchActual }
  | { k: 'flight'; t0: number; flightMs: number; pitch: PitchActual }
  | { k: 'resolved'; until: number }
  | { k: 'final'; until: number }

interface Banner {
  title: string
  sub?: string
  tone: 'good' | 'bad' | 'neutral'
}

export default function AtBatScene({
  mode,
  onGameOver,
}: {
  mode: SceneMode
  onGameOver: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const layoutRef = useRef<SceneLayout>(makeLayout(390, 600))

  const phaseRef = useRef<Phase>({ k: 'ready', at: 0 })
  const modeRef = useRef<SceneMode>(mode)
  modeRef.current = mode

  const pciRef = useRef<ZoneXY>({ x: 0, y: 0 })
  const targetRef = useRef<ZoneXY>({ x: 0, y: -0.3 })
  const pitchTypeRef = useRef<PitchTypeId>('FB')
  const aimPointerId = useRef<number | null>(null)
  const swingTap = useRef<{ time: number; pci: ZoneXY } | null>(null)
  const swingFlash = useRef(0)
  const lastFrame = useRef(0)
  const lastSeenVersion = useRef(-1)
  const pitcherPose = useRef<PitcherPose>('idle')

  const [banner, setBanner] = useState<Banner | null>(null)
  const [selectVisible, setSelectVisible] = useState(false)
  const [buttonMode, setButtonMode] = useState<'swing' | 'throw' | 'lock' | null>(null)
  const [selectedType, setSelectedType] = useState<PitchTypeId>('FB')

  const commitPitch = useGameStore((s) => s.commitPitch)

  // ------------------------------------------------------------------ sizing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !canvas.parentElement) return
    const parent = canvas.parentElement
    const resize = () => {
      const rect = parent.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      layoutRef.current = makeLayout(rect.width, rect.height)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(parent)
    return () => ro.disconnect()
  }, [])

  // ------------------------------------------------------------- transitions
  function toReady(now: number) {
    phaseRef.current = { k: 'ready', at: now + S.interPitchMs }
    pitcherPose.current = 'idle'
    swingTap.current = null
    setSelectVisible(false)
  }

  function startWindup(now: number, pitch: PitchActual) {
    phaseRef.current = { k: 'windup', until: now + S.windupMs, pitch }
    pitcherPose.current = 'windup'
    setSelectVisible(false)
    setButtonMode(modeRef.current === 'bat' ? 'swing' : null)
  }

  /** Pre-generate the CPU pitch exactly as stepPitch would (same rng/fatigue). */
  function pregenAiPitch(errorScale?: number, plan?: PitchPlan): PitchActual | null {
    const live = useGameStore.getState().live
    if (!live || live.gs.gameOver) return null
    const gs = live.gs
    const pitcher = currentPitcher(gs)
    const batter = currentBatter(gs)
    const nextCount = (gs.pitchCounts[pitcher.id] ?? 0) + 1
    const thePlan = plan ?? aiPitchPlan(pitcher, batter, gs.count, live.rng)
    return applyControl(thePlan, pitcher, nextCount, live.rng, errorScale ?? 1)
  }

  function resolveFlight(now: number, pitch: PitchActual, crossTime: number) {
    const live = useGameStore.getState().live
    if (!live) return
    const gs = live.gs
    const before = {
      balls: gs.count.balls,
      strikes: gs.count.strikes,
      half: gs.half,
      inning: gs.inning,
    }
    const wasBatting = modeRef.current === 'bat'

    let result: StepResult
    if (wasBatting) {
      const tap = swingTap.current
      const swing = toHumanSwing({
        tapTimeMs: tap ? tap.time : null,
        crossTimeMs: crossTime,
        pci: tap ? tap.pci : pciRef.current,
        pitchLoc: pitch.loc,
        contact: currentBatter(gs).ratings.contact,
        difficulty: live.difficulty,
      })
      result = commitPitch({ pitch, swing })
    } else {
      result = commitPitch({ pitch })
    }
    lastSeenVersion.current = useGameStore.getState().live?.version ?? -1

    const gsAfter = useGameStore.getState().live?.gs
    const b = bannerFor(result, before, gsAfter, wasBatting)
    setBanner(b.banner)

    if (gsAfter?.gameOver) {
      setBanner({ title: 'FINAL', sub: `${gsAfter.score.away}–${gsAfter.score.home}`, tone: 'neutral' })
      phaseRef.current = { k: 'final', until: now + 1600 }
      return
    }
    phaseRef.current = {
      k: 'resolved',
      until: now + (b.long ? S.bannerLongMs : S.bannerShortMs),
    }
    pitcherPose.current = 'idle'
  }

  // ------------------------------------------------------------------- loop
  useGameLoop((now) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const live = useGameStore.getState().live
    if (!canvas || !ctx || !live) return
    const l = layoutRef.current
    const phase = phaseRef.current
    const gap = now - lastFrame.current
    lastFrame.current = now

    // External mutation (sim buttons) -> reset to a clean ready state.
    if (lastSeenVersion.current !== live.version) {
      lastSeenVersion.current = live.version
      if (phase.k !== 'ready' && phase.k !== 'final') {
        setBanner(null)
        toReady(now)
      }
      if (live.gs.gameOver && phase.k !== 'final') {
        setBanner({
          title: 'FINAL',
          sub: `${live.gs.score.away}–${live.gs.score.home}`,
          tone: 'neutral',
        })
        phaseRef.current = { k: 'final', until: now + 1600 }
      }
    }

    switch (phase.k) {
      case 'ready': {
        if (now >= phase.at) {
          const m = modeRef.current
          if (m === 'bat') {
            const pitch = pregenAiPitch()
            if (pitch) startWindup(now, pitch)
          } else if (m === 'pitch') {
            phaseRef.current = { k: 'select' }
            setSelectVisible(true)
            setButtonMode('throw')
          }
          // 'hold': wait — parent is deciding (sim vs pitch) or half is flipping.
        }
        break
      }
      case 'windup': {
        if (now >= phase.until) {
          pitcherPose.current = 'release'
          phaseRef.current = {
            k: 'flight',
            t0: now,
            flightMs: flightMs(phase.pitch.speed),
            pitch: phase.pitch,
          }
        }
        break
      }
      case 'flight': {
        // Tab-switch protection: shift the clock instead of eating the pitch.
        if (gap > 200) phase.t0 += gap - 16
        const crossTime = phase.t0 + phase.flightMs
        if (modeRef.current === 'bat') {
          const tap = swingTap.current
          if (tap && now >= crossTime) resolveFlight(now, phase.pitch, crossTime)
          else if (!tap && now >= crossTime + S.swingGraceMs)
            resolveFlight(now, phase.pitch, crossTime)
        } else if (now >= crossTime) {
          resolveFlight(now, phase.pitch, crossTime)
        }
        break
      }
      case 'accuracy': {
        const p = (now - phase.ringStart) / S.accuracyRingMs
        if (p >= 2) commitAccuracy(now, 0) // auto-release at worst
        break
      }
      case 'resolved': {
        if (now >= phase.until) {
          setBanner(null)
          toReady(now)
        }
        break
      }
      case 'final': {
        if (now >= phase.until) onGameOver()
        break
      }
    }

    // ------------------------------------------------------------- draw
    const ph = phaseRef.current
    let ball: SceneView['ball'] = null
    if (ph.k === 'flight') {
      const t01 = (now - ph.t0) / ph.flightMs
      if (t01 <= 1.02) ball = ballPathPoint(l, ph.pitch, t01)
    }
    let ringRadius: number | null = null
    if (ph.k === 'accuracy') {
      const p = (now - ph.ringStart) / S.accuracyRingMs
      ringRadius = p <= 1 ? RING_MAX - (RING_MAX - RING_MIN) * p : RING_MIN + (RING_MAX - RING_MIN) * (p - 1)
    }
    swingFlash.current = Math.max(0, swingFlash.current - gap / 220)

    const userTeam = live.userSide === 'home' ? live.gs.home : live.gs.away
    const oppTeam = live.userSide === 'home' ? live.gs.away : live.gs.home
    const view: SceneView = {
      mode: modeRef.current,
      pitcherPose: pitcherPose.current,
      pitcherColor:
        modeRef.current === 'bat' ? oppTeam.school.colors.primary : userTeam.school.colors.primary,
      batterColor:
        modeRef.current === 'bat' ? userTeam.school.colors.primary : oppTeam.school.colors.primary,
      ball,
      pci: modeRef.current === 'bat' ? pciRef.current : null,
      reticle:
        modeRef.current === 'pitch' && (ph.k === 'select' || ph.k === 'accuracy')
          ? targetRef.current
          : null,
      ringRadius,
      swingFlash: swingFlash.current,
    }
    drawFrame(ctx, l, view)
  })

  // ------------------------------------------------------------- accuracy
  function commitAccuracy(now: number, forcedAccuracy?: number) {
    const phase = phaseRef.current
    if (phase.k !== 'accuracy') return
    const live = useGameStore.getState().live
    if (!live) return
    let accuracy = forcedAccuracy
    if (accuracy === undefined) {
      const p = (now - phase.ringStart) / S.accuracyRingMs
      const radius = p <= 1 ? RING_MAX - (RING_MAX - RING_MIN) * p : RING_MIN + (RING_MAX - RING_MIN) * (p - 1)
      accuracy = Math.max(0, 1 - Math.abs(radius - RING_PERFECT) / (RING_MAX - RING_PERFECT))
    }
    const errorScale = accuracyToErrorScale(accuracy, live.difficulty)
    const pitch = pregenAiPitch(errorScale, phase.plan)
    setButtonMode(null)
    if (pitch) startWindup(now, pitch)
  }

  // ------------------------------------------------------------- pointers
  function updateAimOrTarget(clientX: number, clientY: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const phase = phaseRef.current
    if (modeRef.current === 'bat') {
      pciRef.current = clampPci(pxToZone(layoutRef.current, x, y - S.pciThumbOffsetPx))
    } else if (phase.k === 'select') {
      const z = pxToZone(layoutRef.current, x, y)
      targetRef.current = { x: Math.max(-1.4, Math.min(1.4, z.x)), y: Math.max(-1.4, Math.min(1.4, z.y)) }
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (aimPointerId.current === null) {
      aimPointerId.current = e.pointerId
      canvasRef.current?.setPointerCapture(e.pointerId)
    }
    if (e.pointerId === aimPointerId.current) updateAimOrTarget(e.clientX, e.clientY)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerId === aimPointerId.current || (e.pointerType === 'mouse' && aimPointerId.current === null)) {
      updateAimOrTarget(e.clientX, e.clientY)
    }
  }
  const onPointerEnd = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerId === aimPointerId.current) aimPointerId.current = null
  }

  // ------------------------------------------------------- action button
  function pressAction(timeStamp: number) {
    const phase = phaseRef.current
    const now = performance.now()
    if (buttonMode === 'swing' || modeRef.current === 'bat') {
      if (phase.k === 'flight' && swingTap.current === null) {
        swingTap.current = { time: timeStamp, pci: { ...pciRef.current } }
        swingFlash.current = 1
      }
    } else if (phase.k === 'select') {
      phaseRef.current = { k: 'accuracy', ringStart: now, plan: { type: pitchTypeRef.current, target: { ...targetRef.current } } }
      setSelectVisible(false)
      setButtonMode('lock')
    } else if (phase.k === 'accuracy') {
      commitAccuracy(now)
    }
  }

  const onActionPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    pressAction(e.timeStamp || performance.now())
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        pressAction(performance.now())
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buttonMode])

  // ------------------------------------------------------------ pitch chips
  const live = useGameStore((s) => s.live)
  const pitcher = live ? currentPitcher(live.gs) : null

  const actionLabel = buttonMode === 'throw' ? 'THROW' : buttonMode === 'lock' ? 'LOCK' : 'SWING'
  const showAction = mode !== 'hold' && (mode === 'bat' || buttonMode !== null)

  return (
    <div className="relative h-full w-full touch-none select-none">
      <canvas
        ref={canvasRef}
        data-testid="atbat-canvas"
        className="absolute inset-0 touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      />

      {banner && (
        <div className="pointer-events-none absolute inset-x-0 top-[30%] flex justify-center">
          <div
            className={`rounded-2xl px-6 py-3 text-center shadow-xl backdrop-blur-sm ${
              banner.tone === 'good'
                ? 'bg-dirt-400/95 text-field-900'
                : banner.tone === 'bad'
                  ? 'bg-red-900/90 text-red-100'
                  : 'bg-field-900/85 text-chalk'
            }`}
          >
            <div className="text-2xl font-black tracking-wide">{banner.title}</div>
            {banner.sub && <div className="mt-0.5 text-sm font-semibold opacity-80">{banner.sub}</div>}
          </div>
        </div>
      )}

      {selectVisible && pitcher && (
        <div className="absolute bottom-2 left-2 right-32 rounded-2xl bg-field-900/90 p-3 backdrop-blur">
          <div className="mb-2 text-center text-[11px] font-semibold uppercase tracking-widest text-field-50/60">
            Drag the target, pick a pitch, then THROW
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {pitcher.pitches.map((p) => (
              <button
                key={p.type}
                type="button"
                onClick={() => {
                  pitchTypeRef.current = p.type
                  setSelectedType(p.type)
                }}
                className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                  selectedType === p.type
                    ? 'bg-dirt-400 text-field-900'
                    : 'bg-field-800 text-field-50/80'
                }`}
              >
                {PITCH_TYPES[p.type].name}
                <span className="ml-1 text-[10px] opacity-60">{p.quality}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showAction && (
        <button
          type="button"
          aria-label={actionLabel === 'SWING' ? 'Swing' : actionLabel === 'THROW' ? 'Throw' : 'Lock'}
          onPointerDown={onActionPointerDown}
          className="absolute bottom-4 right-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-field-50/30 bg-dirt-400 text-lg font-black text-field-900 shadow-2xl transition active:scale-90"
          style={{ touchAction: 'none' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- banners

function bannerFor(
  result: StepResult,
  before: { balls: number; strikes: number; half: string; inning: number },
  gsAfter: { count: { balls: number; strikes: number } } | undefined,
  userBatting: boolean,
): { banner: Banner; long: boolean } {
  const good = (t: string, sub?: string): Banner => ({ title: t, sub, tone: userBatting ? 'good' : 'bad' })
  const bad = (t: string, sub?: string): Banner => ({ title: t, sub, tone: userBatting ? 'bad' : 'good' })
  const neutral = (t: string, sub?: string): Banner => ({ title: t, sub, tone: 'neutral' })

  const { event, play } = result
  if (!event) return { banner: neutral(''), long: false }

  const countReset = gsAfter ? gsAfter.count.balls === 0 && gsAfter.count.strikes === 0 : false

  switch (event.kind) {
    case 'ball':
      if (countReset && before.balls === 3) return { banner: good('WALK'), long: true }
      return { banner: neutral(`BALL ${Math.min(before.balls + 1, 4)}`), long: false }
    case 'calledStrike':
      if (countReset && before.strikes === 2) return { banner: bad('STRUCK OUT LOOKING'), long: true }
      return { banner: neutral(`STRIKE ${Math.min(before.strikes + 1, 3)}`), long: false }
    case 'swingMiss':
      if (countReset && before.strikes === 2) return { banner: bad('STRIKEOUT!'), long: true }
      return { banner: neutral('SWING AND A MISS'), long: false }
    case 'foul':
      return { banner: neutral('FOUL'), long: false }
    case 'inPlay': {
      if (!play) return { banner: neutral('IN PLAY'), long: true }
      const runs = play.runsScored
      const runsSub = runs > 0 ? `${runs} run${runs > 1 ? 's' : ''} score${runs === 1 ? 's' : ''}` : undefined
      switch (play.type) {
        case 'single': return { banner: good('SINGLE!', runsSub), long: true }
        case 'double': return { banner: good('DOUBLE!', runsSub), long: true }
        case 'triple': return { banner: good('TRIPLE!', runsSub), long: true }
        case 'homeRun': return { banner: good(runs > 1 ? `${runs}-RUN HOME RUN!` : 'HOME RUN!'), long: true }
        case 'error': return { banner: good('REACHED ON ERROR', runsSub), long: true }
        case 'sacFly': return { banner: good('SAC FLY', runsSub), long: true }
        case 'doublePlay': return { banner: bad('DOUBLE PLAY'), long: true }
        case 'groundOut': return { banner: bad('GROUND OUT', runsSub), long: true }
        case 'flyOut': return { banner: bad('FLY OUT'), long: true }
        case 'lineOut': return { banner: bad('LINED OUT'), long: true }
        case 'popOut': return { banner: bad('POPPED OUT'), long: true }
        default: return { banner: neutral('IN PLAY'), long: true }
      }
    }
  }
}
