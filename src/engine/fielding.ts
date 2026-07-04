// Turns a BattedBall into a play outcome using probability tables keyed on
// launch-angle category and exit velocity — no physics engine. Fielder
// quality shifts hit/error probabilities; runner speed drives extra bases.

import { BALANCE } from '../data/balance'
import type { BattedBall, GameTeam, PlayResult, Player } from './types'
import { chance, clamp, type Rng } from './rng'

const F = BALANCE.fielding

type Bases = [string | null, string | null, string | null]

function spread(rating: number): number {
  return (rating - 50) / 49
}

/** Average fielding rating of the 8 defenders behind the pitcher. */
export function teamDefense(team: GameTeam): number {
  const ids = Object.values(team.fielders)
  if (ids.length === 0) return 50
  let total = 0
  for (const id of ids) total += team.players[id]?.ratings.fielding ?? 50
  return total / ids.length
}

interface AdvanceState {
  bases: Bases
  runs: number
  scorers: string[]
}

/** Advance every runner (and the batter) a fixed number of bases. */
function advanceAll(bases: Bases, batterId: string | null, count: number): AdvanceState {
  const st: AdvanceState = { bases: [...bases] as Bases, runs: 0, scorers: [] }
  for (let step = 0; step < count; step++) {
    const [first, second, third] = st.bases
    if (third) {
      st.runs++
      st.scorers.push(third)
    }
    st.bases = [null, first, second]
  }
  if (batterId) {
    if (count >= 4) {
      st.runs++
      st.scorers.push(batterId)
    } else {
      st.bases[count - 1] = batterId
    }
  }
  return st
}

