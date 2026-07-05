"""Collector registry and the common source-file envelope writer.

A collector module exposes:
    fetch_range(config, start_date, end_date, transport=None) -> list[record]
    bucket_week(record) -> str | list[str]   # which week(s) a record belongs to

Collector failures are DATA, not crashes: collect_week always writes a source
file; on failure it carries status="error" and the error message, and compute
turns that into a stale section instead of a dead dashboard.
"""
from __future__ import annotations

import traceback
from datetime import date, datetime, timezone
from pathlib import Path

from .. import weeks
from ..config import Config
from ..util.io import write_json

from . import companycam, ghl, leap  # noqa: E402  (registry imports)

COLLECTORS = {"companycam": companycam, "ghl": ghl, "leap": leap}


def _now_iso() -> str:
    return datetime.now(timezone.utc).astimezone(weeks.BUSINESS_TZ).isoformat()


def envelope(source: str, week_id: str, status: str, records: list, error: str | None) -> dict:
    week_start, week_end = weeks.week_bounds(week_id)
    return {
        "source": source,
        "week": week_id,
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "status": status,
        "fetched_at": _now_iso(),
        "error": error,
        "records": records,
    }


def collect_week(
    source: str,
    week_id: str,
    data_dir: str | Path,
    config: Config,
    transport=None,
) -> dict:
    module = COLLECTORS[source]
    week_start, week_end = weeks.week_bounds(week_id)
    try:
        records = module.fetch_range(config, week_start, week_end, transport=transport)
        doc = envelope(source, week_id, "ok", records, None)
    except Exception as e:  # noqa: BLE001 — failures become stale sections
        doc = envelope(source, week_id, "error", [], f"{type(e).__name__}: {e}")
        traceback.print_exc()
    write_json(Path(data_dir) / "sources" / source / f"{week_id}.json", doc)
    return doc


def bucket_records(source: str, records: list[dict], week_ids: list[str]) -> dict[str, list]:
    """Assign a ranged pull's records to weekly buckets (backfill path)."""
    module = COLLECTORS[source]
    wanted = set(week_ids)
    out: dict[str, list] = {w: [] for w in week_ids}
    for r in records:
        wids = module.bucket_week(r)
        for wid in [wids] if isinstance(wids, str) else wids:
            if wid in wanted:
                out[wid].append(r)
    return out
