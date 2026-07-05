"""GoHighLevel collector: contacts (leads) + opportunities.

API: https://services.leadconnectorhq.com with a Private Integration token.
Every call needs the `Version: 2021-07-28` header.

CAVEAT (verify in Phase B against a live account): the POST /contacts/search
filter body is under-documented in GHL's published OpenAPI spec. The shape
used here (filters: [{field, operator, value}] + searchAfter cursor) follows
GHL's marketplace docs prose; discovery prints the first response so mismatches
are caught before backfill.
"""
from __future__ import annotations

from datetime import date

from .. import weeks
from ..util.env import require_env
from ..util.http import ApiSession

BASE_URL = "https://services.leadconnectorhq.com"
PAGE_LIMIT = 100
MAX_PAGES = 5000


def make_session(transport=None) -> ApiSession:
    return ApiSession(
        BASE_URL,
        headers={
            "Authorization": f"Bearer {require_env('GHL_TOKEN')}",
            "Version": "2021-07-28",
            "Accept": "application/json",
        },
        min_interval_s=0.15,  # well under 100 req / 10 s
        transport=transport,
    )


def _location_id(config) -> str:
    loc = (config.settings.get("ghl") or {}).get("location_id") or ""
    if not loc:
        raise RuntimeError("ghl.location_id missing (set GHL_LOCATION_ID env var)")
    return loc


def _mmddyyyy(d: date) -> str:
    return d.strftime("%m-%d-%Y")


def fetch_range(config, start_date: date, end_date: date, transport=None) -> list[dict]:
    session = make_session(transport)
    ghl_settings = config.settings.get("ghl") or {}
    records = _fetch_contacts(session, config, start_date, end_date)
    if ghl_settings.get("hydrate_missing_source"):
        _hydrate_missing_sources(session, records, cap=int(ghl_settings.get("hydrate_cap", 200)))
    records += _fetch_opportunities(session, config, start_date, end_date)
    return records


def _fetch_contacts(session, config, start_date, end_date) -> list[dict]:
    location_id = _location_id(config)
    records: list[dict] = []
    search_after = None
    for _ in range(MAX_PAGES):
        body = {
            "locationId": location_id,
            "pageLimit": PAGE_LIMIT,
            "filters": [
                {
                    "field": "dateAdded",
                    "operator": "range",
                    "value": {
                        "gte": f"{start_date.isoformat()}T00:00:00-04:00",
                        "lte": f"{end_date.isoformat()}T23:59:59-04:00",
                    },
                }
            ],
            "sort": [{"field": "dateAdded", "direction": "asc"}],
        }
        if search_after:
            body["searchAfter"] = search_after
        resp = session.post("/contacts/search", json=body)
        contacts = resp.get("contacts") or []
        for c in contacts:
            records.append(
                {
                    "type": "contact",
                    "id": c.get("id"),
                    "date_added": c.get("dateAdded"),
                    "source_raw": c.get("source") or "",
                    "assigned_to": c.get("assignedTo"),
                }
            )
        if len(contacts) < PAGE_LIMIT:
            break
        search_after = contacts[-1].get("searchAfter")
        if not search_after:
            break
    return records


def _hydrate_missing_sources(session, records: list[dict], cap: int) -> None:
    """The search endpoint sometimes omits attribution; fetch full contacts
    for source-less leads (bounded by cap) and backfill source_raw."""
    hydrated = 0
    for r in records:
        if r["type"] != "contact" or r["source_raw"] or not r.get("id"):
            continue
        if hydrated >= cap:
            break
        full = session.get(f"/contacts/{r['id']}").get("contact") or {}
        attribution = full.get("attributionSource") or {}
        r["source_raw"] = (
            full.get("source")
            or attribution.get("utmSource")
            or attribution.get("medium")
            or ""
        )
        hydrated += 1


def _fetch_opportunities(session, config, start_date, end_date) -> list[dict]:
    location_id = _location_id(config)
    records: list[dict] = []
    page = 1
    while page <= MAX_PAGES:
        resp = session.get(
            "/opportunities/search",
            params={
                "location_id": location_id,
                "date": _mmddyyyy(start_date),
                "endDate": _mmddyyyy(end_date),
                "limit": PAGE_LIMIT,
                "page": page,
            },
        )
        opps = resp.get("opportunities") or []
        for o in opps:
            records.append(
                {
                    "type": "opportunity",
                    "id": o.get("id"),
                    "status": o.get("status"),
                    "pipeline_stage": o.get("pipelineStageId"),
                    "monetary_value": o.get("monetaryValue"),
                    "source_raw": o.get("source") or "",
                    "assigned_to": o.get("assignedTo"),
                    "created_at": o.get("createdAt"),
                    "status_changed_at": o.get("lastStatusChangeAt") or o.get("updatedAt"),
                }
            )
        if len(opps) < PAGE_LIMIT:
            break
        page += 1
    return records


def bucket_week(record: dict) -> str:
    ts = record.get("date_added") if record["type"] == "contact" else (
        record.get("status_changed_at") or record.get("created_at")
    )
    return weeks.week_of_timestamp(ts)


def fetch_pipelines(config, transport=None) -> dict:
    session = make_session(transport)
    return session.get("/opportunities/pipelines", params={"locationId": _location_id(config)})


def fetch_users(config, transport=None) -> dict:
    session = make_session(transport)
    return session.get("/users/", params={"locationId": _location_id(config)})
