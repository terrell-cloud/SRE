"""Leap CRM (formerly JobProgress) collector: jobs -> sales/production records.

API: https://api.jobprogress.com/api/v3/ with a long-lived self-generated
token. UNVERIFIED SPECIFICS (Leap's docs block automated readers — confirm in
Phase B via `python -m kpi discover --source leap` and adjust here + config):
  - auth header: `Authorization: Bearer <token>` (settings leap.auth_scheme:
    bearer) vs raw token header (auth_scheme: token-header)
  - jobs list date-filter params: assumed `updated_from` / `updated_to`
  - field names on the job object: the normalizer below reads each logical
    field from a list of candidate keys so most discovery findings are a
    one-line change.

The normalizer emits one record per job carrying the stage history (if the API
exposes it) so compute can count decisions/pipeline/production events by week.
"""
from __future__ import annotations

from datetime import date

from .. import weeks
from ..config import Config
from ..util.env import require_env
from ..util.http import ApiSession

PER_PAGE = 50
MAX_PAGES = 5000

# Candidate raw-field names per logical field, first match wins.
FIELD_CANDIDATES = {
    "rep_id": ["rep_id", "sales_rep_id", "estimator_id", "user_id"],
    "stage": ["current_stage", "stage", "workflow_stage", "stage_name"],
    "stage_entered_at": ["stage_changed_date", "stage_last_modified", "moved_to_stage_at"],
    "contract_amount": ["amount", "total_amount", "contract_amount", "job_amount", "total_job_amount"],
    "invoiced_amount": ["invoiced_amount", "total_invoiced", "invoice_amount"],
    "collected_amount": ["payment_received", "total_received_payment", "amount_received"],
    "cost_amount": ["total_cost", "job_cost", "actual_cost"],
    "created_at": ["created_at", "created_date"],
    "modified_at": ["updated_at", "modified_at", "last_modified"],
}


def _pick(raw: dict, logical: str):
    for key in FIELD_CANDIDATES[logical]:
        if raw.get(key) not in (None, ""):
            return raw[key]
    return None


def _stage_name(value) -> str | None:
    """Stages may arrive as a string or an object with a name/code."""
    if isinstance(value, dict):
        return value.get("name") or value.get("code")
    return value


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
    """Laravel-style page/per_page pagination: loop until a short page."""
    items: list[dict] = []
    page = 1
    while page <= MAX_PAGES:
        resp = session.get(path, params={**params, "page": page, "per_page": PER_PAGE})
        batch = resp.get("data") if isinstance(resp, dict) else resp
        if not batch:
            break
        items.extend(batch)
        if len(batch) < PER_PAGE:
            break
        page += 1
    return items


def _normalize_job(raw: dict, config: Config) -> dict:
    division_field = config.division_field
    if division_field.startswith("custom_field:"):
        wanted = division_field.split(":", 1)[1]
        division_raw = next(
            (
                cf.get("value")
                for cf in raw.get("custom_fields") or []
                if str(cf.get("id")) == wanted or cf.get("name") == wanted
            ),
            None,
        )
    else:
        division_raw = _stage_name(raw.get(division_field))

    history_raw = raw.get("stage_history") or raw.get("job_workflow_history") or []
    stage_history = [
        {
            "stage": _stage_name(h.get("stage") or h.get("stage_name")),
            "entered_at": h.get("created_at") or h.get("entered_at") or h.get("start_date"),
        }
        for h in history_raw
        if h
    ]
    stage_raw = _stage_name(_pick(raw, "stage"))
    stage_entered_at = _pick(raw, "stage_entered_at") or _pick(raw, "modified_at")
    if not stage_history and stage_raw:
        stage_history = [{"stage": stage_raw, "entered_at": stage_entered_at}]

    rep = raw.get("rep") or raw.get("sales_rep") or {}
    rep_id = rep.get("id") if isinstance(rep, dict) else None

    return {
        "type": "job",
        "id": str(raw.get("id")),
        "customer_id": str(raw.get("customer_id") or (raw.get("customer") or {}).get("id") or ""),
        "rep_leap_id": str(rep_id or _pick(raw, "rep_id") or ""),
        "division_raw": division_raw,
        "stage_raw": stage_raw,
        "stage_entered_at": stage_entered_at,
        "stage_history": stage_history,
        "source_raw": _stage_name(raw.get(config.source_field)) or "",
        "contract_amount": float(_pick(raw, "contract_amount") or 0),
        "invoiced_amount": float(_pick(raw, "invoiced_amount") or 0),
        "collected_amount": float(_pick(raw, "collected_amount") or 0),
        "cost_amount": float(_pick(raw, "cost_amount") or 0),
        "created_at": _pick(raw, "created_at"),
        "modified_at": _pick(raw, "modified_at"),
    }


def fetch_range(config: Config, start_date: date, end_date: date, transport=None) -> list[dict]:
    session = make_session(config, transport)
    raw_jobs = _get_pages(
        session,
        "/jobs",
        {
            # UNVERIFIED param names — confirm via discovery in Phase B.
            "updated_from": start_date.isoformat(),
            "updated_to": end_date.isoformat(),
        },
    )
    records = [_normalize_job(j, config) for j in raw_jobs]
    snapshot = _backlog_snapshot(records, config, end_date)
    if snapshot:
        records.append(snapshot)
    return records


def _backlog_snapshot(records: list[dict], config: Config, as_of: date) -> dict | None:
    """Point-in-time backlog from the fetched jobs' CURRENT stages.

    Best-effort: only jobs modified in the fetch window are visible, so this
    undercounts long-idle backlog. Phase B should replace it with a dedicated
    open-jobs query once discovery confirms a stage filter param.
    """
    backlog_jobs = 0
    backlog_value = 0.0
    in_production = 0
    for r in records:
        if r.get("type") != "job":
            continue
        stage = config.stage(r.get("stage_raw"))
        if stage is None or stage.cls != "sold" or stage.production == "completed":
            continue
        backlog_jobs += 1
        backlog_value += r.get("contract_amount") or 0
        if stage.production == "in_production":
            in_production += 1
    if backlog_jobs == 0:
        return None
    return {
        "type": "backlog_snapshot",
        "as_of": as_of.isoformat(),
        "backlog_jobs": backlog_jobs,
        "backlog_value": round(backlog_value, 2),
        "in_production_jobs": in_production,
        "basis": "jobs_modified_in_window",
    }


def bucket_week(record: dict) -> list[str]:
    """A job belongs to every week its stage history has an event in."""
    if record.get("type") != "job":
        ts = record.get("as_of")
        return [weeks.week_of_timestamp(ts)] if ts else []
    wids = {
        weeks.week_of_timestamp(h["entered_at"])
        for h in record.get("stage_history") or []
        if h.get("entered_at")
    }
    if not wids and record.get("modified_at"):
        wids = {weeks.week_of_timestamp(record["modified_at"])}
    return sorted(wids)


def fetch_users(config: Config, transport=None) -> list[dict]:
    session = make_session(config, transport)
    return _get_pages(session, "/users", {})
