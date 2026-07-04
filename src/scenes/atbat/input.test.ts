import { describe, expect, it } from 'vitest'
import { BALANCE } from '../../data/balance'
import { accuracyToErrorScale, clampPci, toHumanSwing } from './input'
import { ballPathPoint, flightMs, makeLayout, pxToZone, zoneToPx } from './flight'
import type { PitchActual } from '../../engine/types'

const base = {
  crossTimeMs: 1000,
  pci: { x: 0, y: 0 },
  pitchLoc: { x: 0, y: 0 },
  contact: 50,
  difficulty: 'standard' as const,
}

describe('toHumanSwing', () => {
  it('null tap is a take', () => {
    const swing = toHumanSwing({ ...base, tapTimeMs: null })
    expect(swing.swung).toBe(false)
    expect(swing.timingErrorMs).toBe(0)
  })

  it('early taps are negative, late taps positive', () => {
    expect(toHumanSwing({ ...base, tapTimeMs: 950 }).timingErrorMs).toBeLessThan(0)
    expect(toHumanSwing({ ...base, tapTimeMs: 1050 }).timingErrorMs).toBeGreaterThan(0)
  })

  it('rookie forgives timing more than hard', () => {
    const rookie = toHumanSwing({ ...base, tapTimeMs: 1060, difficulty: 'rookie' })
    const hard = toHumanSwing({ ...base, tapTimeMs: 1060, difficulty: 'hard' })
    expect(Math.abs(rookie.timingErrorMs)).toBeLessThan(Math.abs(hard.timingErrorMs))
  })

  it('higher contact rating shrinks timing error', () => {
    const scrub = toHumanSwing({ ...base, tapTimeMs: 1060, contact: 20 })
    const star = toHumanSwing({ ...base, tapTimeMs: 1060, contact: 95 })
    expect(Math.abs(star.timingErrorMs)).toBeLessThan(Math.abs(scrub.timingErrorMs))
  })

  it('magnetism only applies near the ball', () => {
    // Far off: only the difficulty shrink applies.
    const far = toHumanSwing({ ...base, tapTimeMs: 1000, pci: { x: 1.5, y: 0 } })
    const shrink = 1 - BALANCE.assist.aimShrink.standard
    expect(far.aimOffset.x).toBeCloseTo(1.5 * shrink, 5)
    // Close: extra magnet pull halves the remainder.
    const near = toHumanSwing({ ...base, tapTimeMs: 1000, pci: { x: 0.2, y: 0 } })
    expect(near.aimOffset.x).toBeCloseTo(0.2 * shrink * (1 - BALANCE.assist.aimMagnetPull), 5)
  })
})

describe('accuracyToErrorScale', () => {
  it('is monotonic decreasing and bounded', () => {
    const worst = accuracyToErrorScale(0, 'standard')
    const mid = accuracyToErrorScale(0.5, 'standard')
    const perfect = accuracyToErrorScale(1, 'standard')
    expect(worst).toBeGreaterThan(mid)
    expect(mid).toBeGreaterThan(perfect)
    expect(perfect).toBeCloseTo(BALANCE.assist.pitchAccuracy.errorScaleMin, 9)
    expect(worst).toBeCloseTo(BALANCE.assist.pitchAccuracy.errorScaleMax.standard, 9)
    expect(accuracyToErrorScale(2, 'standard')).toBeCloseTo(perfect, 9) // clamped
  })
})

describe('clampPci', () => {
  it('bounds the PCI to the roam range', () => {
    const r = BALANCE.scene.pciClampRange
    expect(clampPci({ x: 9, y: -9 })).toEqual({ x: r, y: -r })
    expect(clampPci({ x: 0.5, y: 0.5 })).toEqual({ x: 0.5, y: 0.5 })
  })
})

describe('flight geometry', () => {
  const layout = makeLayout(390, 700)

  it('zone<->px round-trips', () => {
    const p = { x: 0.7, y: -0.4 }
    const px = zoneToPx(layout, p)
    const back = pxToZone(layout, px.x, px.y)
    expect(back.x).toBeCloseTo(p.x, 6)
    expect(back.y).toBeCloseTo(p.y, 6)
  })

  it('ball path starts at release and lands exactly on pitch.loc for every type', () => {
    for (const type of ['FB', 'SL', 'CB', 'CH'] as const) {
      const pitch: PitchActual = { type, loc: { x: 0.5, y: -0.5 }, speed: 88 }
      const start = ballPathPoint(layout, pitch, 0)
      expect(start.x).toBeCloseTo(layout.releaseX, 4)
      expect(start.y).toBeCloseTo(layout.releaseY, 4)
      const end = ballPathPoint(layout, pitch, 1)
      const plate = zoneToPx(layout, pitch.loc)
      expect(end.x).toBeCloseTo(plate.x, 4)
      expect(end.y).toBeCloseTo(plate.y, 4)
      expect(end.r).toBeGreaterThan(start.r)
    }
  })

  it('flightMs decreases with speed and clamps', () => {
    expect(flightMs(95)).toBeLessThan(flightMs(75))
    expect(flightMs(200)).toBe(BALANCE.scene.flightMinMs)
    expect(flightMs(30)).toBe(BALANCE.scene.flightMaxMs)
  })
})
