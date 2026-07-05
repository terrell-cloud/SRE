# SRE Weekly KPI Agent & Dashboard

An autonomous weekly KPI system for S&E Roofing & Exteriors. Every Monday
morning a scheduled Claude session pulls fresh data from **Leap CRM** (jobs,
sales, reps), **GoHighLevel** (leads, sources), **CompanyCam** (inspection
activity by rep), and **QuickBooks** (marketing spend), computes 12 KPIs,
updates a private web dashboard (Claude Artifact, stable URL), and emails a
summary to the owner.

## The 12 KPIs

| # | KPI | Source |
|---|-----|--------|
| 1 | Leads by source | GoHighLevel contacts, mapped via `config/channels.yaml` |
| 2 | Lead cost per source | QuickBooks channel sub-account spend ÷ leads |
| 3 | CAC by source | Channel spend ÷ customers acquired (Leap job source) |
| 4 | Closing % — retail, by rep & overall | Leap stage decisions |
| 5 | Closing % — insurance, by rep & overall | Leap stage decisions |
| 6 | Inspections per week by rep | CompanyCam: distinct (rep × project) photo activity |
| 7 | Revenue sold (contracts signed $) | Leap |
| 8 | Revenue collected / invoiced | Leap (QuickBooks P&L cross-reference) |
| 9 | Average job size | Leap |
| 10 | Pipeline: appts set/run, estimates, contracts | Leap stage events |
| 11 | Production: started / in production / completed / backlog | Leap |
| 12 | Gross margin | Leap job financials; QuickBooks P&L fallback |

Definitions live in `kpi/compute.py`'s docstring. Key ones:
- **Sold decision** = a job entering the stage marked `pipeline: contract_signed`
  during the week; **lost** = entering a `class: lost` stage.
  Closing % = sold ÷ (sold + lost).
- **Inspection** = a rep uploading photos to a CompanyCam project that week
  (counted once per rep × project × week).
- **Week** = Monday–Sunday, America/New_York.

## Architecture

```
Python pipeline (deterministic)                Claude agent session (weekly)
────────────────────────────────               ─────────────────────────────
collect   3 APIs -> data/sources/     <──runs──  follows RUNBOOK.md
spend     monthly QB -> weekly files  <──feeds─  QuickBooks via MCP -> data/inputs/
compute   sources+spend -> data/weekly/          publishes dist/dashboard.html
dashboard history.json -> dist/dashboard.html      as the Claude Artifact
email     snapshot -> dist/email.md              sends email via Gmail MCP
                                                 commits data/ and pushes
```

- `compute` is a pure function of its inputs — re-running any week is
  idempotent, and every number on the dashboard traces to a committed
  snapshot in `data/weekly/`.
- A collector failure never kills the run: the section goes **stale** on the
  dashboard (carrying the last good week, clearly badged) and the email
  leads with the warning.
- Unmapped sources / stages / reps are never silently dropped — they land in
  an `unmapped`/`other` bucket **and** a warning, so config drift is visible.

## Layout

```
config/          the four mapping files (see below) — the only place tuning happens
kpi/             the pipeline (collectors, compute, dashboard, email, backfill)
data/            committed weekly data: sources/, inputs/spend/, weekly/, history.json
tests/           49 tests incl. golden files; fixtures = 14 weeks of realistic data
RUNBOOK.md       the exact script the Monday agent session follows
BACKFILL.md      one-time first-run procedure (discovery -> config -> 12-month backfill)
docs/TRIGGER_SETUP.md   how to schedule the Monday run
```

### Config files (the part that must match your accounts)

- `config/reps.yaml` — canonical rep list with each system's user id
- `config/channels.yaml` — GHL source strings → channel → QuickBooks sub-account
- `config/leap_stages.yaml` — your Leap workflow stages classified as
  open/sold/lost (+ retail/insurance field, lead-source field)
- `config/settings.yaml` — timezone, GHL location, dashboard options

Everything marked `FILL FROM DISCOVERY` gets filled in Phase B by running
`python -m kpi discover --source leap|ghl|companycam` with live tokens
(see BACKFILL.md).

## Quick start (no tokens needed)

```bash
pip install -r requirements.txt
python -m pytest              # 49 tests
python -m kpi demo            # fixtures -> dist/dashboard.html + dist/email.md
```

## CLI

```
python -m kpi collect --week last [--source leap]
python -m kpi spend-allocate --week last | --all
python -m kpi compute --week last | --all
python -m kpi history
python -m kpi dashboard
python -m kpi email --week last
python -m kpi backfill --months 12 [--source X] [--force]
python -m kpi discover --source leap|ghl|companycam
python -m kpi demo
```

## Secrets

Set as environment variables (or a local `.env`, gitignored): `LEAP_TOKEN`,
`COMPANYCAM_TOKEN`, `GHL_TOKEN`, `GHL_LOCATION_ID` — see `.env.example` for
where each is generated. QuickBooks and Gmail need no keys here; they're MCP
connectors of the Claude session.

## Status / go-live checklist

- [x] Phase A — pipeline, dashboard, email, tests, fixtures (this repo)
- [ ] Phase B — tokens added; discovery run; the four config files filled
      from real stage names / source strings / user ids
- [ ] Phase C — 12-month backfill; first real dashboard + email; Monday
      trigger created (docs/TRIGGER_SETUP.md); one supervised run
