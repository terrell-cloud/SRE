"""Backfill: one ranged pull per API, bucketed into weekly source files.

Resumable — weeks whose source file already exists with status ok are kept
unless --force. Spend allocation and compute run afterwards via the CLI
(see BACKFILL.md for the full first-run procedure).
"""
from __future__ import annotations

import traceback
from datetime import timedelta
from pathlib import Path

from . import weeks
from .collectors import COLLECTORS, bucket_records, envelope
from .config import Config
from .util.io import read_json, write_json


def backfill_weeks(months: int, now_utc=None) -> list[str]:
    last = weeks.last_complete_week(now_utc)
    _, end = weeks.week_bounds(last)
    start_monday, _ = weeks.week_bounds(weeks.week_id(end - timedelta(days=months * 30)))
    return weeks.weeks_between(start_monday, end)


def run(
    months: int,
    data_dir: str | Path,
    config: Config,
    sources: list[str] | None = None,
    force: bool = False,
    now_utc=None,
) -> dict[str, str]:
    """Returns {source: summary} after writing all weekly source files."""
    data_dir = Path(data_dir)
    week_ids = backfill_weeks(months, now_utc)
    start_date, _ = weeks.week_bounds(week_ids[0])
    _, end_date = weeks.week_bounds(week_ids[-1])
    results: dict[str, str] = {}

    for source in sources or list(COLLECTORS):
        module = COLLECTORS[source]
        pending = []
        for wid in week_ids:
            path = data_dir / "sources" / source / f"{wid}.json"
            if not force and path.exists() and read_json(path).get("status") == "ok":
                continue
            pending.append(wid)
        if not pending:
            results[source] = "all weeks already collected (use --force to redo)"
            continue
        try:
            records = module.fetch_range(config, start_date, end_date)
        except Exception as e:  # noqa: BLE001
            traceback.print_exc()
            results[source] = f"FAILED: {type(e).__name__}: {e} — no files written, rerun to resume"
            continue
        buckets = bucket_records(source, records, pending)
        for wid in pending:
            write_json(
                data_dir / "sources" / source / f"{wid}.json",
                envelope(source, wid, "ok", buckets[wid], None),
            )
        results[source] = f"{len(records)} records -> {len(pending)} weekly files"
    return results
