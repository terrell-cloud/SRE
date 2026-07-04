import { create } from 'zustand'
import { deriveSeed, int, mulberry32 } from '../engine/rng'
import { buildGameTeam, createGame, simGame } from '../engine/game'
import { generateRoster, generateSchool } from '../gen/players'
import type { GameResult, GameTeam } from '../engine/types'

interface ExhibitionState {
  away: GameTeam
  home: GameTeam
  result: GameResult
}

interface GameStore {
  screen: 'home' | 'boxscore'
  exhibition: ExhibitionState | null
  newExhibition: (seed?: number) => void
  goHome: () => void
}

/** Dev/e2e hook: ?seed=123 makes every exhibition deterministic. */
function seedFromUrl(): number | null {
  if (typeof location === 'undefined') return null
  const raw = new URLSearchParams(location.search).get('seed')
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

let exhibitionCounter = 0

export const useGameStore = create<GameStore>((set) => ({
  screen: 'home',
  exhibition: null,

  newExhibition: (seed) => {
    const urlSeed = seedFromUrl()
    const baseSeed =
      seed ?? (urlSeed !== null ? deriveSeed(urlSeed, exhibitionCounter++) : Math.floor(Math.random() * 2 ** 31))
    const rng = mulberry32(baseSeed)

    // Two mid-tier programs with a bit of quality spread.
    const awayPrestige = int(rng, 35, 70)
    const homePrestige = int(rng, 35, 70)
    const away = buildGameTeam(generateSchool(rng, awayPrestige), generateRoster(rng, awayPrestige))
    const home = buildGameTeam(generateSchool(rng, homePrestige), generateRoster(rng, homePrestige))
    const result = simGame(createGame(away, home), rng)

    set({ exhibition: { away, home, result }, screen: 'boxscore' })
  },

  goHome: () => set({ screen: 'home' }),
}))
