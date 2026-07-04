import {
  FIRST_NAMES,
  LAST_NAMES,
  MASCOTS,
  PLACE_FRAGMENTS,
  PLACE_SUFFIXES,
  SCHOOL_PATTERNS,
  TEAM_COLORS,
} from '../data/nameLists'
import { chance, pick, type Rng } from '../engine/rng'

export function playerName(rng: Rng): { firstName: string; lastName: string } {
  return { firstName: pick(rng, FIRST_NAMES), lastName: pick(rng, LAST_NAMES) }
}

/** Fragments that read as adjectives — they must take a suffix ("Highmont"),
 * never stand alone ("University of High"). */
const ADJECTIVE_FRAGMENTS = new Set([
  'Beacon', 'Clear', 'Copper', 'Cotton', 'East', 'Ember', 'Fair', 'Golden', 'Granite', 'High',
  'Iron', 'Liberty', 'North', 'Salt', 'Sand', 'Silver', 'Smoky', 'South', 'Sun', 'West', 'Wind',
])

export function placeName(rng: Rng): string {
  const frag = pick(rng, PLACE_FRAGMENTS)
  // Compound fragments ("Blue Ridge") don't take a suffix.
  if (frag.includes(' ')) return frag
  if (!ADJECTIVE_FRAGMENTS.has(frag) && chance(rng, 0.4)) return frag
  return frag + pick(rng, PLACE_SUFFIXES)
}

export interface SchoolIdentity {
  name: string
  nickname: string
  abbrev: string
  city: string
  colors: { primary: string; secondary: string }
}

export function schoolIdentity(rng: Rng): SchoolIdentity {
  const place = placeName(rng)
  const pattern = pick(rng, SCHOOL_PATTERNS)
  const name = pattern.replace('{P}', place)
  const nickname = pick(rng, MASCOTS)
  return {
    name,
    nickname,
    abbrev: abbrevOf(name),
    city: place,
    colors: pick(rng, TEAM_COLORS),
  }
}

function abbrevOf(name: string): string {
  const stop = new Set(['of', 'the'])
  const words = name.split(/[\s-]+/).filter((w) => !stop.has(w.toLowerCase()))
  if (words.length >= 3) return words.map((w) => w[0]).join('').toUpperCase().slice(0, 4)
  if (words.length === 2) return (words[0].slice(0, 2) + words[1][0]).toUpperCase()
  return words[0].slice(0, 3).toUpperCase()
}
