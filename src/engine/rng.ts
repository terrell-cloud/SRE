// Seeded, deterministic RNG. Every engine function that needs randomness
// takes an Rng argument — never Math.random() — so the same seed always
// replays the same season, and tests are reproducible.

export type Rng = () => number

/** mulberry32 — tiny, fast, good-enough 32-bit seeded PRNG. Returns [0, 1). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Derive a new independent seed from a base seed and a stream index. */
export function deriveSeed(seed: number, stream: number): number {
  const rng = mulberry32((seed ^ Math.imul(stream + 1, 0x9e3779b9)) >>> 0)
  return Math.floor(rng() * 4294967296)
}

export function chance(rng: Rng, p: number): boolean {
  return rng() < p
}

/** Integer in [min, max] inclusive. */
export function int(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

/** Pick an index weighted by the given non-negative weights. */
export function pickWeighted(rng: Rng, weights: readonly number[]): number {
  let total = 0
  for (const w of weights) total += w
  let roll = rng() * total
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return i
  }
  return weights.length - 1
}

/** Normally distributed value via Box-Muller. */
export function gaussian(rng: Rng, mean = 0, sd = 1): number {
  let u = 0
  while (u === 0) u = rng()
  const v = rng()
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

/** In-place Fisher-Yates shuffle; returns the same array. */
export function shuffle<T>(rng: Rng, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
