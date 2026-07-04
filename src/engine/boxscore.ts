import type { BattingLine, BattingLines, PitchingLine, PitchingLines } from './types'

export function emptyBattingLine(): BattingLine {
  return { ab: 0, r: 0, h: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, so: 0 }
}

export function emptyPitchingLine(): PitchingLine {
  return { outs: 0, h: 0, r: 0, er: 0, bb: 0, so: 0, pitches: 0 }
}

export function battingLineOf(lines: BattingLines, playerId: string): BattingLine {
  return (lines[playerId] ??= emptyBattingLine())
}

export function pitchingLineOf(lines: PitchingLines, playerId: string): PitchingLine {
  return (lines[playerId] ??= emptyPitchingLine())
}

/** "6.2" style innings-pitched display from outs recorded. */
export function ipDisplay(outs: number): string {
  return `${Math.floor(outs / 3)}.${outs % 3}`
}

export function battingAverage(line: BattingLine): string {
  if (line.ab === 0) return '.000'
  return (line.h / line.ab).toFixed(3).replace(/^0/, '')
}

export function era(line: PitchingLine): string {
  if (line.outs === 0) return line.er > 0 ? 'INF' : '0.00'
  return ((line.er * 9) / (line.outs / 3)).toFixed(2)
}
