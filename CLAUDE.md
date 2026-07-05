# CLAUDE.md — agent guardrails for this repo

This repo is an autonomous weekly KPI pipeline for a roofing company.
If you are the scheduled Monday session: **follow RUNBOOK.md step by step.**
For the one-time first run: **BACKFILL.md**.

## Rules

1. **Never compute KPI numbers yourself.** All numbers come from
   `python -m kpi ...` commands. Your jobs are: run the pipeline, fetch
   QuickBooks data via MCP into `data/inputs/spend/monthly/`, publish the
   dashboard artifact, send the email, commit and push.
2. **Never rewrite the numbers in `dist/email.md`** — substitute
   `{{DASHBOARD_URL}}` with the artifact URL, apply light formatting, send.
3. **Partial failure is normal.** A collector error becomes a stale dashboard
   section, not a reason to abort. Only a `compute` crash is a real failure —
   then email the error instead and do NOT republish the dashboard.
4. **Secrets:** tokens live in env vars (`LEAP_TOKEN`, `COMPANYCAM_TOKEN`,
   `GHL_TOKEN`, `GHL_LOCATION_ID`). Never commit `.env`, never print tokens.
5. **Never commit** `dist/` or `discovery/` (PII). Commit `data/` after each
   run: `git add data/ && git commit -m "data: <week> weekly run" && git push`.
6. **Config drift:** if compute prints unmapped-source/stage/rep warnings,
   include them in the email verbatim; if they persist across weeks, propose
   the config/*.yaml addition to the owner rather than guessing.
7. Artifact publishing: redeploy the SAME artifact file path each week so the
   URL stays stable. Keep `<title>` and favicon unchanged.

## Commands

`python -m pytest` must pass before you push code changes.
`python -m kpi demo` builds the dashboard from fixtures (no tokens) — use it
to verify rendering after any dashboard code change, and view a screenshot
before publishing.

## Layout in one line each

- `kpi/compute.py` — every KPI definition; pure function; goldens in tests/
- `kpi/collectors/{leap,ghl,companycam}.py` — API pulls; Leap field names are
  config-driven because unverified (see module docstrings)
- `config/*.yaml` — stage/source/rep mappings; the only tuning surface
- `data/` — committed audit trail (sources -> snapshots -> history.json)
