// Game state machine. stepPitch() advances exactly one pitch — the
// interactive at-bat scene (M2) drives it one call per pitch, and simGame()
// loops the very same function, so simmed and played games share one model.

import { BALANCE } from '../data/balance'
import { aiPitchPlan, aiSwing, applyControl, resolvePitch } from './atbat'
import { battingLineOf, pitchingLineOf } from './boxscore'
import { resolveBattedBall } from './fielding'
import type {
  GameResult,
  GameState,
  GameTeam,
  PitchActual,
  Player,
  School,
  SwingInput,
} from './types'
import type { Rng } from './rng'

const G = BALANCE.game
const MAX_LOG = 12

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const FIELD_POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'] as const

export function overallBatter(p: Player): number {
  const r = p.ratings
  return r.contact * 0.35 + r.power * 0.25 + r.eye * 0.15 + r.speed * 0.1 + r.fielding * 0.1 + r.arm * 0.05
}

export function overallPitcher(p: Player): number {
  const r = p.ratings
  return r.velocity * 0.3 + r.control * 0.3 + r.movement * 0.25 + r.stamina * 0.15
}

/** Build a GameTeam from a school + 18-man roster: lineup, defense, staff. */
export function buildGameTeam(school: School, roster: Player[]): GameTeam {
  const players: Record<string, Player> = {}
  for (const p of roster) players[p.id] = p

  const positionPlayers = roster.filter((p) => p.position !== 'SP' && p.position !== 'RP')
  const starters = roster.filter((p) => p.position === 'SP').sort((a, b) => overallPitcher(b) - overallPitcher(a))
  const relievers = roster.filter((p) => p.position === 'RP').sort((a, b) => overallPitcher(b) - overallPitcher(a))

  // Fill the 8 field positions with the best available at each spot, then
  // the best remaining bat DHs.
  const fielders: Record<string, string> = {}
  const taken = new Set<string>()
  for (const pos of FIELD_POSITIONS) {
    const candidates = positionPlayers.filter((p) => !taken.has(p.id))
    if (candidates.length === 0) break
    const atPos = candidates.filter((p) => p.position === pos)
    const chosen = (atPos.length ? atPos : candidates).sort((a, b) => overallBatter(b) - overallBatter(a))[0]
    fielders[pos] = chosen.id
    taken.add(chosen.id)
  }
  const dh = positionPlayers
    .filter((p) => !taken.has(p.id))
    .sort((a, b) => overallBatter(b) - overallBatter(a))[0]
  const nine = [...Object.values(fielders), ...(dh ? [dh.id] : [])]
  // Batting order: best hitters up top (simple but sane for V1).
  const lineup = nine.sort((a, b) => overallBatter(players[b]) - overallBatter(players[a]))

  return {
    school,
    players,
    lineup,
    fielders,
    pitcherId: starters[0]?.id ?? relievers[0]?.id ?? roster[0].id,
    bullpen: [...starters.slice(1).map((p) => p.id), ...relievers.map((p) => p.id)].filter(
      (id) => id !== (starters[0]?.id ?? relievers[0]?.id),
    ),
    battingIndex: 0,
  }
}

export function createGame(away: GameTeam, home: GameTeam): GameState {
  return {
    inning: 1,
    half: 'top',
    outs: 0,
    bases: [null, null, null],
    count: { balls: 0, strikes: 0 },
    away,
    home,
    score: { away: 0, home: 0 },
    linescore: { away: [0], home: [] },
    batting: {},
    pitching: {},
    pitchCounts: {},
    gameOver: false,
    log: [],
  }
}

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

export function battingTeam(gs: GameState): GameTeam {
  return gs.half === 'top' ? gs.away : gs.home
}

export function fieldingTeam(gs: GameState): GameTeam {
  return gs.half === 'top' ? gs.home : gs.away
}

export function currentBatter(gs: GameState): Player {
  const team = battingTeam(gs)
  return team.players[team.lineup[team.battingIndex % team.lineup.length]]
}

