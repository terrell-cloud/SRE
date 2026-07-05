"""Command-line entry point: python -m kpi <command> [options].

Commands
--------
collect        pull one week from the 3 APIs -> data/sources/
spend-allocate turn monthly QuickBooks inputs into weekly spend files
compute        build the weekly KPI snapshot -> data/weekly/
history        rebuild data/history.json from all snapshots
dashboard      render dist/dashboard.html from history.json
email          render dist/email.md for the latest week
backfill       ranged 12-month pull bucketed into weekly source files
discover       validate a token and dump real schemas/ids for config mapping
demo           full pipeline over the committed fixtures -> dist/ (no tokens)
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

from . import backfill as backfill_mod
from . import compute as compute_mod
from . import history as history_mod
from . import spend as spend_mod
from . import weeks
from .config import load_config
from .util.env import load_dotenv
from .util.io import read_json


def _resolve_week(value: str) -> str:
    if value == "last":
        return weeks.last_complete_week()
    weeks.week_bounds(value)  # validates format
    return value


def _all_source_weeks(data_dir: Path) -> list[str]:
    wids = {p.stem for src in ("ghl", "leap", "companycam") for p in
            (data_dir / "sources" / src).glob("*.json")}
    return sorted(wids, key=lambda w: weeks.week_bounds(w)[0])


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="kpi")
    parser.add_argument("--config-dir", default="config")
    parser.add_argument("--data-dir", default="data")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("collect", help="collect one week from the APIs")
    p.add_argument("--week", default="last")
    p.add_argument("--source", choices=["ghl", "leap", "companycam"])

    p = sub.add_parser("spend-allocate", help="monthly spend inputs -> weekly files")
    p.add_argument("--week", default="last")
    p.add_argument("--all", action="store_true", help="allocate every collected week")

    p = sub.add_parser("compute", help="compute the weekly KPI snapshot")
    p.add_argument("--week", default="last")
    p.add_argument("--all", action="store_true", help="compute every collected week, oldest first")

    sub.add_parser("history", help="rebuild history.json")
    sub.add_parser("dashboard", help="render dist/dashboard.html")

    p = sub.add_parser("email", help="render dist/email.md")
    p.add_argument("--week", default="last")

    p = sub.add_parser("backfill", help="ranged pull -> weekly source files")
    p.add_argument("--months", type=int, default=12)
    p.add_argument("--source", choices=["ghl", "leap", "companycam"])
    p.add_argument("--force", action="store_true")

    p = sub.add_parser("discover", help="dump live schemas for config mapping")
    p.add_argument("--source", required=True, choices=["ghl", "leap", "companycam"])

    sub.add_parser("demo", help="fixtures -> full pipeline -> dist/ (no tokens needed)")

    args = parser.parse_args(argv)
    load_dotenv()

    if args.cmd == "demo":
        return _demo()

    config = load_config(args.config_dir)
    data_dir = Path(args.data_dir)

    if args.cmd == "collect":
        from .collectors import COLLECTORS, collect_week

        wid = _resolve_week(args.week)
        failures = 0
        for source in [args.source] if args.source else list(COLLECTORS):
            doc = collect_week(source, wid, data_dir, config)
            status = doc["status"]
            print(f"{source}: {status} — {len(doc['records'])} records"
                  + (f" ({doc['error']})" if doc["error"] else ""))
            failures += status != "ok"
        return 0  # partial failure is data, not a crash (compute goes stale)

    if args.cmd == "spend-allocate":
        wids = _all_source_weeks(data_dir) if args.all else [_resolve_week(args.week)]
        for wid in wids:
            try:
                doc = spend_mod.allocate_week(wid, data_dir / "inputs" / "spend", config)
                print(f"{wid}: {doc['channels']}")
            except FileNotFoundError as e:
                print(f"{wid}: SKIPPED — {e}", file=sys.stderr)
        return 0

    if args.cmd == "compute":
        wids = _all_source_weeks(data_dir) if args.all else [_resolve_week(args.week)]
        for wid in wids:
            snap = compute_mod.compute_week(wid, data_dir, config)
            statuses = {k: v["status"] for k, v in snap["sections"].items()}
            print(f"{wid}: {statuses}")
            for w in snap["warnings"]:
                print(f"  warning: {w}")
        return 0

    if args.cmd == "history":
        h = history_mod.rebuild(data_dir)
        print(f"history.json rebuilt: {len(h['weeks'])} weeks "
              f"({h['weeks'][0] if h['weeks'] else '-'} .. {h['weeks'][-1] if h['weeks'] else '-'})")
        return 0

    if args.cmd == "dashboard":
        from .dashboard import build as dash_build

        out = dash_build.build(data_dir, config)
        print(f"dashboard written: {out}")
        return 0

    if args.cmd == "email":
        from . import email_summary

        out = email_summary.render(data_dir, config)
        print(f"email written: {out} (subject: {out.read_text().splitlines()[0]})")
        return 0

    if args.cmd == "backfill":
        results = backfill_mod.run(
            args.months, data_dir, config,
            sources=[args.source] if args.source else None, force=args.force,
        )
        for source, summary in results.items():
            print(f"{source}: {summary}")
        return 1 if any(s.startswith("FAILED") for s in results.values()) else 0

    if args.cmd == "discover":
        from . import discovery

        discovery.run(args.source, config)
        return 0

    raise AssertionError(f"unhandled command {args.cmd}")


def _demo() -> int:
    """Fixtures -> spend-allocate -> compute -> history -> dashboard + email."""
    root = Path(__file__).resolve().parents[1]
    fixtures = root / "tests" / "fixtures"
    demo_data = root / "dist" / "demo-data"
    if demo_data.exists():
        shutil.rmtree(demo_data)
    shutil.copytree(fixtures / "sources", demo_data / "sources")
    shutil.copytree(fixtures / "inputs" / "spend", demo_data / "inputs" / "spend")

    config = load_config(fixtures / "config")
    wids = _all_source_weeks(demo_data)
    for wid in wids:
        spend_mod.allocate_week(wid, demo_data / "inputs" / "spend", config)
        compute_mod.compute_week(wid, demo_data, config)
    history_mod.rebuild(demo_data)

    from . import email_summary
    from .dashboard import build as dash_build

    dash = dash_build.build(demo_data, config, root / "dist" / "dashboard.html")
    email = email_summary.render(demo_data, config, root / "dist" / "email.md")
    print(f"demo complete: {len(wids)} weeks\n  {dash}\n  {email}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
