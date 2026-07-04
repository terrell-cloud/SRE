import { useState } from 'react'
import AtBatScene, { type SceneMode } from '../../scenes/atbat/AtBatScene'
import BasesDiamond from '../components/BasesDiamond'
import { battingTeam, currentBatter, currentPitcher, fieldingTeam } from '../../engine/game'
import { useGameStore } from '../../state/gameStore'

export default function GameDayScreen() {
  const live = useGameStore((s) => s.live)
  const simPa = useGameStore((s) => s.simPa)
  const simHalf = useGameStore((s) => s.simHalf)
  const simToEnd = useGameStore((s) => s.simToEnd)
  const finishLive = useGameStore((s) => s.finishLive)

  const [pitchChoices, setPitchChoices] = useState<Record<string, 'pitch' | 'sim'>>({})

  if (!live) return null
  const { gs, userSide } = live

  const userBatting = gs.half === 'top' ? userSide === 'away' : userSide === 'home'
  const halfKey = `${gs.inning}-${gs.half}`
  const fieldChoice = pitchChoices[halfKey]
  const needsFieldChoice = !userBatting && !gs.gameOver && !fieldChoice

  const mode: SceneMode = gs.gameOver
    ? 'hold'
    : userBatting
      ? 'bat'
      : fieldChoice === 'pitch'
        ? 'pitch'
        : 'hold'

  const batter = currentBatter(gs)
  const pitcher = currentPitcher(gs)
  const offense = battingTeam(gs)
  const defense = fieldingTeam(gs)

  return (
    <div className="flex h-dvh flex-col">
      {/* ------------------------------------------------------------ HUD */}
      <header className="bg-field-900/95 px-3 pb-2 pt-3">
        <div className="flex items-center justify-between">
          <TeamChip
            abbrev={gs.away.school.abbrev}
            colors={gs.away.school.colors}
            score={gs.score.away}
            isUser={userSide === 'away'}
          />
          <div className="text-center">
            <div className="text-xs font-black tracking-widest text-dirt-400">
              {gs.half === 'top' ? '▲' : '▼'} {gs.inning}
            </div>
            <div className="mt-0.5 flex items-center justify-center gap-1" aria-label={`${gs.outs} outs`}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full ${i < gs.outs ? 'bg-red-400' : 'bg-field-50/20'}`}
                />
              ))}
            </div>
          </div>
          <TeamChip
            abbrev={gs.home.school.abbrev}
            colors={gs.home.school.colors}
            score={gs.score.home}
            isUser={userSide === 'home'}
          />
        </div>

        <div className="mt-1.5 flex items-center justify-between text-xs">
          <div className="font-bold tabular-nums text-field-50/80" data-testid="count">
            {gs.count.balls}-{gs.count.strikes}
          </div>
          <div className="min-w-0 flex-1 truncate px-2 text-center text-field-50/70">
            <span className="font-bold text-chalk">
              #{batter.jerseyNumber} {batter.lastName}
            </span>
            <span className="mx-1 opacity-50">vs</span>
            <span className="font-bold text-chalk">
              {pitcher.lastName}
            </span>
            <span className="ml-1 opacity-50">P{gs.pitchCounts[pitcher.id] ?? 0}</span>
          </div>
          <BasesDiamond bases={gs.bases} />
        </div>
      </header>

      {/* ---------------------------------------------------------- scene */}
      <main className="relative min-h-0 flex-1">
        <AtBatScene mode={mode} onGameOver={finishLive} />

        {needsFieldChoice && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-field-900/70 backdrop-blur-sm">
            <div className="mx-6 w-full max-w-xs rounded-3xl bg-field-800 p-5 text-center shadow-2xl">
              <div className="text-sm font-semibold uppercase tracking-widest text-field-50/60">
                {defense.school.nickname} take the field
              </div>
              <div className="mt-1 text-lg font-black">
                {offense.school.nickname} batting
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => simHalf()}
                  className="rounded-2xl bg-dirt-400 py-3 font-bold text-field-900"
                >
                  Sim ½ inning
                </button>
                <button
                  type="button"
                  onClick={() => setPitchChoices((c) => ({ ...c, [halfKey]: 'pitch' }))}
                  className="rounded-2xl border border-field-50/25 py-3 font-bold"
                >
                  Pitch this ½ inning
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ------------------------------------------------------- controls */}
      <footer className="flex items-center gap-2 bg-field-900/95 px-3 py-2">
        {userBatting && (
          <FooterButton onClick={() => simPa()}>Auto AB</FooterButton>
        )}
        <FooterButton onClick={() => simHalf()}>Sim ½</FooterButton>
        <FooterButton onClick={() => simToEnd()}>Sim Game</FooterButton>
        <div className="flex-1" />
        <div className="text-[10px] font-semibold uppercase tracking-widest text-field-50/40">
          {userBatting ? 'You’re batting' : mode === 'pitch' ? 'You’re pitching' : 'In the field'}
        </div>
      </footer>
    </div>
  )
}

function TeamChip({
  abbrev,
  colors,
  score,
  isUser,
}: {
  abbrev: string
  colors: { primary: string; secondary: string }
  score: number
  isUser: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="rounded-lg px-2 py-1 text-sm font-black"
        style={{ backgroundColor: colors.primary, color: colors.secondary }}
      >
        {abbrev}
      </span>
      <span className="text-2xl font-black tabular-nums">{score}</span>
      {isUser && <span className="text-[9px] font-bold uppercase tracking-wider text-dirt-400">You</span>}
    </div>
  )
}

function FooterButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-field-50/25 px-3 py-2 text-xs font-bold text-field-50/90 transition active:scale-95"
    >
      {children}
    </button>
  )
}