export function currentPitcher(gs: GameState): Player {
  const team = fieldingTeam(gs)
  return team.players[team.pitcherId]
}

// ---------------------------------------------------------------------------
// stepPitch — the single source of game advancement
// ---------------------------------------------------------------------------

export interface StepOptions {
  /** Human batting: the tap converted to a SwingInput. Omitted = aiSwing. */
  swing?: SwingInput
  /** Human pitching: a pre-built pitch (M6). Omitted = AI plan + control. */
  pitch?: PitchActual
}

/** Advance the game by exactly one pitch. Mutates and returns gs. */
export function stepPitch(gs: GameState, rng: Rng, opts: StepOptions = {}): GameState {
  if (gs.gameOver) return gs

  const batter = currentBatter(gs)
  const pitcher = currentPitcher(gs)
  const offense = battingTeam(gs)
  const defense = fieldingTeam(gs)

  const pitchCount = (gs.pitchCounts[pitcher.id] ?? 0) + 1
  gs.pitchCounts[pitcher.id] = pitchCount
  pitchingLineOf(gs.pitching, pitcher.id).pitches++

  const pitch =
    opts.pitch ?? applyControl(aiPitchPlan(pitcher, batter, gs.count, rng), pitcher, pitchCount, rng)
  const swing = opts.swing ?? aiSwing(batter, pitch, gs.count, rng)
  const event = resolvePitch(batter, pitcher, pitch, swing, rng)

  switch (event.kind) {
    case 'ball': {
      gs.count.balls++
      if (gs.count.balls >= 4) {
        battingLineOf(gs.batting, batter.id).bb++
        pitchingLineOf(gs.pitching, pitcher.id).bb++
        applyWalk(gs, batter.id)
        endPlateAppearance(gs, `${batter.lastName} walks`)
      }
      break
    }
    case 'calledStrike':
    case 'swingMiss': {
      gs.count.strikes++
      if (gs.count.strikes >= 3) {
        const bLine = battingLineOf(gs.batting, batter.id)
        bLine.ab++
        bLine.so++
        const pLine = pitchingLineOf(gs.pitching, pitcher.id)
        pLine.so++
        pLine.outs++
        gs.outs++
        endPlateAppearance(gs, `${batter.lastName} strikes out ${event.kind === 'swingMiss' ? 'swinging' : 'looking'}`)
      }
      break
    }
    case 'foul': {
      if (gs.count.strikes < 2) gs.count.strikes++
      break
    }
    case 'inPlay': {
      const play = resolveBattedBall(event.battedBall, batter, offense, defense, gs.bases, gs.outs, rng)
      const bLine = battingLineOf(gs.batting, batter.id)
      const pLine = pitchingLineOf(gs.pitching, pitcher.id)

      if (play.type !== 'sacFly') bLine.ab++
      if (play.type === 'single' || play.type === 'double' || play.type === 'triple' || play.type === 'homeRun') {
        bLine.h++
        pLine.h++
        if (play.type === 'double') bLine.doubles++
        if (play.type === 'triple') bLine.triples++
        if (play.type === 'homeRun') bLine.hr++
      }
      if (play.type !== 'error') bLine.rbi += play.runsScored
      pLine.outs += play.outsRecorded
      // V1 simplification: all runs charged as earned to the current pitcher.
      pLine.r += play.runsScored
      pLine.er += play.type === 'error' ? 0 : play.runsScored
      for (const scorer of play.scorers) battingLineOf(gs.batting, scorer).r++

      gs.outs += play.outsRecorded
      gs.bases = play.bases
      addRuns(gs, play.runsScored)
      endPlateAppearance(gs, `${batter.lastName} ${play.description}`)
      break
    }
  }

  checkPitchingChange(gs)
  checkHalfInningAndGameEnd(gs)
  return gs
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function applyWalk(gs: GameState, batterId: string): void {
  const [first, second, third] = gs.bases
  let runs = 0
  if (first && second && third) {
    runs = 1
    battingLineOf(gs.batting, third).r++
    battingLineOf(gs.batting, batterId).rbi++
    const pitcher = currentPitcher(gs)
    const pLine = pitchingLineOf(gs.pitching, pitcher.id)
    pLine.r++
    pLine.er++
    gs.bases = [batterId, first, second]
  } else if (first && second) {
    gs.bases = [batterId, first, second]
  } else if (first) {
    gs.bases = [batterId, first, third]
  } else {
    gs.bases = [batterId, second, third]
  }
  addRuns(gs, runs)
}

function addRuns(gs: GameState, runs: number): void {
  if (runs <= 0) return
  const side = gs.half === 'top' ? 'away' : 'home'
  gs.score[side] += runs
  const line = gs.linescore[side]
  line[line.length - 1] += runs
}

function endPlateAppearance(gs: GameState, description: string): void {
  gs.count = { balls: 0, strikes: 0 }
  const team = battingTeam(gs)
  team.battingIndex = (team.battingIndex + 1) % team.lineup.length
  gs.log.push(description)
  if (gs.log.length > MAX_LOG) gs.log.shift()
  // Walk-off check happens in checkHalfInningAndGameEnd.
}

function checkPitchingChange(gs: GameState): void {
  const defense = fieldingTeam(gs)
  const pitcher = defense.players[defense.pitcherId]
  const thrown = gs.pitchCounts[pitcher.id] ?? 0
  const limit = Math.min(
    pitcher.ratings.stamina * BALANCE.pitching.pullFactor,
    BALANCE.pitching.hardPitchCap,
  )
  if (thrown >= limit && defense.bullpen.length > 0) {
    defense.pitcherId = defense.bullpen.shift()!
  }
}

function checkHalfInningAndGameEnd(gs: GameState): void {
  const homeLeads = gs.score.home > gs.score.away
  const awayLeads = gs.score.away > gs.score.home

  // Walk-off: home team takes the lead in the bottom of the 9th or later.
  if (gs.half === 'bottom' && gs.inning >= G.innings && homeLeads) {
    gs.gameOver = true
    gs.log.push(`${gs.home.school.nickname} walk it off!`)
    return
  }

  if (gs.outs < 3) return

  // Half-inning over.
  gs.outs = 0
  gs.bases = [null, null, null]
  gs.count = { balls: 0, strikes: 0 }

  if (gs.half === 'top') {
    // Home team doesn't bat in the 9th+ if already ahead.
    if (gs.inning >= G.innings && homeLeads) {
      gs.gameOver = true
      return
    }
    gs.half = 'bottom'
    gs.linescore.home.push(0)
  } else {
    if (gs.inning >= G.innings && (homeLeads || awayLeads)) {
      gs.gameOver = true
      return
    }
    if (gs.inning >= G.maxInnings) {
      // Safety valve: call it (should be vanishingly rare).
      gs.gameOver = true
      return
    }
    gs.half = 'top'
    gs.inning++
    gs.linescore.away.push(0)
  }
}

// ---------------------------------------------------------------------------
// Full-game sims
// ---------------------------------------------------------------------------

export function toResult(gs: GameState): GameResult {
  return {
    awayScore: gs.score.away,
    homeScore: gs.score.home,
    innings: gs.inning,
    linescore: gs.linescore,
    batting: gs.batting,
    pitching: gs.pitching,
    awaySchoolId: gs.away.school.id,
    homeSchoolId: gs.home.school.id,
  }
}

/** Pitch-level Monte Carlo of the rest of the game. */
export function simGame(gs: GameState, rng: Rng): GameResult {
  let guard = 0
  while (!gs.gameOver && guard++ < 5000) {
    stepPitch(gs, rng)
  }
  gs.gameOver = true
  return toResult(gs)
}
