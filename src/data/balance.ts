// Every gameplay-tuning constant lives here so balance passes touch ONE file.
// `npm run calibrate` prints league-wide stats; tune against that, not vibes.

export const BALANCE = {
  atBat: {
    /** Chance an AI batter swings at a pitch in the strike zone. */
    zoneSwingBase: 0.66,
    /** Extra zone-swing aggression per strike in the count. */
    zoneSwingPerStrike: 0.1,
    /** Base chance of chasing a pitch just off the zone (decays with distance). */
    chaseBase: 0.20,
    /** How fast chase probability decays per zone-unit outside the zone. */
    chaseDecay: 3.2,
    /** Eye rating swing: +/- on chase probability at the extremes (1 vs 99). */
    chaseEyeSpread: 0.16,
    /** Swing chance on 3-0. */
    swingOn30: 0.06,

    /** Timing error stddev (ms) for a 50-contact batter vs a 90 mph pitch. */
    timingSdBase: 38,
    /** How much contact rating shrinks/grows the timing sd (fraction at extremes). */
    timingSdContactSpread: 0.42,
    /** Aim error stddev in zone units for a 50-contact batter. */
    aimSdBase: 0.36,
    aimSdContactSpread: 0.35,

    /** Normalizers for the combined miss metric. */
    timingNormMs: 68,
    aimNorm: 0.95,
    /** Miss metric above this = swing and miss. */
    whiffThreshold: 1.14,
    /** Miss metric above this (and below whiff) = foul ball. */
    foulThreshold: 0.62,
    /** Pitcher movement rating widens the whiff band (fraction at extremes). */
    movementWhiffSpread: 0.12,

    /** Exit velo = floor + quality * (range + power bonus) + noise. */
    exitVeloFloor: 55,
    exitVeloRange: 48,
    exitVeloPowerBonus: 26,
    exitVeloNoiseSd: 4.5,
    /** Launch angle distribution. */
    launchAngleMean: 12,
    launchAnglePowerTilt: 0.1,
    launchAngleSd: 17,
    /** Aiming under/over the ball tilts launch angle (degrees per zone unit). */
    launchAnglePerAimY: 24,
    /** Late/early swings push spray toward opposite/pull field (deg per ms). */
    sprayPerMs: 0.45,
    spraySd: 13,
  },

  pitching: {
    /** Control error stddev (zone units) for a 50-control pitcher, fresh. */
    controlSdBase: 0.55,
    controlSdSpread: 0.38,
    /** Additional control sd per pitch thrown beyond stamina. */
    fatigueSdPerPitch: 0.004,
    /** Velocity rating -> mph delta at the extremes. */
    speedSpreadMph: 6,
    speedNoiseSd: 1.2,
    /** Pull the pitcher when pitches exceed stamina by this factor. */
    pullFactor: 1.15,
    hardPitchCap: 110,
  },

  fielding: {
    /** Ground balls */
    groundHitBase: 0.22,
    groundHitPerMph: 0.005,
    groundHitMin: 0.06,
    groundHitMax: 0.42,
    groundDoubleShare: 0.09,
    infieldHitSpeedBonus: 0.0012,
    doublePlayBase: 0.42,
    doublePlaySpeedSpread: 0.15,
    /** Line drives */
    lineHitBase: 0.66,
    lineHitPerMph: 0.005,
    lineHitMin: 0.3,
    lineHitMax: 0.8,
    lineDoubleShare: 0.24,
    lineTripleShare: 0.02,
    /** Fly balls */
    flyHitBase: 0.16,
    flyHitPerMph: 0.004,
    flyHitMin: 0.05,
    flyHitMax: 0.35,
    flyDoubleShare: 0.32,
    flyTripleShare: 0.04,
    /** Home runs: logistic on exit velo. */
    hrEvMidpoint: 97,
    hrEvSlope: 0.24,
    hrMax: 0.9,
    /** Popups */
    popupBloopChance: 0.06,
    /** Defense: fielding rating shifts hit probability (fraction at extremes). */
    defenseHitSpread: 0.05,
    errorBase: 0.028,
    errorDefenseSpread: 0.02,
    /** Runner advancement extra-base chances (speed-adjusted). */
    scoreFromSecondOnSingle: 0.58,
    firstToThirdOnSingle: 0.26,
    scoreFromFirstOnDouble: 0.42,
    advanceOnGroundOut: 0.45,
    sacFlyMinEv: 76,
  },

  game: {
    innings: 9,
    maxInnings: 20,
  },
} as const
