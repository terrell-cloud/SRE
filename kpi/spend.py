"""Marketing-spend allocation: monthly QuickBooks P&L -> Mon-Sun weeks.

Input files (written by the agent from QuickBooks MCP results):
    data/inputs/spend/monthly/YYYY-MM.json
    {
      "month": "2026-06",
      "source": "quickbooks_mcp",
      "fetched_at": "...",
      "accounts": {"Advertising:Google": 4200.0, "Advertising": 610.0},
      "pnl": {"revenue": ..., "cogs": ..., "gross_profit": ...}   # optional
    }

Output: data/inputs/spend/<week>.json with per-channel dollars.

Allocation is day-count pro-rata in integer cents with cumulative rounding, so
the weekly allocations of a month sum to the monthly total exactly.
"""
from __future__ import annotations

from pathlib import Path

from . import weeks
from .config import Config
from .util.io import read_json, write_json


def _month_week_shares(month: str) -> list[tuple[str, int]]:
    """[(week_id, days_of_that_week_in_month)] for every week touching month."""
    y, m = int(month[:4]), int(month[5:7])
    from datetime import date, timedelta

    first = date(y, m, 1)
    last = first + timedelta(days=weeks.days_in_month(month) - 1)
    return [(wid, weeks.days_of_week_in_month(wid, month)) for wid in weeks.weeks_between(first, last)]


def allocate_month_cents(total_cents: int, month: str) -> dict[str, int]:
    """Split a monthly total into per-week cents that sum exactly to the total."""
    shares = _month_week_shares(month)
    dim = weeks.days_in_month(month)
    out: dict[str, int] = {}
    cumulative_days = 0
    assigned = 0
    for wid, days in shares:
        cumulative_days += days
        target = round(total_cents * cumulative_days / dim)
        out[wid] = target - assigned
        assigned = target
    return out


def _load_monthly(spend_dir: Path, month: str) -> dict | None:
    path = spend_dir / "monthly" / f"{month}.json"
    return read_json(path) if path.exists() else None


def allocate_week(week_id: str, spend_dir: str | Path, config: Config) -> dict:
    """Build the weekly spend file for one week from the monthly inputs.

    Returns the weekly spend document (also written to <spend_dir>/<week>.json).
    Raises FileNotFoundError if no monthly input exists for any month the week
    touches — the caller records the spend section as unavailable.
    """
    spend_dir = Path(spend_dir)
    months = weeks.months_of_week(week_id)
    monthly_docs = {m: _load_monthly(spend_dir, m) for m in months}
    if all(doc is None for doc in monthly_docs.values()):
        raise FileNotFoundError(
            f"no monthly spend inputs for {week_id} (need {', '.join(months)} "
            f"under {spend_dir / 'monthly'})"
        )

    channel_cents: dict[str, int] = {c.key: 0 for c in config.channels}
    pnl_cents = {"revenue": 0, "cogs": 0, "gross_profit": 0}
    have_pnl = False
    months_used = []
    warnings: list[str] = []

    for month, doc in monthly_docs.items():
        if doc is None:
            warnings.append(f"monthly spend input missing for {month}; partial allocation")
            continue
        months_used.append(month)
        for account, amount in (doc.get("accounts") or {}).items():
            week_cents = allocate_month_cents(round(float(amount) * 100), month).get(week_id, 0)
            channel = config.channel_by_qb_account(account)
            if channel is None:
                # Parent account remainder or unmapped account -> default bucket.
                channel_cents[config.default_channel] += week_cents
                if ":" in account:
                    warnings.append(
                        f"QB account {account!r} not mapped in channels.yaml; "
                        f"allocated to {config.default_channel!r}"
                    )
            else:
                channel_cents[channel.key] += week_cents
        pnl = doc.get("pnl") or {}
        if pnl:
            have_pnl = True
            for k in pnl_cents:
                if pnl.get(k) is not None:
                    pnl_cents[k] += allocate_month_cents(round(float(pnl[k]) * 100), month).get(
                        week_id, 0
                    )

    doc = {
        "week": week_id,
        "allocation": "monthly_prorata",
        "months_used": months_used,
        "warnings": warnings,
        "channels": {k: v / 100 for k, v in channel_cents.items()},
        "gross_margin_fallback": (
            {k: v / 100 for k, v in pnl_cents.items()} if have_pnl else None
        ),
    }
    write_json(spend_dir / f"{week_id}.json", doc)
    return doc
