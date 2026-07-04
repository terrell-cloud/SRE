// All engine-facing data models. Everything here is plain JSON-serializable
// data — cross-references are by id string, never object reference — because
// the save file is one flat object.

export type Position =
  | 'C'
  | '1B'
  | '2B'
  | '3B'
  | 'SS'
  | 'LF'
  | 'CF'
  | 'RF'
  | 'DH'
  | 'SP'
  | 'RP'

export type ClassYear = 'FR' | 'SO' | 'JR' | 'SR'

export type PitchTypeId = 'FB' | 'SL' | 'CB' | 'CH'

/** All ratings are 1..99. Batters use the first six; pitchers the last four. */
export interface Ratings {
  contact: number
  power: number
  eye: number
  speed: number
  fielding: number
  arm: number
  velocity: number
  control: number
  movement: number
  stamina: number
}

export interface Player {
  id: string
  firstName: string
  lastName: string
  jerseyNumber: number
  position: Position
  classYear: ClassYear
  ratings: Ratings
  /** 2-4 pitches for pitchers; empty for position players. */
  pitches: { type: PitchTypeId; quality: number }[]
  /** Hidden development ceiling, drives offseason training gains (M5). */
  potential: number
}

export interface School {
  id: string
  /** e.g. "Port Verde State" */
  name: string
  /** e.g. "Marlins" */
  nickname: string
  /** 3-4 letters for line scores, e.g. "PVS" */
  abbrev: string
  city: string
  conferenceId: string | null
  /** 1-100; drives roster quality, recruiting pull, job-offer prestige. */
  prestige: number
  colors: { primary: string; secondary: string }
}

// ---------------------------------------------------------------------------
// At-bat resolution contracts (the sim/manual unification point)
// ---------------------------------------------------------------------------

/**
 * Location in strike-zone coordinates: (0,0) is dead center;
 * |x| <= 1 and |y| <= 1 is inside the zone. Beyond that is a ball.
 */
export interface ZoneXY {
  x: number
  y: number
}

export interface Count {
  balls: number
  strikes: number
}

/** Pitcher intent, before control error is applied. */
export interface PitchPlan {
  type: PitchTypeId
  target: ZoneXY
}

/** The pitch as it actually crosses the plate. */
export interface PitchActual {
  type: PitchTypeId
  loc: ZoneXY
  /** mph — affects timing difficulty. */
  speed: number
}

/**
 * A swing decision — produced either by aiSwing() (auto-play) or by
 * converting the human's tap in the at-bat scene. Same shape either way,
 * which is what keeps simmed and manual outcomes statistically consistent.
 */
export interface SwingInput {
  swung: boolean
  /** Tap/roll time minus ideal contact time. Negative = early. */
  timingErrorMs: number
  /** Aim point minus actual pitch location, in zone units. */
  aimOffset: ZoneXY
}

export interface BattedBall {
  /** mph, roughly 40-115. */
  exitVelo: number
  /** degrees: <10 ground ball, 10-25 liner, 25-50 fly, >50 popup. */
  launchAngle: number
  /** degrees off the LF line (0) to the RF line (90); 45 is dead center. */
  sprayAngle: number
}

export type PitchEvent =
  | { kind: 'ball' }
  | { kind: 'calledStrike' }
  | { kind: 'swingMiss' }
  | { kind: 'foul' }
  | { kind: 'inPlay'; battedBall: BattedBall }

// ---------------------------------------------------------------------------
// Plate-appearance / play outcomes
// ---------------------------------------------------------------------------

export type PaOutcomeType =
  | 'strikeout'
  | 'walk'
  | 'single'
  | 'double'
  | 'triple'
  | 'homeRun'
  | 'groundOut'
  | 'flyOut'
  | 'lineOut'
  | 'popOut'
  | 'doublePlay'
  | 'sacFly'
  | 'error'

export interface PlayResult {
  type: PaOutcomeType
  outsRecorded: number
  runsScored: number
  /** Ids of runners who scored, batter included if he did. */
  scorers: string[]
  /** New base occupancy after the play: [1B, 2B, 3B]. */
  bases: [string | null, string | null, string | null]
  description: string
}

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

/** One team's game-time setup. Players are carried inline for exhibition;
 * league play (M3) will hydrate these from the save file by id. */
export interface GameTeam {
  school: School
  players: Record<string, Player>
  /** Batting order: 9 player ids (DH bats, pitcher does not). */
  lineup: string[]
  /** Defensive assignment for the 8 non-pitcher positions. */
  fielders: Record<string, string>
  pitcherId: string
  /** Relievers in the order they'll be used. */
  bullpen: string[]
  battingIndex: number
}

export interface GameState {
  inning: number
  half: 'top' | 'bottom'
  outs: number
  bases: [string | null, string | null, string | null]
  count: Count
  away: GameTeam
  home: GameTeam
  score: { away: number; home: number }
  /** Runs per half-inning: linescore.away[i] = runs in top of inning i+1. */
  linescore: { away: number[]; home: number[] }
  batting: BattingLines
  pitching: PitchingLines
  /** Pitch counts per pitcher id, for fatigue. */
  pitchCounts: Record<string, number>
  gameOver: boolean
  /** Rolling log of recent play descriptions (capped). */
  log: string[]
}

export type BattingLines = Record<string, BattingLine>
export type PitchingLines = Record<string, PitchingLine>

export interface BattingLine {
  ab: number
  r: number
  h: number
  doubles: number
  triples: number
  hr: number
  rbi: number
  bb: number
  so: number
}

export interface PitchingLine {
  /** Outs recorded — innings pitched = outs / 3. */
  outs: number
  h: number
  r: number
  er: number
  bb: number
  so: number
  pitches: number
}

export interface GameResult {
  awayScore: number
  homeScore: number
  innings: number
  linescore: { away: number[]; home: number[] }
  batting: BattingLines
  pitching: PitchingLines
  awaySchoolId: string
  homeSchoolId: string
}
