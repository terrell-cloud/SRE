// Roster generation. Quality scales with school prestige so a powerhouse
// rolls out 70s-rated juniors while a bottom-feeder fields 40s.

import type { ClassYear, PitchTypeId, Player, Position, Ratings, School } from '../engine/types'
import { clamp, gaussian, int, pick, pickWeighted, shuffle, type Rng } from '../engine/rng'
import { playerName, schoolIdentity } from './names'

/** 11 position players (starters + 2 bench), 3 starters, 4 relievers. */
const ROSTER_TEMPLATE: Position[] = [
  'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'C', '2B',
  'SP', 'SP', 'SP', 'RP', 'RP', 'RP', 'RP',
]

const CLASS_YEARS: ClassYear[] = ['FR', 'SO', 'JR', 'SR']

const SECONDARY_PITCHES: PitchTypeId[] = ['SL', 'CB', 'CH']

let idCounter = 0

/** Rating centered on the school's quality with individual variance. */
function rollRating(rng: Rng, prestige: number, bonus = 0): number {
  const mean = 36 + prestige * 0.32 + bonus
  return Math.round(clamp(gaussian(rng, mean, 9), 15, 95))
}

export function generatePlayer(
  rng: Rng,
  position: Position,
  prestige: number,
  classYear?: ClassYear,
): Player {
  const { firstName, lastName } = playerName(rng)
  const year = classYear ?? pick(rng, CLASS_YEARS)
  // Upperclassmen are more developed.
  const devBonus = { FR: -4, SO: 0, JR: 3, SR: 5 }[year]
  const isPitcher = position === 'SP' || position === 'RP'

  const ratings: Ratings = {
    contact: rollRating(rng, prestige, devBonus + (isPitcher ? -18 : 0)),
    power: rollRating(rng, prestige, devBonus + (isPitcher ? -18 : 0)),
    eye: rollRating(rng, prestige, devBonus + (isPitcher ? -15 : 0)),
    speed: rollRating(rng, prestige, isPitcher ? -8 : 2),
    fielding: rollRating(rng, prestige, devBonus),
    arm: rollRating(rng, prestige, devBonus),
    velocity: rollRating(rng, prestige, devBonus + (isPitcher ? 6 : -12)),
    control: rollRating(rng, prestige, devBonus + (isPitcher ? 6 : -12)),
    movement: rollRating(rng, prestige, devBonus + (isPitcher ? 4 : -12)),
    stamina: isPitcher
      ? position === 'SP'
        ? int(rng, 55, 90)
        : int(rng, 25, 45)
      : int(rng, 15, 30),
  }

  const pitches: Player['pitches'] = []
  if (isPitcher) {
    pitches.push({ type: 'FB', quality: ratings.velocity })
    const extras = shuffle(rng, [...SECONDARY_PITCHES]).slice(0, position === 'SP' ? int(rng, 2, 3) : int(rng, 1, 2))
    for (const type of extras) {
      pitches.push({ type, quality: rollRating(rng, prestige, devBonus) })
    }
  }

  return {
    id: `p${++idCounter}_${Math.floor(rng() * 1e9).toString(36)}`,
    firstName,
    lastName,
    jerseyNumber: 0, // assigned at roster level to guarantee uniqueness
    position,
    classYear: year,
    ratings,
    pitches,
    potential: Math.round(clamp(gaussian(rng, 55 + prestige * 0.2, 15), 20, 99)),
  }
}

export function generateRoster(rng: Rng, prestige: number): Player[] {
  const roster: Player[] = []
  const usedLastNames = new Set<string>()
  for (const pos of ROSTER_TEMPLATE) {
    let player = generatePlayer(rng, pos, prestige)
    // Avoid two "J. Shepard"s on one roster: reroll name collisions.
    for (let tries = 0; usedLastNames.has(player.lastName) && tries < 8; tries++) {
      player = generatePlayer(rng, pos, prestige)
    }
    usedLastNames.add(player.lastName)
    roster.push(player)
  }
  // Unique jersey numbers.
  const numbers = shuffle(
    rng,
    Array.from({ length: 50 }, (_, i) => i + 1),
  ).slice(0, roster.length)
  roster.forEach((p, i) => {
    p.jerseyNumber = numbers[i]
  })
  return roster
}

let schoolCounter = 0

export function generateSchool(rng: Rng, prestige: number): School {
  const identity = schoolIdentity(rng)
  return {
    id: `s${++schoolCounter}_${Math.floor(rng() * 1e9).toString(36)}`,
    name: identity.name,
    nickname: identity.nickname,
    abbrev: identity.abbrev,
    city: identity.city,
    conferenceId: null,
    prestige,
    colors: identity.colors,
  }
}

/** Weighted class-year pick used by future world-gen (kept here for reuse). */
export function rollClassYear(rng: Rng): ClassYear {
  return CLASS_YEARS[pickWeighted(rng, [0.28, 0.26, 0.24, 0.22])]
}

/** Reset id counters — only for deterministic tests. */
export function resetGenCounters(): void {
  idCounter = 0
  schoolCounter = 0
}

export function averageOverall(roster: Player[]): number {
  const total = roster.reduce((sum, p) => {
    const r = p.ratings
    const isPitcher = p.position === 'SP' || p.position === 'RP'
    return sum + (isPitcher ? (r.velocity + r.control + r.movement) / 3 : (r.contact + r.power + r.eye) / 3)
  }, 0)
  return total / roster.length
}
