import { battingAverage, era, ipDisplay } from '../../engine/boxscore'
import type { BattingLine, GameResult, GameTeam, PitchingLine } from '../../engine/types'
import { useGameStore } from '../../state/gameStore'

export default function BoxScoreScreen() {
  const exhibition = useGameStore((s) => s.exhibition)
  const newExhibition = useGameStore((s) => s.newExhibition)
  const goHome = useGameStore((s) => s.goHome)

  if (!exhibition) return null
  const { away, home, result } = exhibition

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-4 px-3 py-5 pb-24">
      <FinalBanner away={away} home={home} result={result} />
      <LineScore away={away} home={home} result={result} />
      <TeamBox team={away} result={result} />
      <TeamBox team={home} result={result} />

      <div className="fixed inset-x-0 bottom-0 mx-auto flex max-w-lg gap-2 bg-field-900/95 px-3 py-3 backdrop-blur">
        <button
          type="button"
          onClick={goHome}
          className="flex-1 rounded-xl border border-field-50/25 py-3 font-bold"
        >
          Home
        </button>
        <button
          type="button"
          onClick={() => newExhibition()}
          className="flex-1 rounded-xl bg-dirt-400 py-3 font-bold text-field-900"
        >
          Play Again
        </button>
      </div>
    </div>
  )
}

function FinalBanner({ away, home, result }: { away: GameTeam; home: GameTeam; result: GameResult }) {
  const awayWon = result.awayScore > result.homeScore
  return (
    <div className="rounded-2xl bg-field-800 p-4 text-center shadow">
      <div className="text-xs font-semibold uppercase tracking-widest text-field-50/60">
        Final{result.innings !== 9 ? ` / ${result.innings}` : ''}
      </div>
      <div className="mt-2 flex items-center justify-center gap-4">
        <TeamScore team={away} score={result.awayScore} won={awayWon} />
        <span className="text-field-50/40">@</span>
        <TeamScore team={home} score={result.homeScore} won={!awayWon} />
      </div>
    </div>
  )
}

function TeamScore({ team, score, won }: { team: GameTeam; score: number; won: boolean }) {
  return (
    <div className={`flex flex-col items-center ${won ? '' : 'opacity-60'}`}>
      <span
        className="rounded-lg px-2 py-0.5 text-sm font-bold"
        style={{ backgroundColor: team.school.colors.primary, color: team.school.colors.secondary }}
      >
        {team.school.abbrev}
      </span>
      <span className="mt-1 text-4xl font-black tabular-nums">{score}</span>
      <span className="mt-0.5 max-w-28 truncate text-xs text-field-50/70">{team.school.nickname}</span>
    </div>
  )
}

function teamHits(team: GameTeam, result: GameResult): number {
  let hits = 0
  for (const [id, line] of Object.entries(result.batting)) {
    if (team.players[id]) hits += line.h
  }
  return hits
}

