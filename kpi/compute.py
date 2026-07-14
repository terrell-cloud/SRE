"""The KPI engine: normalized source files + spend input + config -> snapshot.

Pure function of its inputs (plus previous snapshots for stale carry-forward),
so re-running a week is idempotent and golden-file testable.

KPI definitions
---------------
- Sold decision: a stage-history entry (within the week) into the stage marked
  ``pipeline: contract_signed`` in leap_stages.yaml. Lost decision: an entry
  into any stage with ``class: lost``. Closing % = sold / (sold + lost).
- Leads: GHL contacts added in the week, bucketed by channel via channels.yaml.
- Cost/lead and CAC divide weekly channel spend by leads / new customers;
  channels with no QB account (unpaid) render null.
- Inspections: CompanyCam distinct (rep, project) photo-activity rows.
- Production started/completed from stage-history entries; in-production and
  backlog from the collector's point-in-time backlog_snapshot record.
- Gross margin from jobs completed in the week that carry cost data, falling
  back to the QuickBooks P&L pro-rata when none do.
"""
from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from . import weeks
from .config import Config
from .util.io import read_json, write_json

SOURCES = ("ghl", "leap", "companycam")

# Which snapshot KPIs belong to which section (drives stale carry-forward).
SECTION_KPIS = {
    "marketing": ["leads_by_source"],
    "spend": ["spend_by_channel", "cost_per_lead", "cac_by_source"],
    "sales": ["closing_pct_retail", "closing_pct_insurance", "customers_by_source"],
    "inspections": ["inspections_by_rep"],
    "revenue_production": [
        "revenue_sold",
        "revenue_collected",
        "avg_job_size",
        "pipeline",
        "production",
        "gross_margin",
    ],
}
SECTION_SOURCE = {
    "marketing": "ghl",
    "sales": "leap",
    "inspections": "companycam",
    "revenue_production": "leap",
}


def _load_source(data_dir: Path, source: str, week_id: str) -> dict | None:
    path = data_dir / "sources" / source / f"{week_id}.json"
    return read_json(path) if path.exists() else None


def _pct(sold: int, lost: int) -> float | None:
    total = sold + lost
    return round(100.0 * sold / total, 1) if total else None


def _ratio(numer: float | None, denom: float | None) -> float | None:
    if numer is None or not denom:
        return None
    return round(numer / denom, 2)


def _decisions(record: dict, config: Config, week_start, week_end):
    """Yield ('sold'|'lost', entry) for in-week decision events on a job."""
    history = record.get("stage_history") or [
        {"stage": record.get("stage_raw"), "entered_at": record.get("stage_entered_at")}
    ]
    for entry in history:
        if not entry.get("entered_at"):
            continue
        day = weeks.to_business(entry["entered_at"]).date()
        if not (week_start <= day <= week_end):
            continue
        stage = config.stage(entry.get("stage"))
        if stage is None:
            continue
        if stage.pipeline == "contract_signed":
            yield "sold", entry
        elif stage.cls == "lost":
            yield "lost", entry


def _in_week_entries(record: dict, config: Config, week_start, week_end):
    history = record.get("stage_history") or [
        {"stage": record.get("stage_raw"), "entered_at": record.get("stage_entered_at")}
    ]
    for entry in history:
        if not entry.get("entered_at"):
            continue
        day = weeks.to_business(entry["entered_at"]).date()
        if week_start <= day <= week_end:
            stage = config.stage(entry.get("stage"))
            if stage is not None:
                yield stage, entry