export function resolveBattedBall(
  bb: BattedBall,
  batter: Player,
  battingTeam: GameTeam,
  defense: GameTeam,
  bases: Bases,
  outs: number,
  rng: Rng,
): PlayResult {
  const runnerSpeed = (id: string) => battingTeam.players[id]?.ratings.speed ?? 50
  const def = teamDefense(defense)
  const defShift = F.defenseHitSpread * spread(def)
  const speed = batter.ratings.speed
  const { exitVelo: ev, launchAngle: la } = bb

  const single = (desc: string): PlayResult => {
    const st = advanceSingle(bases, batter.id, speed, rng)
    return { type: 'single', outsRecorded: 0, runsScored: st.runs, scorers: st.scorers, bases: st.bases, description: desc }
  }

  // --- Popups -------------------------------------------------------------
  if (la > 50) {
    if (ev < 68 && chance(rng, F.popupBloopChance)) return single('bloop single drops in')
    return out('popOut', 'popped out')
  }

  // --- Ground balls ---------------------------------------------------------
  if (la < 10) {
    const hitProb = clamp(
      F.groundHitBase + (ev - 78) * F.groundHitPerMph - defShift + (speed - 50) * F.infieldHitSpeedBonus,
      F.groundHitMin,
      F.groundHitMax,
    )
    if (chance(rng, hitProb)) {
      if (chance(rng, F.groundDoubleShare)) return extraBaseHit('double', 'grounded a double down the line')
      return single('ground ball single')
    }
    if (chance(rng, errorProb())) return reachedOnError()
    // Double play?
    if (bases[0] && outs < 2) {
      const dpProb = clamp(F.doublePlayBase - F.doublePlaySpeedSpread * spread(speed), 0.05, 0.7)
      if (chance(rng, dpProb)) {
        // Lead runner at 2B forced out + batter out at 1B; others advance.
        const rest: Bases = [null, bases[1], bases[2]]
        const st = advanceAll(rest, null, 1)
        return {
          type: 'doublePlay',
          outsRecorded: 2,
          runsScored: outs === 0 ? st.runs : 0,
          scorers: outs === 0 ? st.scorers : [],
          bases: outs === 0 ? st.bases : [null, bases[1], bases[2]],
          description: 'grounded into a double play',
        }
      }
    }
    // Routine groundout: runners in scoring position may move up.
    if (outs < 2 && (bases[1] || bases[2]) && chance(rng, F.advanceOnGroundOut)) {
      const st = advanceAll([null, bases[1], bases[2]], null, 1)
      return {
        type: 'groundOut',
        outsRecorded: 1,
        runsScored: st.runs,
        scorers: st.scorers,
        bases: [bases[0], st.bases[1], st.bases[2]],
        description: st.runs > 0 ? 'groundout, run scores' : 'groundout, runners advance',
      }
    }
    return out('groundOut', 'grounded out')
  }

  // --- Line drives ----------------------------------------------------------
  if (la < 25) {
    const hitProb = clamp(F.lineHitBase + (ev - 88) * F.lineHitPerMph - defShift, F.lineHitMin, F.lineHitMax)
    if (chance(rng, hitProb)) {
      const roll = rng()
      if (roll < F.lineTripleShare + spread(speed) * 0.015) return extraBaseHit('triple', 'ripped a triple into the gap')
      if (roll < F.lineTripleShare + F.lineDoubleShare) return extraBaseHit('double', 'lined a double')
      return single('line drive single')
    }
    if (chance(rng, errorProb())) return reachedOnError()
    return out('lineOut', 'lined out')
  }

  // --- Fly balls ------------------------------------------------------------
  const hrProb = ev > 88 ? Math.min(F.hrMax, 1 / (1 + Math.exp(-F.hrEvSlope * (ev - F.hrEvMidpoint)))) : 0
  if (chance(rng, hrProb)) {
    const st = advanceAll(bases, batter.id, 4)
    return {
      type: 'homeRun',
      outsRecorded: 0,
      runsScored: st.runs,
      scorers: st.scorers,
      bases: st.bases,
      description: st.runs > 1 ? `${st.runs}-run home run!` : 'solo home run!',
    }
  }
  const hitProb = clamp(F.flyHitBase + (ev - 85) * F.flyHitPerMph - defShift, F.flyHitMin, F.flyHitMax)
  if (chance(rng, hitProb)) {
    const roll = rng()
    if (roll < F.flyTripleShare + spread(speed) * 0.02) return extraBaseHit('triple', 'triple to the wall')
    if (roll < F.flyTripleShare + F.flyDoubleShare) return extraBaseHit('double', 'double off the wall')
    return single('flare drops for a single')
  }
  if (chance(rng, errorProb())) return reachedOnError()
  // Sac fly: deep enough with a runner on third and fewer than two outs.
  if (bases[2] && outs < 2 && ev >= F.sacFlyMinEv) {
    const runner = bases[2]!
    return {
      type: 'sacFly',
      outsRecorded: 1,
      runsScored: 1,
      scorers: [runner],
      bases: [bases[0], bases[1], null],
      description: 'sacrifice fly, run scores',
    }
  }
  return out('flyOut', 'flied out')

  // --- helpers --------------------------------------------------------------

  function out(type: 'groundOut' | 'flyOut' | 'lineOut' | 'popOut', desc: string): PlayResult {
    return { type, outsRecorded: 1, runsScored: 0, scorers: [], bases: [...bases] as Bases, description: desc }
  }

  function errorProb(): number {
    return clamp(F.errorBase - F.errorDefenseSpread * spread(def), 0.004, 0.08)
  }

  function reachedOnError(): PlayResult {
    const st = advanceSingle(bases, batter.id, speed, rng)
    return { type: 'error', outsRecorded: 0, runsScored: st.runs, scorers: st.scorers, bases: st.bases, description: 'reaches on an error' }
  }

  function extraBaseHit(type: 'double' | 'triple', desc: string): PlayResult {
    if (type === 'triple') {
      const st = advanceAll(bases, batter.id, 3)
      return { type, outsRecorded: 0, runsScored: st.runs, scorers: st.scorers, bases: st.bases, description: desc }
    }
    // Double: runners on 2B/3B score; runner on 1B scores sometimes, else to 3B.
    let runs = 0
    const scorers: string[] = []
    const newBases: Bases = [null, batter.id, null]
    for (const id of [bases[2], bases[1]]) {
      if (id) {
        runs++
        scorers.push(id)
      }
    }
    if (bases[0]) {
      if (chance(rng, clamp(F.scoreFromFirstOnDouble + spread(runnerSpeed(bases[0])) * 0.15, 0.1, 0.85))) {
        runs++
        scorers.push(bases[0])
      } else {
        newBases[2] = bases[0]
      }
    }
    return { type, outsRecorded: 0, runsScored: runs, scorers, bases: newBases, description: desc }
  }
}

/** Runner advancement on a single (also used for reach-on-error). */
function advanceSingle(bases: Bases, batterId: string, _batterSpeed: number, rng: Rng): AdvanceState {
  let runs = 0
  const scorers: string[] = []
  const newBases: Bases = [batterId, null, null]
  // Runner on third always scores.
  if (bases[2]) {
    runs++
    scorers.push(bases[2])
  }
  // Runner on second scores often, else to third.
  if (bases[1]) {
    if (chance(rng, F.scoreFromSecondOnSingle)) {
      runs++
      scorers.push(bases[1])
    } else {
      newBases[2] = bases[1]
    }
  }
  // Runner on first to second, occasionally third (if open).
  if (bases[0]) {
    if (!newBases[2] && chance(rng, F.firstToThirdOnSingle)) {
      newBases[2] = bases[0]
    } else {
      newBases[1] = bases[0]
    }
  }
  return { bases: newBases, runs, scorers }
}
