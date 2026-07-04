// M2 engine deltas: StepResult, simHalfInning/simPlateAppearance, errorScale.

import { describe, expect, it } from 'vitest'
import { mulberry32 } from './rng'
import { applyControl } from './atbat'
import {
  buildGameTeam,
  createGame,
  simHalfInning,
  simPlateAppearance,
  stepPitch,
} from './game'
import { generatePlayer, generateRoster, generateSchool } from '../gen/players'
import type { GameState } from './types'

function freshGame(seed: number): { gs: GameState; rng: ReturnType<typeof mulberry32> } {
  const rng = mulberry32(seed)
  const away = buildGameTeam(generateSchool(rng, 50), generateRoster(rng, 50))
  const home = buildGameTeam(generateSchool(rng, 50), generateRoster(rng, 50))
  return { gs: createGame(away, home), rng }
}

describe('stepPitch StepResult', () => {
  it('returns an event on every live pitch and null after game over', () => {
    const { gs, rng } = freshGame(1)
    const result = stepPitch(gs, rng)
    expect(result.event).not.toBeNull()
    gs.gameOver = true
    expect(stepPitch(gs, rng)).toEqual({ event: null, play: null })
  })

  it('play is set exactly when the ball is in play', () => {
    const { gs, rng } = freshGame(2)
    for (let i = 0; i < 500 && !gs.gameOver; i++) {
      const { event, play } = stepPitch(gs, rng)
      if (event?.kind === 'inPlay') expect(play).not.toBeNull()
      else expect(play).toBeNull()
    }
  })
})

describe('simHalfInning', () => {
  it('advances exactly one half and resets the bases/outs/count', () => {
    const { gs, rng } = freshGame(3)
    expect(gs.half).toBe('top')
    simHalfInning(gs, rng)
    expect(gs.half).toBe('bottom')
    expect(gs.inning).toBe(1)
    expect(gs.outs).toBe(0)
    expect(gs.bases).toEqual([null, null, null])
    expect(gs.count).toEqual({ balls: 0, strikes: 0 })
  })

  it('can be chained through a whole game', () => {
    const { gs, rng } = freshGame(4)
    let guard = 0
    while (!gs.gameOver && guard++ < 60) simHalfInning(gs, rng)
    expect(gs.gameOver).toBe(true)
  })
})

describe('simPlateAppearance', () => {
  it('ends with a new batter or a new half', () => {
    const { gs, rng } = freshGame(5)
    const startIndex = gs.away.battingIndex
    simPlateAppearance(gs, rng)
    const changed = gs.away.battingIndex !== startIndex || gs.half !== 'top'
    expect(changed).toBe(true)
  })
})

describe('applyControl errorScale', () => {
  const pitcher = (() => {
    const p = generatePlayer(mulberry32(9), 'SP', 60, 'JR')
    p.ratings.control = 60
    return p
  })()

  it('errorScale=0 lands exactly on target', () => {
    const rng = mulberry32(7)
    const pitch = applyControl({ type: 'FB', target: { x: 0.4, y: -0.2 } }, pitcher, 0, rng, 0)
    expect(pitch.loc.x).toBeCloseTo(0.4, 9)
    expect(pitch.loc.y).toBeCloseTo(-0.2, 9)
  })

  it('default errorScale reproduces the pre-M2 sequence (calibration regression)', () => {
    // Explicit 1 and omitted must be byte-identical from the same rng state.
    const a = applyControl({ type: 'FB', target: { x: 0, y: 0 } }, pitcher, 10, mulberry32(11))
    const b = applyControl({ type: 'FB', target: { x: 0, y: 0 } }, pitcher, 10, mulberry32(11), 1)
    expect(a).toEqual(b)
  })

  it('larger errorScale scatters more', () => {
    const spreadOf = (scale: number) => {
      const rng = mulberry32(21)
      let total = 0
      for (let i = 0; i < 3000; i++) {
        const p = applyControl({ type: 'FB', target: { x: 0, y: 0 } }, pitcher, 0, rng, scale)
        total += Math.hypot(p.loc.x, p.loc.y)
      }
      return total / 3000
    }
    expect(spreadOf(0.35)).toBeLessThan(spreadOf(1.5) * 0.4)
  })
})
