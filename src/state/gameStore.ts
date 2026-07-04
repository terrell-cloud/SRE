import { create } from 'zustand'
import { deriveSeed, int, mulberry32, type Rng } from '../engine/rng'
import {
  buildGameTeam,
  createGame,
  simGame,
  simHalfInning,
  simPlateAppearance,
  stepPitch,
  toResult,
  type StepOptions,
  type StepResult,
} from '../engine/game'
import { generateRoster, generateSchool } from '../gen/players'
import type { Difficulty } from '../data/balance'
import type { GameResult, GameState, GameTeam } from '../engine/types'

interface ExhibitionState {
  away: GameTeam
  home: GameTeam
  result: GameResult
}

export interface LiveGame {
  /** Mutated in place by engine calls; `version` bumps trigger re-renders. */
  gs: GameState
  /** The single seeded stream for this game — scene pre-gen uses it too. */
  rng: Rng
  userSide: 'away' | 'home'
  difficulty: Difficulty
  version: number
}

interface GameStore {
  screen: 'home' | 'gameday' | 'boxscore'
  exhibition: ExhibitionState | null
  live: LiveGame | null
  /** Instant full sim -> box score ("Quick Sim"). */
  newExhibition: (seed?: number) => void
  /** Interactive game -> GameDay screen. */
  startExhibition: (seed?: number) => void
  /** One pitch through the engine; returns what happened for banners. */
  commitPitch: (opts: StepOptions) => StepResult
  simPa: () => void
  simHalf: () => void
  simToEnd: () => void
  /** Wrap up the live game -> box score screen. */
  finishLive: () => void
  goHome: () => void
}

/** Dev/e2e hook: ?seed=123 makes every matchup deterministic. */
function seedFromUrl(): number | null {
  if (typeof location === 'undefined') return null
  const raw = new URLSearchParams(location.search).get('seed')
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

let matchupCounter = 0

function buildMatchup(seed?: number): { rng: Rng; away: GameTeam; home: GameTeam } {
  const urlSeed = seedFromUrl()
  const baseSeed =
    seed ?? (urlSeed !== null ? deriveSeed(urlSeed, matchupCounter++) : Math.floor(Math.random() * 2 ** 31))
  const rng = mulberry32(baseSeed)
  const awayPrestige = int(rng, 35, 70)
  const homePrestige = int(rng, 35, 70)
  const away = buildGameTeam(generateSchool(rng, awayPrestige), generateRoster(rng, awayPrestige))
  const home = buildGameTeam(generateSchool(rng, homePrestige), generateRoster(rng, homePrestige))
  return { rng, away, home }
}

export const useGameStore = create<GameStore>((set, get) => {
  const bump = () => {
    const live = get().live
    if (live) set({ live: { ...live, version: live.version + 1 } })
  }

  return {
    screen: 'home',
    exhibition: null,
    live: null,

    newExhibition: (seed) => {
      const { rng, away, home } = buildMatchup(seed)
      const result = simGame(createGame(away, home), rng)
      set({ exhibition: { away, home, result }, screen: 'boxscore', live: null })
    },

    startExhibition: (seed) => {
      const { rng, away, home } = buildMatchup(seed)
      set({
        live: {
          gs: createGame(away, home),
          rng,
          userSide: 'home',
          difficulty: 'rookie',
          version: 0,
        },
        screen: 'gameday',
        exhibition: null,
      })
    },

    commitPitch: (opts) => {
      const live = get().live
      if (!live || live.gs.gameOver) return { event: null, play: null }
      const result = stepPitch(live.gs, live.rng, opts)
      bump()
      return result
    },

    simPa: () => {
      const live = get().live
      if (!live) return
      simPlateAppearance(live.gs, live.rng)
      bump()
    },

    simHalf: () => {
      const live = get().live
      if (!live) return
      simHalfInning(live.gs, live.rng)
      bump()
    },

    simToEnd: () => {
      const live = get().live
      if (!live) return
      simGame(live.gs, live.rng)
      get().finishLive()
    },

    finishLive: () => {
      const live = get().live
      if (!live) return
      live.gs.gameOver = true
      set({
        exhibition: { away: live.gs.away, home: live.gs.home, result: toResult(live.gs) },
        screen: 'boxscore',
        live: null,
      })
    },

    goHome: () => set({ screen: 'home', live: null }),
  }
})
