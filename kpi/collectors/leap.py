"""Leap CRM (formerly JobProgress) collector — verified against the live API.

Live-API facts this collector is built on (discovered Jul 2026):
  - Base https://api.jobprogress.com/api/v3/, `Authorization: Bearer <token>`.
  - Working endpoints: /jobs, /customers, /appointments, /company/users.
    Pagination: ?page=N&limit=50 with meta.pagination; default order is
    most-recently-updated first. NO server-side date filters exist.
  - The company is small (~1.4k jobs, ~550 appointments), so we fetch
    everything each run and filter locally. This also makes the backlog
    snapshot accurate (computed over ALL open jobs at fetch time).
  - Jobs expose: current_stage {code,color,name}, stage_last_modified,
    insurance ("0"/"1" -> retail/insurance), contract_signed_date,
    completion_date, plus includes: estimators (the rep), customer
    (referred_by_type = lead source), financial_details (total_job_price,
    total_payment_received, final_job_total).
  - No stage-transition history is exposed, so decision events are
    synthesized from date fields as pseudo-stages "(contract signed)" and
    "(completed)" — classified in config/leap_stages.yaml.
"""
from __future__ import annotations

from datetime import date

from .. import weeks
from ..config import Config
from ..util.env import require_env
from ..util.http import ApiSession

PER_PAGE = 50
MAX_PAGES = 400  # hard stop ≈ 20k records; company has ~1.4k jobs today


def make_session(config: Config, transport=None) -> ApiSession:
    settings = config.settings.get("leap") or {}
    token = require_env("LEAP_TOKEN")
    scheme = settings.get("auth_scheme", "bearer")
    auth = f"Bearer {token}" if scheme == "bearer" else token
    return ApiSession(
        settings.get("base_url", "https://api.jobprogress.com/api/v3/"),
        headers={"Authorization": auth, "Accept": "application/json"},
        min_interval_s=0.5,  # conservative ~2 req/s; Leap's limits are unpublished
        transport=transport,
    )


def _get_pages(session: ApiSession, path: str, params: dict) -> list[dict]:
    items: list[dict] = []
    page = 1
    while page <= MAX_PAGES:
        resp = session.get(path, params={**params, "page": page, "limit": PER_PAGE})
        batch = resp.get("data") if isinstance(resp, dict) else resp
        if not batch:
            break
        items.extend(batch)
        total_pages = ((resp.get("meta") or {}).get("pagination") or {}).get("total_pages")
        if (total_pages and page >= total_pages) or len(batch) < PER_PAGE:
            break
        page += 1
    return items


def _unwrap(value):
    """Includes arrive either bare or wrapped as {"data": ...}."""
    if isinstance(value, dict) and set(value.keys()) <= {"data"}:
        return value["data"]
    return value


def _week_or_none(ts) -> str | None:
    if not ts or str(ts).startswith("None"):
        return None
    try:
        return weeks.week_of_timestamp(str(ts))
    except (ValueError, TypeError):
        return None


def _normalize_job(raw: dict, config: Config) -> dict:
    stage = raw.get("current_stage") or {}
    stage_name = stage.get("name") if isinstance(stage, dict) else str(stage or "")
    stage_entered_at = raw.get("stage_last_modified") or raw.get("updated_at")

    history = []
    if stage_name and stage_entered_at:
        history.append({"stage": stage_name, "entered_at": stage_entered_at})

    signed = raw.get("contract_signed_date")
    if signed and not str(signed).startswith("None"):
        history.append({"stage": "(contract signed)", "entered_at": signed})

    completed = raw.get("completion_date")
    if completed and not str(completed).startswith("None"):
        # Skip the pseudo-event when the current stage already records the
        # completion in the same week (avoids double-counting "completed").
        cs = config.stage(stage_name)
        same_week = _week_or_none(completed) == _week_or_none(stage_entered_at)
        if not (cs and cs.production == "completed" and same_week):
            history.append({"stage": "(completed)", "entered_at": completed})

    estimators = _unwrap(raw.get("estimators")) or []
    # Many jobs carry no estimator; fall back to the creating user so rep
    # attribution stays usable (office-created jobs then attribute to office).
    rep_id = str(estimators[0].get("id")) if estimators else str(raw.get("created_by") or "")

    customer = _unwrap(raw.get("customer")) or {}
    source_raw = (customer.get("referred_by_type") or "").strip()

    fin = _unwrap(raw.get("financial_details")) or {}

    def money(*keys):
        for k in keys:
            v = fin.get(k)
            if v not in (None, "", "0", 0):
                try:
                    return float(v)
                except (TypeError, ValueError):
                    continue
        return 0.0

    return {
        "type": "job",
        "id": str(raw.get("id")),
        "customer_id": str(raw.get("customer_id") or customer.get("id") or ""),
        "rep_leap_id": rep_id,
        "division_raw": "Insurance" if str(raw.get("insurance")) in ("1", "True", "true") else "Retail",
        "stage_raw": stage_name,
        "stage_entered_at": stage_entered_at,
        "stage_history": history,
        "source_raw": source_raw,
        "contract_amount": money("total_job_price", "final_job_total", "total_job_revenue"),
        "invoiced_amount": money("final_job_total"),
        "collected_amount": money("total_payment_received"),
        "cost_amount": 0.0,  # job costs not exposed by the API; margin falls back to QB P&L
        "created_at": raw.get("created_date") or raw.get("created_at"),
        "modified_at": raw.get("updated_at"),
    }