function LineScore({ away, home, result }: { away: GameTeam; home: GameTeam; result: GameResult }) {
  const innings = result.linescore.away.length
  return (
    <div className="overflow-x-auto rounded-2xl bg-field-800 p-3 shadow">
      <table className="w-full text-center text-sm tabular-nums">
        <thead className="text-field-50/50">
          <tr>
            <th className="pr-2 text-left font-semibold"> </th>
            {Array.from({ length: innings }, (_, i) => (
              <th key={i} className="min-w-6 font-semibold">{i + 1}</th>
            ))}
            <th className="min-w-7 border-l border-field-50/20 font-bold text-field-50">R</th>
            <th className="min-w-7 font-bold text-field-50">H</th>
          </tr>
        </thead>
        <tbody>
          {([['away', away], ['home', home]] as const).map(([side, team]) => (
            <tr key={side} className="border-t border-field-50/10">
              <td className="pr-2 text-left font-bold">{team.school.abbrev}</td>
              {Array.from({ length: innings }, (_, i) => {
                const runs = result.linescore[side][i]
                return (
                  <td key={i} className="py-1 text-field-50/80">
                    {runs === undefined ? 'X' : runs}
                  </td>
                )
              })}
              <td className="border-l border-field-50/20 font-black">
                {side === 'away' ? result.awayScore : result.homeScore}
              </td>
              <td className="font-bold text-field-50/80">{teamHits(team, result)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TeamBox({ team, result }: { team: GameTeam; result: GameResult }) {
  // Show the position actually played, not the recruited one (the odd man
  // out of the fielding assignments is the DH).
  const playedPosition = (id: string) =>
    Object.entries(team.fielders).find(([, pid]) => pid === id)?.[0] ?? 'DH'
  const batters = team.lineup
    .map((id) => ({ player: team.players[id], line: result.batting[id], pos: playedPosition(id) }))
    .filter((b): b is { player: NonNullable<typeof b.player>; line: BattingLine; pos: string } => !!b.player && !!b.line)
  const pitchers = Object.entries(result.pitching)
    .filter(([id]) => team.players[id])
    .map(([id, line]) => ({ player: team.players[id], line: line as PitchingLine }))

  return (
    <section className="rounded-2xl bg-field-800 p-3 shadow">
      <h2 className="mb-2 flex items-center gap-2 font-black">
        <span
          className="rounded px-1.5 py-0.5 text-xs"
          style={{ backgroundColor: team.school.colors.primary, color: team.school.colors.secondary }}
        >
          {team.school.abbrev}
        </span>
        {team.school.name} {team.school.nickname}
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead className="text-xs uppercase text-field-50/50">
            <tr>
              <th className="py-1 text-left font-semibold">Batting</th>
              <th className="px-1.5 font-semibold">AB</th>
              <th className="px-1.5 font-semibold">R</th>
              <th className="px-1.5 font-semibold">H</th>
              <th className="px-1.5 font-semibold">HR</th>
              <th className="px-1.5 font-semibold">RBI</th>
              <th className="px-1.5 font-semibold">BB</th>
              <th className="px-1.5 font-semibold">SO</th>
              <th className="px-1.5 font-semibold">AVG</th>
            </tr>
          </thead>
          <tbody>
            {batters.map(({ player, line, pos }) => (
              <tr key={player.id} className="border-t border-field-50/10">
                <td className="max-w-36 truncate py-1 text-left">
                  <span className="text-field-50/40">{player.jerseyNumber} </span>
                  {player.firstName[0]}. {player.lastName}
                  <span className="ml-1 text-[10px] text-field-50/40">
                    {pos} · {player.classYear}
                  </span>
                </td>
                <Cell v={line.ab} />
                <Cell v={line.r} />
                <Cell v={line.h} strong={line.h > 0} />
                <Cell v={line.hr} strong={line.hr > 0} />
                <Cell v={line.rbi} />
                <Cell v={line.bb} />
                <Cell v={line.so} />
                <td className="px-1.5 text-center text-field-50/60">{battingAverage(line)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead className="text-xs uppercase text-field-50/50">
            <tr>
              <th className="py-1 text-left font-semibold">Pitching</th>
              <th className="px-1.5 font-semibold">IP</th>
              <th className="px-1.5 font-semibold">H</th>
              <th className="px-1.5 font-semibold">R</th>
              <th className="px-1.5 font-semibold">ER</th>
              <th className="px-1.5 font-semibold">BB</th>
              <th className="px-1.5 font-semibold">SO</th>
              <th className="px-1.5 font-semibold">P</th>
              <th className="px-1.5 font-semibold">ERA</th>
            </tr>
          </thead>
          <tbody>
            {pitchers.map(({ player, line }) => (
              <tr key={player.id} className="border-t border-field-50/10">
                <td className="max-w-36 truncate py-1 text-left">
                  <span className="text-field-50/40">{player.jerseyNumber} </span>
                  {player.firstName[0]}. {player.lastName}
                </td>
                <Cell v={ipDisplay(line.outs)} />
                <Cell v={line.h} />
                <Cell v={line.r} />
                <Cell v={line.er} />
                <Cell v={line.bb} />
                <Cell v={line.so} strong={line.so >= 6} />
                <Cell v={line.pitches} />
                <td className="px-1.5 text-center text-field-50/60">{era(line)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Cell({ v, strong }: { v: number | string; strong?: boolean }) {
  return <td className={`px-1.5 text-center ${strong ? 'font-bold text-dirt-400' : 'text-field-50/80'}`}>{v}</td>
}
