// Full-game Monte Carlo: the balance harness. `npm run calibrate` runs this
// file and prints the league-wide stat table — tune data/balance.ts against
// it, not against vibes.

import { describe, expect, it } from 'vitest'
import { deriveSeed, mulberry32 } from './rng'
import { buildGameTeam, createGame, simGame } from './game'
import { generateRoster, generateSchool } from '../gen/players'
import type { GameResult } from './types'

interface LeagueTotals {
  games: number
  ab: number
  h: number
  hr: number
  bb: number
  so: number
  runs: number
  outsPitched: number
  er: number
  maxInnings: number
  awayWins: number
  homeWins: number
}

function playGames(nGames: number, seed: number, prestigeA = 50, prestigeB = 50): LeagueTotals {
  const totals: LeagueTotals = {
    games: 0, ab: 0, h: 0, hr: 0, bb: 0, so: 0, runs: 0,
    outsPitched: 0, er: 0, maxInnings: 0, awayWins: 0, homeWins: 0,
  }
  for (let g = 0; g < nGames; g++) {
    const rng = mulberry32(deriveSeed(seed, g))
    const away = buildGameTeam(generateSchool(rng, prestigeA), generateRoster(rng, prestigeA))
    const home = buildGameTeam(generateSchool(rng, prestigeB), generateRoster(rng, prestigeB))
    const result: GameResult = simGame(createGame(away, home), rng)

    totals.games++
    totals.runs += result.awayScore + result.homeScore
    totals.maxInnings = Math.max(totals.maxInnings, result.innings)
    if (result.awayScore > result.homeScore) totals.awayWins++
    else if (result.homeScore > result.awayScore) totals.homeWins++
    for (const line of Object.values(result.batting)) {
      totals.ab += line.ab
      totals.h += line.h
      totals.hr += line.hr
      totals.bb += line.bb
      totals.so += line.so
    }
    for (const line of Object.values(result.pitching)) {
      totals.outsPitched += line.outs
      totals.er += line.er
    }
  }
  return totals
}

function report(t: LeagueTotals): Record<string, string | number> {
  return {
    games: t.games,
    BA: (t.h / t.ab).toFixed(3),
    'HR/game': (t.hr / t.games).toFixed(2),
    'BB/game': (t.bb / t.games).toFixed(2),
    'K/game': (t.so / t.games).toFixed(2),
    'runs/game (both teams)': (t.runs / t.games).toFixed(2),
    ERA: ((t.er * 9) / (t.outsPitched / 3)).toFixed(2),
    maxInnings: t.maxInnings,
    'home win %': ((t.homeWins / t.games) * 100).toFixed(1),
  }
}

describe('simGame calibration', () => {
  it('produces plausible college baseball stats over 2000 games', () => {
    const totals = playGames(2000, 20260704)
    // eslint-disable-next-line no-console
    console.table(report(totals))

    const ba = totals.h / totals.ab
    const hrPerGame = totals.hr / totals.games
    const runsPerGame = totals.runs / totals.games
    const era = (totals.er * 9) / (totals.outsPitched / 3)
    const kPerTeamPer9 = totals.so / 2 / totals.games
    const bbPerTeamPer9 = totals.bb / 2 / totals.games

    expect(ba).toBeGreaterThan(0.24)
    expect(ba).toBeLessThan(0.31)
    expect(hrPerGame).toBeGreaterThan(0.4)
    expect(hrPerGame).toBeLessThan(2.0)
    expect(runsPerGame).toBeGreaterThan(7)
    expect(runsPerGame).toBeLessThan(14)
    expect(era).toBeGreaterThan(3.5)
    expect(era).toBeLessThan(7.0)
    expect(kPerTeamPer9).toBeGreaterThan(5)
    expect(kPerTeamPer9).toBeLessThan(12)
    expect(bbPerTeamPer9).toBeGreaterThan(2)
    expect(bbPerTeamPer9).toBeLessThan(6.5)
    expect(totals.maxInnings).toBeLessThanOrEqual(20)
  }, 120_000)

  it('is deterministic: same seed, same result', () => {
    const run = (seed: number) => {
      const rng = mulberry32(seed)
      const away = buildGameTeam(generateSchool(rng, 55), generateRoster(rng, 55))
      const home = buildGameTeam(generateSchool(rng, 45), generateRoster(rng, 45))
      const r = simGame(createGame(away, home), rng)
      return `${r.awayScore}-${r.homeScore}-${r.innings}`
    }
    expect(run(31337)).toBe(run(31337))
  })

  it('better teams win clearly more often', () => {
    const totals = playGames(400, 777, 85, 25) // strong away team vs weak home team
    expect(totals.awayWins / totals.games).toBeGreaterThan(0.62)
  }, 60_000)

  it('every game ends and scores are sane', () => {
    for (let seed = 0; seed < 50; seed++) {
      const rng = mulberry32(deriveSeed(9999, seed))
      const away = buildGameTeam(generateSchool(rng, 50), generateRoster(rng, 50))
      const home = buildGameTeam(generateSchool(rng, 50), generateRoster(rng, 50))
      const r = simGame(createGame(away, home), rng)
      expect(r.innings).toBeGreaterThanOrEqual(9)
      expect(r.innings).toBeLessThanOrEqual(20)
      expect(r.awayScore + r.homeScore).toBeLessThan(60)
      if (r.innings < 20) expect(r.awayScore).not.toBe(r.homeScore) // extras resolve ties; the 20-inning cap may not
      // Line score length matches innings played.
      expect(r.linescore.away.length).toBe(r.innings)
    }
  }, 60_000)
})
