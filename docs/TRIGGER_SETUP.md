# TRIGGER_SETUP — scheduling the Monday run

The weekly run is a Claude Code remote session fired by a scheduled trigger
(a "Routine"). Set it up from any session in this environment (the
environment must have the repo plus the QuickBooks and Gmail connectors).

## Create the trigger

Ask Claude in this environment to run (or run via the claude-code-remote MCP
tools directly):

```
create_trigger(
  name   = "Weekly KPI run",
  prompt = "Follow RUNBOOK.md in the SRE repo for the weekly KPI run.",
  cron_expression = "30 10 * * 1",   # see timezone note below
)
```

- **Fire into this session vs a fresh session:** prefer binding to a
  persistent session that already has the repo cloned and the artifact
  published (stable URL). If using `create_new_session_on_fire=true`, the
  prompt must tell the session to clone the repo first, and artifact-URL
  stability must be handled by passing the existing artifact URL.

## Timezone note (important)

Cron triggers run in UTC. Monday 6:30am in New York is:
- **EDT (Mar–Nov): `30 10 * * 1`**
- EST (Nov–Mar): `30 11 * * 1`

Either accept the one-hour drift across DST changes (run lands 5:30am or
6:30am ET — both fine for a 7am email), or update the cron twice a year.
`30 10 * * 1` is the recommended set-and-forget choice.

## Smoke test

After creating it, fire once manually (`fire_trigger`) and watch the session:
it should complete every checkbox in RUNBOOK.md §7 — dashboard republished at
the same URL, email received, `data/` committed and pushed.

## Managing

- `list_triggers` — see it, get the id
- `update_trigger(trigger_id, enabled=false)` — pause
- `delete_trigger(trigger_id)` — remove
