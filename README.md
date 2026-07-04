# ⚾ Campus Ball

A mobile-first college baseball game for the browser — Baseball 9-style arcade
gameplay in a fictional college universe (the Retro Bowl College approach):
coach a program from a low-prestige school to a national championship, recruit
high-school classes, and chase the 64-team postseason tournament.

## Status

**Milestone 1 — Exhibition sim** ✅
Generate two fictional college programs and sim a full 9-inning (or extras)
game on a pitch-by-pitch Monte Carlo engine, with a line score and full
batting/pitching box score.

See the full roadmap in the plan: world generation (128 teams / 12
conferences), interactive at-bat scene, full 56-game seasons, the 64-team
tournament, recruiting, coach career, and the in-game economy.

## Development

```bash
npm install
npm run dev        # start the game at http://localhost:5173
npm test           # unit tests incl. the 2,000-game stat calibration
npm run calibrate  # print league-wide BA/ERA/HR table for balance tuning
npm run e2e        # Playwright smoke test
npm run lint       # oxlint (enforces engine purity rules)
```

Tip: `http://localhost:5173/?seed=42` makes every exhibition deterministic.

## Architecture

The iron rule: **`src/engine/` and `src/gen/` are pure TypeScript** — no
React, DOM, state or storage imports (enforced by lint + a unit test). Every
function takes data + a seeded `Rng` and returns data.

```
src/
├── engine/   # pure sim: at-bat resolver, fielding, game state machine, box scores
├── gen/      # seeded procedural content: names, schools, rosters
├── data/     # constants — balance.ts holds every gameplay tunable
├── state/    # zustand stores bridging engine <-> UI
└── ui/       # React screens & components
```

The core design: `resolvePitch(batter, pitcher, pitch, swing, rng)` resolves
every pitch, whether the `swing` came from the batter AI (simmed games) or
from the human's tap in the at-bat scene (coming in M2). Sim results and
manual play stay statistically consistent by construction.
