# RUNBOOK — weekly Monday KPI run

You are the scheduled agent session (Mondays ~6:30am ET). Work through these
steps in order. Total expected time: a few minutes.

## 0. Setup

```bash
cd /home/user/SRE   # or wherever the repo is cloned
git pull --ff-only
pip install -r requirements.txt   # only if imports fail
```

The reporting week is the Mon–Sun week that ended yesterday. All commands
default to it via `--week last`.

## 1. Collect from the three APIs

```bash
python -m kpi collect --week last
```

- Prints one line per source. `ok` = fine.
- If a source printed `error`, retry ONCE: `python -m kpi collect --week last --source <name>`.
- Still failing? Continue anyway — compute will mark that section stale.
  Note the error for the email.

## 2. QuickBooks spend (you + MCP tools)

For each month the reporting week touches (usually one, two when the week
straddles a month boundary — the collect output header shows the week dates):

1. Pull that month's P&L via the QuickBooks MCP tools
   (`profit_loss_generator` / `profit_loss_quickbooks_account`), with detail
   by account, covering the "Advertising" account and its sub-accounts.
2. Write `data/inputs/spend/monthly/YYYY-MM.json` **exactly** in this shape
   (amounts are the month totals in dollars):

```json
{
  "month": "2026-06",
  "source": "quickbooks_mcp",
  "fetched_at": "<now, ISO-8601>",
  "accounts": {
    "Google": 2548.68,
    "Google LSA": 1942.70,
    "Facebook": 5424.36,
    "Ads Management": 3640.00,
    "Advertising & Marketing": 97.00
  },
  "pnl": {"revenue": 237113.49, "cogs": 155589.54, "gross_profit": 81523.95}
}
```

The account keys are the sub-accounts of the "Advertising & Marketing"
expense group, exactly as named in QuickBooks (they map through
`config/channels.yaml`). "Advertising & Marketing" itself is the parent
remainder — spend posted to the group but no sub-account.

- `accounts` keys must be the QuickBooks account names exactly as they map in
  `config/channels.yaml` (`qb_account:`). Include the parent "Advertising"
  remainder if there is spend not in any sub-account. `pnl` is optional but
  powers the gross-margin fallback — include it when available.
- For the current (incomplete) month, month-to-date totals are fine.

3. Then:

```bash
python -m kpi spend-allocate --week last
```

If QuickBooks MCP is unavailable: skip this step; spend/cost sections go
stale. Say so in the email.

## 3. Compute

```bash
python -m kpi compute --week last
python -m kpi history
```

- Copy any `warning:` lines — they go in the email verbatim.
- If `compute` CRASHES (traceback): stop. Do not rebuild the dashboard. Send
  the owner an email with the traceback and which step failed. Done.

## 4. Dashboard

```bash
python -m kpi dashboard
```

Publish `dist/dashboard.html` as the Claude Artifact:
- Redeploy to the existing artifact URL in `config/settings.yaml`
  (`dashboard.artifact_url`) — pass it as the `url` parameter so the owner's
  bookmarked link keeps working. Favicon: 🏠 — keep it.
- Do not edit the HTML by hand.

## 5. Email

```bash
python -m kpi email --week last
```

`dist/email.md`: line 1 is the subject; the rest is the body. Replace
`{{DASHBOARD_URL}}` with the artifact URL. Send via the Gmail MCP tools to
the owner (config/settings.yaml `owner_email`). Light formatting only —
never change the numbers.

## 6. Commit the data

```bash
git add data/
git commit -m "data: <week-id> weekly run"
git push -u origin <current branch>
```

(Retry pushes on network errors with backoff: 2s, 4s, 8s, 16s.)

## 7. Done — checklist

- [ ] 3 collect lines checked (retried any failure once)
- [ ] spend monthly file(s) written + allocated (or noted as skipped)
- [ ] compute + history ran; warnings captured
- [ ] artifact republished at the stable URL
- [ ] email sent with the dashboard link and any warnings
- [ ] data committed and pushed

## Re-running

Everything is idempotent per week. To redo this week after a fix, just run
steps 1–6 again — files are overwritten in place and history is rebuilt.
To recompute an older week: same commands with `--week YYYY-Www`.
