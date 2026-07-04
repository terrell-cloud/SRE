// All canvas drawing for the at-bat scene. Pure functions of (ctx, layout,
// view) — no React, no store access, nothing allocated per frame beyond
// what canvas requires.

import { BALANCE } from '../../data/balance'
import { zoneToPx, type SceneLayout } from './flight'
import type { ZoneXY } from '../../engine/types'

export type PitcherPose = 'idle' | 'windup' | 'release'

export interface SceneView {
  mode: 'bat' | 'pitch' | 'hold'
  pitcherPose: PitcherPose
  pitcherColor: string
  batterColor: string
  /** Ball in flight (px). */
  ball: { x: number; y: number; r: number } | null
  /** PCI in zone units (bat mode). */
  pci: ZoneXY | null
  /** Target reticle in zone units (pitch mode). */
  reticle: ZoneXY | null
  /** Accuracy ring radius in zone units (pitch mode, around reticle). */
  ringRadius: number | null
  /** Contact/swing flash 0..1 (fades). */
  swingFlash: number
}

export function drawFrame(ctx: CanvasRenderingContext2D, l: SceneLayout, v: SceneView): void {
  drawField(ctx, l)
  drawPitcher(ctx, l, v.pitcherPose, v.pitcherColor)
  drawBatter(ctx, l, v.batterColor, v.swingFlash > 0)
  drawZone(ctx, l)
  if (v.reticle) drawReticle(ctx, l, v.reticle, v.ringRadius)
  if (v.ball) drawBall(ctx, v.ball.x, v.ball.y, v.ball.r)
  if (v.pci) drawPci(ctx, l, v.pci)
  if (v.swingFlash > 0) drawSwingFlash(ctx, l, v.swingFlash)
}

