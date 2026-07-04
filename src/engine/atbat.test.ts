import { describe, expect, it } from 'vitest'
import { mulberry32 } from './rng'
import { aiPitchPlan, aiSwing, applyControl, resolvePitch } from './atbat'
import { generatePlayer } from '../gen/players'
import type { Count, Player } from './types'

function makeBatter(contact: number, power = 50, eye = 50): Player {
  const p = generatePlayer(mulberry32(1), 'CF', 50, 'JR')
  p.ratings = { ...p.ratings, contact, power, eye }
  return p
}

function makePitcher(overall: number): Player {
  const p = generatePlayer(mulberry32(2), 'SP', 50, 'JR')
  p.ratings = {
    ...p.ratings,
    velocity: overall,
    control: overall,
    movement: overall,
    stamina: 70,
  }
  return p
}

/** Simulate n plate-appearance-opening pitches and count whiffs on swings. */
function whiffRate(batter: Player, pitcher: Player, seed: number, n = 10000): number {
  const rng = mulberry32(seed)
  const count: Count = { balls: 0, strikes: 0 }
  let swings = 0
  let whiffs = 0
  for (let i = 0; i < n; i++) {
    const pitch = applyControl(aiPitchPlan(pitcher, batter, count, rng), pitcher, 0, rng)
    const swing = aiSwing(batter, pitch, count, rng)
    if (!swing.swung) continue
    swings++
    const ev = resolvePitch(batter, pitcher, pitch, swing, rng)
    if (ev.kind === 'swingMiss') whiffs++
  }
  expect(swings).toBeGreaterThan(n * 0.3)
  return whiffs / swings
}

describe('resolvePitch', () => {
  it('is deterministic for a fixed seed', () => {
    const batter = makeBatter(60)
    const pitcher = makePitcher(60)
    const run = () => {
      const rng = mulberry32(777)
      const results: string[] = []
      for (let i = 0; i < 200; i++) {
        const pitch = applyControl(
          aiPitchPlan(pitcher, batter, { balls: 1, strikes: 1 }, rng),
          pitcher,
          20,
          rng,
        )
        const swing = aiSwing(batter, pitch, { balls: 1, strikes: 1 }, rng)
        results.push(JSON.stringify(resolvePitch(batter, pitcher, pitch, swing, rng)))
      }
      return results.join('|')
    }
    expect(run()).toBe(run())
  })

  it('high-contact batters whiff less than low-contact batters', () => {
    const pitcher = makePitcher(60)
    const eliteRate = whiffRate(makeBatter(90), pitcher, 42)
    const weakRate = whiffRate(makeBatter(30), pitcher, 42)
    expect(eliteRate).toBeLessThan(weakRate * 0.75)
  })

  it('better pitchers generate more whiffs', () => {
    const batter = makeBatter(55)
    const vsElite = whiffRate(batter, makePitcher(90), 99)
    const vsWeak = whiffRate(batter, makePitcher(25), 99)
    expect(vsElite).toBeGreaterThan(vsWeak)
  })

  it('power raises exit velocity on contact', () => {
    const pitcher = makePitcher(50)
    const avgExitVelo = (power: number, seed: number) => {
      const batter = makeBatter(70, power)
      const rng = mulberry32(seed)
      let total = 0
      let hits = 0
      for (let i = 0; i < 20000 && hits < 800; i++) {
        const pitch = applyControl(
          aiPitchPlan(pitcher, batter, { balls: 0, strikes: 0 }, rng),
          pitcher,
          0,
          rng,
        )
        const swing = aiSwing(batter, pitch, { balls: 0, strikes: 0 }, rng)
        const ev = resolvePitch(batter, pitcher, pitch, swing, rng)
        if (ev.kind === 'inPlay') {
          total += ev.battedBall.exitVelo
          hits++
        }
      }
      return total / hits
    }
    expect(avgExitVelo(90, 5)).toBeGreaterThan(avgExitVelo(20, 5) + 3)
  })

  it('takes outside the zone are balls, takes inside are strikes', () => {
    const batter = makeBatter(50)
    const pitcher = makePitcher(50)
    const rng = mulberry32(3)
    const take = { swung: false, timingErrorMs: 0, aimOffset: { x: 0, y: 0 } }
    expect(
      resolvePitch(batter, pitcher, { type: 'FB', loc: { x: 0, y: 0 }, speed: 90 }, take, rng).kind,
    ).toBe('calledStrike')
    expect(
      resolvePitch(batter, pitcher, { type: 'FB', loc: { x: 1.4, y: 0 }, speed: 90 }, take, rng).kind,
    ).toBe('ball')
  })

  it('poor control misses the target more', () => {
    const wild = makePitcher(20)
    const painter = makePitcher(90)
    const missDist = (p: Player, seed: number) => {
      const rng = mulberry32(seed)
      let total = 0
      const n = 5000
      for (let i = 0; i < n; i++) {
        const plan = { type: 'FB' as const, target: { x: 0, y: 0 } }
        const pitch = applyControl(plan, p, 0, rng)
        total += Math.hypot(pitch.loc.x, pitch.loc.y)
      }
      return total / n
    }
    expect(missDist(painter, 8)).toBeLessThan(missDist(wild, 8) * 0.8)
  })
})
