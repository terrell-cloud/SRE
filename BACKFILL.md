# BACKFILL — one-time first run (Phase B + C)

Goal: fill the four config files from real account data, then load 12 months
of history so the dashboard starts with trends.

## Prerequisites (owner)

Generate three tokens and add them to the Claude environment's variables
(or a local `.env`):

| Var | Where to generate |
|-----|-------------------|
| `LEAP_TOKEN` | Leap CRM: Settings → Developers → Generate Token |
| `COMPANYCAM_TOKEN` | CompanyCam (admin): profile icon → Access Tokens → + New Token (read-only OK) |
| `GHL_TOKEN` | GoHighLevel sub-account: Settings → Private Integrations → Create. Scopes: contacts.readonly, opportunities.readonly, locations/customFields.readonly, users.readonly |
| `GHL_LOCATION_ID` | The sub-account (location) ID, visible in GHL Settings → Business Profile or the URL |

## Step 1 — discovery (MANDATORY gate)

```bash
python -m kpi discover --source companycam
python -m kpi discover --source ghl
python -m kpi discover --source leap
```

Each command validates the token and prints exactly what to paste where:
- CompanyCam user ids → `config/reps.yaml` (`companycam_user_id`)
- GHL source strings → `config/channels.yaml` (`ghl_sources` lists)
- GHL user ids → `config/reps.yaml` (`ghl_user_id`)
- Leap stage names → `config/leap_stages.yaml` (`stages:` — classify EVERY
  stage as open/sold/lost; tag the contract stage `pipeline: contract_signed`,
  production stages, etc.)
- Leap division values (retail/insurance) → `division_values`
- Leap user ids → `config/reps.yaml` (`leap_user_id`)

Also EYEBALL `discovery/leap.json` (gitignored):
- If `sample_jobs_normalized` shows empty amounts/rep/stage/history, the raw
  field names differ — adjust `FIELD_CANDIDATES` in `kpi/collectors/leap.py`
  and/or `division_field`/`source_field` in `config/leap_stages.yaml`.
- If the Leap calls fail with 401, try `auth_scheme: token-header` in
  `config/settings.yaml`.
- If the GHL contact search returns errors or empty despite the UI showing
  contacts, the search body shape needs adjusting in `kpi/collectors/ghl.py`
  (`_fetch_contacts`) — the endpoint is under-documented; compare with
  discovery/ghl.json.

**Do not proceed with placeholder configs.** `config.py` will not stop you,
but every number would land in `unmapped`.

## Step 2 — sanity-check one live week

```bash
python -m kpi collect --week last
python -m kpi compute --week last
```

Compare against the Leap and GHL UIs for the same date range:
- lead count within a couple of leads,
- contracts signed matches,
- reps resolving (no big `unmapped` warnings).
Iterate on config until clean.

## Step 3 — backfill 12 months

```bash
python -m kpi backfill --months 12
```

- One ranged pull per API, bucketed into weekly files. Resumable: rerun after
  a failure and it skips completed sources/weeks (`--force` to redo).
- QuickBooks: pull the last 12 monthly P&Ls via MCP and write
  `data/inputs/spend/monthly/YYYY-MM.json` for each (schema in RUNBOOK.md §2).

```bash
python -m kpi spend-allocate --all
python -m kpi compute --all
python -m kpi history
python -m kpi dashboard
python -m kpi email --week last
```

Publish the dashboard artifact, send a "backfill complete" email, then:

```bash
git add data/ && git commit -m "data: 12-month backfill" && git push
```

Known caveat (also shown in the dashboard footer): backfilled closing % and
backlog for pre-go-live weeks are best-effort — Leap's historical
stage-transition data may be incomplete.

## Step 4 — schedule the Monday run

Follow `docs/TRIGGER_SETUP.md`, then fire the trigger once manually and watch
it complete RUNBOOK.md end-to-end before trusting it.