function drawField(ctx: CanvasRenderingContext2D, l: SceneLayout): void {
  // Grass
  const sky = ctx.createLinearGradient(0, 0, 0, l.h)
  sky.addColorStop(0, '#1a6b3c')
  sky.addColorStop(0.45, '#15803d')
  sky.addColorStop(1, '#166534')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, l.w, l.h)

  // Mowed stripes converging toward the mound (subtle depth cue)
  ctx.save()
  ctx.globalAlpha = 0.05
  ctx.fillStyle = '#ffffff'
  for (let i = -3; i <= 3; i += 2) {
    ctx.beginPath()
    ctx.moveTo(l.w / 2 + i * l.w * 0.05, l.h * 0.12)
    ctx.lineTo(l.w / 2 + i * l.w * 0.18, l.h)
    ctx.lineTo(l.w / 2 + (i + 1) * l.w * 0.18, l.h)
    ctx.lineTo(l.w / 2 + (i + 1) * l.w * 0.05, l.h * 0.12)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()

  // Mound
  ctx.fillStyle = '#c99a5b'
  ctx.beginPath()
  ctx.ellipse(l.w / 2, l.h * 0.2, l.w * 0.13, l.w * 0.05, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#e7e5e4'
  ctx.fillRect(l.w / 2 - 7, l.h * 0.2 - 2, 14, 4)

  // Dirt circle around the plate area
  ctx.fillStyle = '#d6a35c'
  ctx.beginPath()
  ctx.ellipse(l.zoneCx, l.h * 0.94, l.w * 0.42, l.h * 0.1, 0, 0, Math.PI * 2)
  ctx.fill()

  // Home plate
  const py = l.h * 0.905
  const pw = l.zoneUnitPx * 1.15
  ctx.fillStyle = '#fafaf5'
  ctx.beginPath()
  ctx.moveTo(l.zoneCx - pw / 2, py)
  ctx.lineTo(l.zoneCx + pw / 2, py)
  ctx.lineTo(l.zoneCx + pw / 2, py + pw * 0.28)
  ctx.lineTo(l.zoneCx, py + pw * 0.52)
  ctx.lineTo(l.zoneCx - pw / 2, py + pw * 0.28)
  ctx.closePath()
  ctx.fill()
}

function drawPitcher(
  ctx: CanvasRenderingContext2D,
  l: SceneLayout,
  pose: PitcherPose,
  color: string,
): void {
  const cx = l.w / 2
  const cy = l.h * 0.155
  const s = l.w * 0.024 // scale unit

  ctx.save()
  ctx.translate(cx, cy)

  // Legs
  ctx.strokeStyle = '#e7e5e4'
  ctx.lineWidth = s * 0.9
  ctx.lineCap = 'round'
  ctx.beginPath()
  if (pose === 'windup') {
    ctx.moveTo(-s * 0.4, s * 1.6)
    ctx.lineTo(-s * 0.5, s * 3)
    ctx.moveTo(s * 0.4, s * 1.6)
    ctx.lineTo(s * 1.1, s * 2.2) // leg lift
  } else {
    ctx.moveTo(-s * 0.4, s * 1.6)
    ctx.lineTo(-s * 0.8, s * 3)
    ctx.moveTo(s * 0.4, s * 1.6)
    ctx.lineTo(s * 0.8, s * 3)
  }
  ctx.stroke()

  // Torso
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(-s * 1.1, -s * 0.4, s * 2.2, s * 2.2, s * 0.8)
  ctx.fill()

  // Throwing arm
  ctx.strokeStyle = color
  ctx.lineWidth = s * 0.7
  ctx.beginPath()
  if (pose === 'windup') {
    ctx.moveTo(s * 0.9, s * 0.2)
    ctx.lineTo(s * 1.9, -s * 1.3) // arm up
  } else if (pose === 'release') {
    ctx.moveTo(s * 0.9, s * 0.2)
    ctx.lineTo(s * 2.1, s * 0.9) // follow-through
  } else {
    ctx.moveTo(s * 0.9, s * 0.3)
    ctx.lineTo(s * 1.5, s * 1.2)
  }
  ctx.stroke()

  // Head + cap
  ctx.fillStyle = '#f1c27d'
  ctx.beginPath()
  ctx.arc(0, -s * 1.15, s * 0.75, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(0, -s * 1.35, s * 0.72, Math.PI, 0)
  ctx.fill()
  ctx.fillRect(-s * 0.72, -s * 1.4, s * 1.44, s * 0.18)

  ctx.restore()
}

/** Batter silhouette standing lefty-box (screen left of the zone). */
function drawBatter(
  ctx: CanvasRenderingContext2D,
  l: SceneLayout,
  color: string,
  swinging: boolean,
): void {
  const s = l.w * 0.055 // scale unit — larger than the pitcher (closer to camera)
  const cx = l.zoneCx - l.zoneUnitPx * 2.1
  const cy = l.zoneCy + l.zoneUnitPx * 0.4

  ctx.save()
  ctx.translate(cx, cy)
  ctx.globalAlpha = 0.92

  // Legs
  ctx.strokeStyle = '#d6d3d1'
  ctx.lineWidth = s * 0.42
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-s * 0.25, s * 0.7)
  ctx.lineTo(-s * 0.45, s * 1.7)
  ctx.moveTo(s * 0.25, s * 0.7)
  ctx.lineTo(s * 0.5, s * 1.7)
  ctx.stroke()

  // Torso, slightly leaning toward the plate
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(-s * 0.55, -s * 0.55, s * 1.1, s * 1.35, s * 0.4)
  ctx.fill()

  // Bat: cocked behind the shoulder, or blurred forward mid-swing
  ctx.strokeStyle = '#d6a35c'
  ctx.lineWidth = s * 0.22
  ctx.beginPath()
  if (swinging) {
    ctx.moveTo(s * 0.45, -s * 0.35)
    ctx.lineTo(s * 1.9, s * 0.35)
  } else {
    ctx.moveTo(s * 0.45, -s * 0.5)
    ctx.lineTo(s * 1.0, -s * 1.6)
  }
  ctx.stroke()

  // Head + helmet
  ctx.fillStyle = '#f1c27d'
  ctx.beginPath()
  ctx.arc(s * 0.1, -s * 0.95, s * 0.42, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1c1917'
  ctx.beginPath()
  ctx.arc(s * 0.1, -s * 1.05, s * 0.42, Math.PI * 0.95, Math.PI * 2.05)
  ctx.fill()

  ctx.restore()
}

function drawZone(ctx: CanvasRenderingContext2D, l: SceneLayout): void {
  const half = l.zoneUnitPx
  const x = l.zoneCx - half
  const y = l.zoneCy - half
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.fillRect(x, y, half * 2, half * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, half * 2, half * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 1
  for (let i = 1; i < 3; i++) {
    const t = (i / 3) * half * 2
    ctx.beginPath()
    ctx.moveTo(x + t, y)
    ctx.lineTo(x + t, y + half * 2)
    ctx.moveTo(x, y + t)
    ctx.lineTo(x + half * 2, y + t)
    ctx.stroke()
  }
  ctx.restore()
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.save()
  // Shadow-ish outline for contrast on grass
  ctx.beginPath()
  ctx.arc(x, y, r + 1.5, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = '#fafaf5'
  ctx.fill()
  // Seams
  ctx.strokeStyle = '#dc2626'
  ctx.lineWidth = Math.max(1, r * 0.14)
  ctx.beginPath()
  ctx.arc(x - r * 0.55, y, r * 0.75, -0.9, 0.9)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x + r * 0.55, y, r * 0.75, Math.PI - 0.9, Math.PI + 0.9)
  ctx.stroke()
  ctx.restore()
}

function drawPci(ctx: CanvasRenderingContext2D, l: SceneLayout, pci: ZoneXY): void {
  const { x, y } = zoneToPx(l, pci)
  const r = BALANCE.scene.pciRadiusZone * l.zoneUnitPx
  ctx.save()
  ctx.strokeStyle = 'rgba(251,191,36,0.95)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(251,191,36,0.5)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(x - r * 0.55, y)
  ctx.lineTo(x + r * 0.55, y)
  ctx.moveTo(x, y - r * 0.55)
  ctx.lineTo(x, y + r * 0.55)
  ctx.stroke()
  ctx.restore()
}

function drawReticle(
  ctx: CanvasRenderingContext2D,
  l: SceneLayout,
  target: ZoneXY,
  ringRadius: number | null,
): void {
  const { x, y } = zoneToPx(l, target)
  const r = 0.3 * l.zoneUnitPx
  ctx.save()
  ctx.strokeStyle = 'rgba(96,165,250,0.95)'
  ctx.lineWidth = 2.5
  ctx.setLineDash([6, 5])
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = 'rgba(96,165,250,0.9)'
  ctx.beginPath()
  ctx.arc(x, y, 3, 0, Math.PI * 2)
  ctx.fill()
  if (ringRadius !== null) {
    ctx.strokeStyle = 'rgba(251,191,36,0.9)'
    ctx.lineWidth = 3.5
    ctx.beginPath()
    ctx.arc(x, y, ringRadius * l.zoneUnitPx, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

function drawSwingFlash(ctx: CanvasRenderingContext2D, l: SceneLayout, alpha: number): void {
  ctx.save()
  ctx.globalAlpha = alpha * 0.85
  ctx.strokeStyle = '#fef9c3'
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  ctx.beginPath()
  // Bat arc sweeping across the lower zone
  ctx.arc(l.zoneCx + l.zoneUnitPx * 1.6, l.zoneCy + l.zoneUnitPx * 0.9, l.zoneUnitPx * 2.1, Math.PI * 0.8, Math.PI * 1.25)
  ctx.stroke()
  ctx.restore()
}