def compute_week(
    week_id: str,
    data_dir: str | Path,
    config: Config,
    generated_at: str | None = None,
) -> dict:
    data_dir = Path(data_dir)
    week_start, week_end = weeks.week_bounds(week_id)
    warnings: list[str] = []
    sections: dict[str, dict] = {}
    kpis: dict = {}

    docs = {s: _load_source(data_dir, s, week_id) for s in SOURCES}
    spend_path = data_dir / "inputs" / "spend" / f"{week_id}.json"
    spend_doc = read_json(spend_path) if spend_path.exists() else None

    def source_ok(source: str) -> bool:
        return docs[source] is not None and docs[source].get("status") == "ok"

    def source_error(source: str) -> str | None:
        if docs[source] is None:
            return "source file missing"
        if docs[source].get("status") != "ok":
            return docs[source].get("error") or "collector reported an error"
        return None

    channel_keys = [c.key for c in config.channels]

    # ---------- marketing: leads by source (GHL) ----------
    if source_ok("ghl"):
        leads = Counter({k: 0 for k in channel_keys})
        unmapped: Counter = Counter()
        for r in docs["ghl"]["records"]:
            if r.get("type") != "contact":
                continue
            channel, mapped = config.channel_for_source(r.get("source_raw"))
            leads[channel] += 1
            if not mapped and r.get("source_raw"):
                unmapped[r["source_raw"].strip()] += 1
        kpis["leads_by_source"] = dict(leads)
        for value, n in sorted(unmapped.items()):
            warnings.append(
                f"{n} GHL contact(s) had unmapped source {value!r} -> "
                f"bucketed to {config.default_channel!r} (add to channels.yaml)"
            )
        sections["marketing"] = {"status": "ok", "as_of_week": week_id}
    else:
        sections["marketing"] = {"status": "stale", "error": source_error("ghl")}

    # ---------- sales + revenue/production (Leap) ----------
    if source_ok("leap"):
        by_div = {
            "retail": {"overall": Counter(), "by_rep": {}},
            "insurance": {"overall": Counter(), "by_rep": {}},
        }
        customers = Counter({k: 0 for k in channel_keys})
        pipeline = Counter(
            {"appointments_set": 0, "appointments_run": 0, "estimates_given": 0, "contracts_signed": 0}
        )
        _PIPELINE_KEY = {
            "appointment_set": "appointments_set",
            "appointment_run": "appointments_run",
            "estimate_given": "estimates_given",
            "contract_signed": "contracts_signed",
        }
        revenue_sold = 0.0
        contracts = 0
        collected = 0.0
        invoiced = 0.0
        started = completed = 0
        margin_contract = margin_cost = 0.0
        margin_jobs = 0
        backlog = None
        unmapped_reps: Counter = Counter()
        unmapped_stages: Counter = Counter()

        for r in docs["leap"]["records"]:
            if r.get("type") == "backlog_snapshot":
                backlog = r
                continue
            if r.get("type") == "appointment":
                # Appointments come from Leap's /appointments endpoint:
                # "set" = scheduled in the week, "run" = marked completed/resulted.
                if r.get("scheduled_for"):
                    day = weeks.to_business(r["scheduled_for"]).date()
                    if week_start <= day <= week_end:
                        pipeline["appointments_set"] += 1
                        if r.get("completed"):
                            pipeline["appointments_run"] += 1
                continue
            if r.get("type") != "job":
                continue

            rep = config.rep_by("leap", r.get("rep_leap_id"))
            rep_key = rep.key if rep else "unmapped"
            if rep is None and r.get("rep_leap_id"):
                unmapped_reps[str(r["rep_leap_id"])] += 1
            division = config.division_for(r.get("division_raw"))

            history = r.get("stage_history") or []
            for entry in history:
                if config.stage(entry.get("stage")) is None and entry.get("stage"):
                    unmapped_stages[entry["stage"]] += 1

            for stage, _entry in _in_week_entries(r, config, week_start, week_end):
                if stage.pipeline:
                    pipeline[_PIPELINE_KEY[stage.pipeline]] += 1
                if stage.production == "started":
                    started += 1
                if stage.production == "completed":
                    completed += 1
                    if (r.get("cost_amount") or 0) > 0 and (r.get("contract_amount") or 0) > 0:
                        margin_contract += r["contract_amount"]
                        margin_cost += r["cost_amount"]
                        margin_jobs += 1

            for kind, _entry in _decisions(r, config, week_start, week_end):
                if division in by_div:
                    div = by_div[division]
                    div["overall"][kind] += 1
                    div["by_rep"].setdefault(rep_key, Counter())[kind] += 1
                elif r.get("division_raw"):
                    warnings.append(
                        f"job {r.get('id')} has unmapped division "
                        f"{r['division_raw']!r} (add to leap_stages.yaml)"
                    )
                if kind == "sold":
                    amount = r.get("contract_amount") or 0
                    revenue_sold += amount
                    contracts += 1
                    channel, _ = config.channel_for_source(r.get("source_raw"))
                    customers[channel] += 1

            collected += r.get("collected_amount") or 0
            invoiced += r.get("invoiced_amount") or 0

        for div_name, div in by_div.items():
            overall = div["overall"]
            kpis[f"closing_pct_{div_name}"] = {
                "overall": {
                    "sold": overall["sold"],
                    "lost": overall["lost"],
                    "pct": _pct(overall["sold"], overall["lost"]),
                },
                "by_rep": {
                    rep: {"sold": c["sold"], "lost": c["lost"], "pct": _pct(c["sold"], c["lost"])}
                    for rep, c in sorted(div["by_rep"].items())
                },
            }
        kpis["customers_by_source"] = dict(customers)
        kpis["revenue_sold"] = {"total": round(revenue_sold, 2), "contracts": contracts}
        kpis["avg_job_size"] = _ratio(revenue_sold, contracts)
        kpis["pipeline"] = dict(pipeline)
        kpis["production"] = {
            "started": started,
            "completed": completed,
            "in_production": backlog.get("in_production_jobs") if backlog else None,
            "backlog_jobs": backlog.get("backlog_jobs") if backlog else None,
            "backlog_value": backlog.get("backlog_value") if backlog else None,
        }

        qb_weekly_revenue = (
            (spend_doc.get("gross_margin_fallback") or {}).get("revenue") if spend_doc else None
        )
        kpis["revenue_collected"] = {
            "leap": round(collected, 2),
            "invoiced": round(invoiced, 2),
            "quickbooks": qb_weekly_revenue,
            "note": "quickbooks = monthly P&L revenue pro-rated to the week (different accounting basis)",
        }

        if margin_jobs:
            kpis["gross_margin"] = {
                "pct": round(100.0 * (margin_contract - margin_cost) / margin_contract, 1),
                "basis": "leap_job_financials",
                "jobs_counted": margin_jobs,
            }
        else:
            pnl = (spend_doc or {}).get("gross_margin_fallback") or {}
            if pnl.get("revenue"):
                kpis["gross_margin"] = {
                    "pct": round(100.0 * pnl["gross_profit"] / pnl["revenue"], 1),
                    "basis": "quickbooks_pnl_prorata",
                    "jobs_counted": 0,
                }
            else:
                kpis["gross_margin"] = {"pct": None, "basis": None, "jobs_counted": 0}

        for uid, n in sorted(unmapped_reps.items()):
            warnings.append(
                f"{n} Leap job(s) assigned to unmapped user id {uid!r} (add to reps.yaml)"
            )
        for stage_name, n in sorted(unmapped_stages.items()):
            warnings.append(
                f"{n} stage event(s) with unmapped Leap stage {stage_name!r} "
                f"(add to leap_stages.yaml)"
            )
        if unmapped_reps and config.unmapped_policy == "error":
            raise ValueError(f"unmapped Leap user ids with unmapped_policy=error: {dict(unmapped_reps)}")
        sections["sales"] = {"status": "ok", "as_of_week": week_id}
        sections["revenue_production"] = {"status": "ok", "as_of_week": week_id}
    else:
        err = source_error("leap")
        sections["sales"] = {"status": "stale", "error": err}
        sections["revenue_production"] = {"status": "stale", "error": err}

    # ---------- inspections (CompanyCam) ----------
    if source_ok("companycam"):
        inspections: Counter = Counter()
        unmapped_cc: Counter = Counter()
        for r in docs["companycam"]["records"]:
            rep = config.rep_by("companycam", r.get("creator_id"))
            if rep:
                inspections[rep.key] += 1
            else:
                inspections["unmapped"] += 1
                unmapped_cc[str(r.get("creator_name") or r.get("creator_id"))] += 1
        for rep in config.reps:
            if rep.active:
                inspections.setdefault(rep.key, 0)
        kpis["inspections_by_rep"] = dict(inspections)
        for who, n in sorted(unmapped_cc.items()):
            warnings.append(
                f"{n} CompanyCam photo-activity row(s) from unmapped user {who!r} "
                f"(add to reps.yaml or ignore if not a sales rep)"
            )
        sections["inspections"] = {"status": "ok", "as_of_week": week_id}
    else:
        sections["inspections"] = {"status": "stale", "error": source_error("companycam")}

    # ---------- spend / cost-per-lead / CAC (QuickBooks input) ----------
    if spend_doc is not None:
        kpis["spend_by_channel"] = dict(spend_doc.get("channels") or {})
        warnings.extend(spend_doc.get("warnings") or [])
        sections["spend"] = {"status": "ok", "as_of_week": week_id}
    else:
        sections["spend"] = {
            "status": "stale",
            "error": f"no weekly spend input at {spend_path.name} (QuickBooks pull missing?)",
        }

    # ---------- stale carry-forward ----------
    prior = _load_prior_snapshots(data_dir, before_week=week_id)
    for name, meta in sections.items():
        if meta["status"] == "ok":
            continue
        carried = None
        for snap in prior:  # newest first
            sec = snap.get("sections", {}).get(name)
            if sec and sec.get("status") == "ok":
                carried = snap
                break
        if carried:
            meta["as_of_week"] = carried["week"]
            for kpi_name in SECTION_KPIS[name]:
                if kpi_name in carried.get("kpis", {}):
                    kpis[kpi_name] = carried["kpis"][kpi_name]
            warnings.append(
                f"section {name!r} is stale ({meta.get('error')}); showing week {carried['week']}"
            )
        else:
            meta["status"] = "missing"
            meta["as_of_week"] = None
            for kpi_name in SECTION_KPIS[name]:
                kpis.setdefault(kpi_name, None)
            warnings.append(f"section {name!r} unavailable and no prior data ({meta.get('error')})")

    # Cost/lead and CAC recomputed from whatever leads/customers/spend resolved
    # to (fresh or carried), so the three stay mutually consistent.
    spend_by_channel = kpis.get("spend_by_channel") or {}
    leads_by_source = kpis.get("leads_by_source") or {}
    customers_by_source = kpis.get("customers_by_source") or {}
    paid = {c.key for c in config.channels if c.qb_account}
    kpis["cost_per_lead"] = {
        k: (_ratio(spend_by_channel.get(k), leads_by_source.get(k)) if k in paid else None)
        for k in channel_keys
    }
    kpis["cac_by_source"] = {
        k: (_ratio(spend_by_channel.get(k), customers_by_source.get(k)) if k in paid else None)
        for k in channel_keys
    }

    snapshot = {
        "schema_version": 1,
        "week": week_id,
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "generated_at": generated_at
        or datetime.now(timezone.utc).astimezone(weeks.BUSINESS_TZ).isoformat(),
        "sections": sections,
        "warnings": warnings,
        "kpis": kpis,
    }
    write_json(data_dir / "weekly" / f"{week_id}.json", snapshot)
    return snapshot


def _load_prior_snapshots(data_dir: Path, before_week: str) -> list[dict]:
    """Prior weekly snapshots, newest first, ordered by week_start."""
    weekly_dir = data_dir / "weekly"
    if not weekly_dir.exists():
        return []
    before_start, _ = weeks.week_bounds(before_week)
    snaps = []
    for path in weekly_dir.glob("*.json"):
        snap = read_json(path)
        if snap.get("week") and snap.get("week_start") and snap["week_start"] < before_start.isoformat():
            snaps.append(snap)
    return sorted(snaps, key=lambda s: s["week_start"], reverse=True)
