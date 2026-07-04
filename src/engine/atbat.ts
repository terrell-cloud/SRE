// The heart of the game: one shared pitch-resolution model.
//
// resolvePitch() is called with a SwingInput that comes EITHER from
// aiSwing() (simmed at-bats) OR from the human's tap in the at-bat scene.
// Because both paths converge on the same resolver, simmed and manually
// played games are statistically consistent by construction.

import { BALANCE } from '../data/balance'
import { PITCH_TYPES } from '../data/pitchTypes'
import type {
  Count,
  PitchActual,
  PitchEvent,
  PitchPlan,
  Player,
  SwingInput,
  ZoneXY,
} from './types'
import { clamp, gaussian, pickWeighted, type Rng } from './rng'

const AB = BALANCE.atBat
const PI = BALANCE.pitching

/** -1..1 spread factor for a 1..99 rating, centered on 50. */
function spread(rating: number): number {
  return (rating - 50) / 49
}

export function isInZone(loc: ZoneXY): boolean {
  return Math.abs(loc.x) <= 1 && Math.abs(loc.y) <= 1
}

/** How far outside the zone a location is, in zone units (0 if inside). */
function zoneDistance(loc: ZoneXY): number {
  return Math.max(Math.abs(loc.x), Math.abs(loc.y)) - 1
}

// ---------------------------------------------------------------------------
// Pitcher AI
// ---------------------------------------------------------------------------

/** Pick a pitch type and target for the CPU pitcher. */
export function aiPitchPlan(pitcher: Player, _batter: Player, count: Count, rng: Rng): PitchPlan {
  const repertoire = pitcher.pitches.length
    ? pitcher.pitches
    : [{ type: 'FB' as const, quality: 50 }]
  // Weight by pitch quality; lean on the fastball when behind in the count.
  const behind = count.balls > count.strikes
  const weights = repertoire.map((p) => p.quality * (behind && p.type === 'FB' ? 1.8 : 1))
  const chosen = repertoire[pickWeighted(rng, weights)]

  // Ahead in the count: aim off the edge to induce a chase.
  // Behind or even: attack the zone, biased away from dead center.
  const ahead = count.strikes > count.balls
  const edge = ahead ? 1.15 : 0.62
  const target: ZoneXY = {
    x: (rng() < 0.5 ? -1 : 1) * edge * (0.55 + rng() * 0.45),
    y: gaussian(rng, ahead ? -0.35 : 0, 0.5),
  }
  return { type: chosen.type, target }
}

/** Apply the pitcher's control error to the plan: intent -> actual pitch.
 * `errorScale` lets the human accuracy-ring mechanic tighten or worsen the
 * scatter (perfect tap < 1, botched tap > 1); the default of 1 keeps AI
 * behavior — and the stat calibration — byte-identical. */
export function applyControl(
  plan: PitchPlan,
  pitcher: Player,
  fatiguePitches: number,
  rng: Rng,
  errorScale = 1,
): PitchActual {
  const def = PITCH_TYPES[plan.type]
  const overStamina = Math.max(0, fatiguePitches - pitcher.ratings.stamina)
  const sd =
    (PI.controlSdBase * (1 - PI.controlSdSpread * spread(pitcher.ratings.control)) +
      overStamina * PI.fatigueSdPerPitch) *
    errorScale
  const loc: ZoneXY = {
    x: plan.target.x + gaussian(rng, 0, sd),
    y: plan.target.y + gaussian(rng, 0, sd),
  }
  const speed =
    def.baseSpeed + PI.speedSpreadMph * spread(pitcher.ratings.velocity) +
    gaussian(rng, 0, PI.speedNoiseSd)
  return { type: plan.type, loc, speed }
}

// ---------------------------------------------------------------------------
// Batter AI — produces the same SwingInput shape a human tap produces
// ---------------------------------------------------------------------------

export function aiSwing(batter: Player, pitch: PitchActual, count: Count, rng: Rng): SwingInput {
  const { contact, eye } = batter.ratings
  const inZone = isInZone(pitch.loc)

  let swingProb: number
  if (count.balls === 3 && count.strikes === 0) {
    swingProb = AB.swingOn30
  } else if (inZone) {
    swingProb = AB.zoneSwingBase + AB.zoneSwingPerStrike * count.strikes
  } else {
    const dist = zoneDistance(pitch.loc)
    const discipline = AB.chaseEyeSpread * spread(eye)
    swingProb =
      (AB.chaseBase - discipline + (count.strikes === 2 ? 0.1 : 0)) *
      Math.exp(-AB.chaseDecay * dist)
    // With three balls, hitters hunt strikes and spit on borderline pitches.
    if (count.balls === 3) swingProb *= 0.45
  }

  if (rng() >= swingProb) {
    return { swung: false, timingErrorMs: 0, aimOffset: { x: 0, y: 0 } }
  }

  // Timing difficulty scales with pitch speed; contact rating shrinks both errors.
  const speedFactor = pitch.speed / 90
  const timingSd = AB.timingSdBase * (1 - AB.timingSdContactSpread * spread(contact)) * speedFactor
  const aimSd = AB.aimSdBase * (1 - AB.aimSdContactSpread * spread(contact))
  return {
    swung: true,
    timingErrorMs: gaussian(rng, 0, timingSd),
    aimOffset: { x: gaussian(rng, 0, aimSd), y: gaussian(rng, 0, aimSd) },
  }
}

// ---------------------------------------------------------------------------
// THE shared resolver
// ---------------------------------------------------------------------------

export function resolvePitch(
  batter: Player,
  pitcher: Player,
  pitch: PitchActual,
  swing: SwingInput,
  rng: Rng,
): PitchEvent {
  if (!swing.swung) {
    return isInZone(pitch.loc) ? { kind: 'calledStrike' } : { kind: 'ball' }
  }

  // Combined miss metric: 0 = perfect, larger = worse contact.
  const t = Math.abs(swing.timingErrorMs) / AB.timingNormMs
  const a = Math.hypot(swing.aimOffset.x, swing.aimOffset.y) / AB.aimNorm
  const miss = Math.hypot(t, a)

  const whiffBand =
    AB.whiffThreshold *
    (1 -
      AB.movementWhiffSpread * spread(pitcher.ratings.movement) -
      PITCH_TYPES[pitch.type].whiffBonus)

  if (miss > whiffBand) return { kind: 'swingMiss' }
  if (miss > AB.foulThreshold) return { kind: 'foul' }

  // Contact: quality 1 at a perfect swing, 0 at the foul threshold.
  const quality = 1 - miss / AB.foulThreshold
  const power = batter.ratings.power

  const exitVelo =
    AB.exitVeloFloor +
    quality * (AB.exitVeloRange + AB.exitVeloPowerBonus * ((power - 1) / 98)) +
    gaussian(rng, 0, AB.exitVeloNoiseSd)

  // Aiming under the ball (aim above its true location) lifts it; over squashes it.
  const launchAngle = clamp(
    gaussian(rng, AB.launchAngleMean + AB.launchAnglePowerTilt * (power - 50), AB.launchAngleSd) +
      swing.aimOffset.y * AB.launchAnglePerAimY,
    -20,
    80,
  )

  // Late swings (positive error) go opposite field, early swings pull.
  const sprayAngle = clamp(
    45 + swing.timingErrorMs * AB.sprayPerMs + gaussian(rng, 0, AB.spraySd),
    2,
    88,
  )

  return {
    kind: 'inPlay',
    battedBall: { exitVelo: clamp(exitVelo, 30, 118), launchAngle, sprayAngle },
  }
}
