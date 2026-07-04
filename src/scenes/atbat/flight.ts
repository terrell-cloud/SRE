// Pure geometry/timing for the at-bat scene: no DOM, no React.
// Zone units <-> canvas px mapping, ball flight interpolation, flight time.

import { BALANCE, type Difficulty } from '../../data/balance'
import { PITCH_TYPES } from '../../data/pitchTypes'
import { clamp } from '../../engine/rng'
import type { PitchActual, ZoneXY } from '../../engine/types'

export type { Difficulty }

const S = BALANCE.scene

/** All positions in CSS px, computed from the canvas CSS size. */
export interface SceneLayout {
  w: number
  h: number
  /** Strike-zone center. */
  zoneCx: number
  zoneCy: number
  /** Pixels per zone unit (zone half-width). */
  zoneUnitPx: number
  /** Pitcher release point. */
  releaseX: number
  releaseY: number
}

export function makeLayout(w: number, h: number): SceneLayout {
  return {
    w,
    h,
    zoneCx: w / 2,
    zoneCy: h * 0.62,
    zoneUnitPx: w * 0.155,
    releaseX: w / 2 + w * 0.05,
    releaseY: h * 0.18,
  }
}

export function zoneToPx(l: SceneLayout, p: ZoneXY): { x: number; y: number } {
  return { x: l.zoneCx + p.x * l.zoneUnitPx, y: l.zoneCy - p.y * l.zoneUnitPx }
}

export function pxToZone(l: SceneLayout, x: number, y: number): ZoneXY {
  return { x: (x - l.zoneCx) / l.zoneUnitPx, y: (l.zoneCy - y) / l.zoneUnitPx }
}

/** Flight duration scaled from pitch speed (slower pitch = longer look). */
export function flightMs(speed: number): number {
  return clamp(S.flightBaseMs * (90 / speed), S.flightMinMs, S.flightMaxMs)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Ball position + radius at flight progress t01 in [0,1].
 * Perspective: eased progress (slow far away, fast up close) and a radius
 * that grows quadratically. Break accumulates as u^2 so the ball looks
 * straight early and bends late — yet lands exactly on pitch.loc.
 */
export function ballPathPoint(
  l: SceneLayout,
  pitch: PitchActual,
  t01: number,
): { x: number; y: number; r: number } {
  const u = Math.pow(clamp(t01, 0, 1), 1.25)
  const brk = PITCH_TYPES[pitch.type].break
  const plate = zoneToPx(l, pitch.loc)
  const bx = brk.x * l.zoneUnitPx
  const by = -brk.y * l.zoneUnitPx
  return {
    x: lerp(l.releaseX, plate.x - bx, u) + bx * u * u,
    y: lerp(l.releaseY, plate.y - by, u) + by * u * u,
    r: lerp(3.5, 13, u * u),
  }
}
