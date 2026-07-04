import type { PitchTypeId } from '../engine/types'

export interface PitchTypeDef {
  id: PitchTypeId
  name: string
  /** mph at velocity rating 50; the velocity rating shifts this. */
  baseSpeed: number
  /** Horizontal/vertical movement in zone units, used by control error and the at-bat scene. */
  break: { x: number; y: number }
  /** Added to the whiff chance when the batter chases/mistimes this pitch. */
  whiffBonus: number
}

export const PITCH_TYPES: Record<PitchTypeId, PitchTypeDef> = {
  FB: { id: 'FB', name: 'Fastball', baseSpeed: 90, break: { x: 0, y: 0.05 }, whiffBonus: 0 },
  SL: { id: 'SL', name: 'Slider', baseSpeed: 82, break: { x: 0.3, y: -0.25 }, whiffBonus: 0.09 },
  CB: { id: 'CB', name: 'Curveball', baseSpeed: 74, break: { x: 0.15, y: -0.5 }, whiffBonus: 0.07 },
  CH: { id: 'CH', name: 'Changeup', baseSpeed: 79, break: { x: -0.12, y: -0.3 }, whiffBonus: 0.06 },
}
