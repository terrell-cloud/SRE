"""Rebuild data/history.json from all weekly snapshots.

Always a full rebuild (never append) so re-runs stay idempotent.
"""
from __future__ import annotations

from pathlib import Path

from .util.io import read_json, write_json


def rebuild(data_dir: str | Path) -> dict:
    data_dir = Path(data_dir)
    snapshots = {}
    for path in sorted((data_dir / "weekly").glob("*.json")):
        snap = read_json(path)
        if snap.get("week"):
            snapshots[snap["week"]] = snap
    ordered = sorted(snapshots.values(), key=lambda s: s["week_start"])
    history = {
        "weeks": [s["week"] for s in ordered],
        "snapshots": {s["week"]: s for s in ordered},
    }
    write_json(data_dir / "history.json", history)
    return history
