import { describe, expect, it } from 'vitest'
import { deriveSeed, gaussian, int, mulberry32, pickWeighted, shuffle } from './rng'

describe('mulberry32', () => {
  it('produces an identical sequence for the same seed', () => {
    const a = mulberry32(12345)
    const b = mulberry32(12345)
    for (let i = 0; i < 1000; i++) expect(a()).toBe(b())
  })

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(1)
    const b = mulberry32(2)
    const same = Array.from({ length: 100 }, () => a() === b()).filter(Boolean)
    expect(same.length).toBeLessThan(5)
  })

  it('stays in [0, 1) and covers the range', () => {
    const rng = mulberry32(99)
    let min = 1
    let max = 0
    for (let i = 0; i < 10000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
      min = Math.min(min, v)
      max = Math.max(max, v)
    }
    expect(min).toBeLessThan(0.01)
    expect(max).toBeGreaterThan(0.99)
  })
})

describe('helpers', () => {
  it('int stays inclusive of both bounds', () => {
    const rng = mulberry32(7)
    const seen = new Set<number>()
    for (let i = 0; i < 1000; i++) seen.add(int(rng, 1, 6))
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('gaussian roughly matches mean/sd', () => {
    const rng = mulberry32(11)
    const n = 20000
    let sum = 0
    let sumSq = 0
    for (let i = 0; i < n; i++) {
      const v = gaussian(rng, 10, 3)
      sum += v
      sumSq += v * v
    }
    const mean = sum / n
    const sd = Math.sqrt(sumSq / n - mean * mean)
    expect(mean).toBeGreaterThan(9.9)
    expect(mean).toBeLessThan(10.1)
    expect(sd).toBeGreaterThan(2.85)
    expect(sd).toBeLessThan(3.15)
  })

  it('pickWeighted respects weights', () => {
    const rng = mulberry32(13)
    const counts = [0, 0, 0]
    for (let i = 0; i < 10000; i++) counts[pickWeighted(rng, [1, 2, 7])]++
    expect(counts[2]).toBeGreaterThan(counts[1])
    expect(counts[1]).toBeGreaterThan(counts[0])
  })

  it('deriveSeed produces distinct streams', () => {
    expect(deriveSeed(42, 0)).not.toBe(deriveSeed(42, 1))
  })

  it('shuffle is deterministic per seed', () => {
    const a = shuffle(mulberry32(5), [1, 2, 3, 4, 5, 6, 7, 8])
    const b = shuffle(mulberry32(5), [1, 2, 3, 4, 5, 6, 7, 8])
    expect(a).toEqual(b)
  })
})
