// Pure conversion of human input into engine contracts, including the
// assist layer. This is the ONLY place difficulty shapes gameplay — the
// engine's resolver never knows whether a SwingInput came from a human.

import { BALANCE, type Difficulty } from '../../data/balance'
import { clamp } from '../../engine/rng'
import type { SwingInput, ZoneXY } from '../../engine/types'

const A = BALANCE.assist
const S = BALANCE.scene

export interface HumanSwingParams {
  /** pointerdown timestamp of the SWING tap, or null if the player took. */
  tapTimeMs: number | null
  /** The moment the ball crosses the plate (t0 + flightMs). */
  crossTimeMs: number
  /** PCI position in zone units at swing time. */
  pci: ZoneXY
  /** Actual pitch location. */
  pitchLoc: ZoneXY
  /** Batter's contact rating (better = more forgiveness). */
  contact: number
  difficulty: Difficulty
}

/** Convert a human tap (or take) into the same SwingInput shape aiSwing rolls. */
export function toHumanSwing(p: HumanSwingParams): SwingInput {
  if (p.tapTimeMs === null) {
    return { swung: false, timingErrorMs: 0, aimOffset: { x: 0, y: 0 } }
  }

  const contactFactor = 1 - A.timingContactSpread * ((p.contact - 50) / 49)
  const timingErrorMs =
    (p.tapTimeMs - p.crossTimeMs) * A.timingForgiveness[p.difficulty] * contactFactor

  const shrink = 1 - A.aimShrink[p.difficulty]
  let off: ZoneXY = {
    x: (p.pci.x - p.pitchLoc.x) * shrink,
    y: (p.pci.y - p.pitchLoc.y) * shrink,
  }
  if (Math.hypot(off.x, off.y) < A.aimMagnetRadius) {
    off = { x: off.x * (1 - A.aimMagnetPull), y: off.y * (1 - A.aimMagnetPull) }
  }

  return { swung: true, timingErrorMs, aimOffset: off }
}

/** Accuracy-ring result (1 = perfect tap) -> control error multiplier. */
export function accuracyToErrorScale(accuracy01: number, difficulty: Difficulty): number {
  const acc = clamp(accuracy01, 0, 1)
  const max = A.pitchAccuracy.errorScaleMax[difficulty]
  return max - (max - A.pitchAccuracy.errorScaleMin) * acc
}

/** Keep the PCI within reach of the zone (chase-able but bounded). */
export function clampPci(p: ZoneXY): ZoneXY {
  const r = S.pciClampRange
  return { x: clamp(p.x, -r, r), y: clamp(p.y, -r, r) }
}