def _normalize_appointment(raw: dict) -> dict:
    result_field = raw.get("result")
    if isinstance(result_field, (list, dict)):
        result = "yes" if result_field else ""
    else:
        result = (result_field or "").strip()
    return {
        "type": "appointment",
        "id": str(raw.get("id")),
        "rep_leap_id": str(raw.get("user_id") or ""),
        "customer_id": str(raw.get("customer_id") or ""),
        "scheduled_for": raw.get("start_date_time"),
        "completed": bool(raw.get("is_completed")) or bool(result),
        "created_at": raw.get("created_at"),
    }


def fetch_range(config: Config, start_date: date, end_date: date, transport=None) -> list[dict]:
    session = make_session(config, transport)
    raw_jobs = _get_pages(
        session,
        "/jobs",
        {"includes[]": ["estimators", "customer", "financial_details"]},
    )
    all_jobs = [_normalize_job(j, config) for j in raw_jobs]
    raw_appts = _get_pages(session, "/appointments", {})
    all_appts = [_normalize_appointment(a) for a in raw_appts]

    # Keep only records with an event inside the requested range; the
    # backlog snapshot is computed over ALL jobs (point-in-time truth).
    lo, hi = start_date.isoformat(), end_date.isoformat()

    def _in_range(wid_source) -> bool:
        wid = _week_or_none(wid_source)
        if wid is None:
            return False
        ws, we = weeks.week_bounds(wid)
        return ws.isoformat() <= hi and we.isoformat() >= lo

    records: list[dict] = []
    for job in all_jobs:
        if any(_in_range(h["entered_at"]) for h in job["stage_history"]):
            records.append(job)
    for appt in all_appts:
        if _in_range(appt.get("scheduled_for")):
            records.append(appt)

    snapshot = _backlog_snapshot(all_jobs, config, end_date)
    if snapshot:
        records.append(snapshot)
    return records


def _backlog_snapshot(all_jobs: list[dict], config: Config, as_of: date) -> dict | None:
    backlog_jobs = 0
    backlog_value = 0.0
    in_production = 0
    for r in all_jobs:
        stage = config.stage(r.get("stage_raw"))
        if stage is None or stage.cls != "sold" or stage.production == "completed":
            continue
        backlog_jobs += 1
        backlog_value += r.get("contract_amount") or 0
        if stage.production in ("in_production", "started"):
            in_production += 1
    return {
        "type": "backlog_snapshot",
        "as_of": as_of.isoformat(),
        "backlog_jobs": backlog_jobs,
        "backlog_value": round(backlog_value, 2),
        "in_production_jobs": in_production,
        "basis": "all_open_jobs_at_fetch_time",
    }


def bucket_week(record: dict) -> list[str]:
    if record.get("type") == "appointment":
        wid = _week_or_none(record.get("scheduled_for"))
        return [wid] if wid else []
    if record.get("type") != "job":
        wid = _week_or_none(record.get("as_of"))
        return [wid] if wid else []
    wids = {
        w for h in record.get("stage_history") or []
        if (w := _week_or_none(h.get("entered_at")))
    }
    return sorted(wids)


def fetch_users(config: Config, transport=None) -> list[dict]:
    session = make_session(config, transport)
    return _get_pages(session, "/company/users", {})
