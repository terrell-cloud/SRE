"""CompanyCam collector: photo activity -> inspection rows.

KPI definition (user's choice): a rep uploading photos to a project during the
week counts as ONE inspection of that job. So we pull photos in the date range
and pre-aggregate to distinct (creator, project, week) rows.

API: https://api.companycam.com/v2, Bearer personal access token.
GET /photos supports start_date/end_date (Unix seconds), page/per_page (~50 max).
"""
from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, time, timezone

from .. import weeks
from ..util.env import require_env
from ..util.http import ApiSession

BASE_URL = "https://api.companycam.com/v2"
PER_PAGE = 50
MAX_PAGES = 2000  # hard stop; 100k photos is far beyond a realistic range


def make_session(transport=None) -> ApiSession:
    return ApiSession(
        BASE_URL,
        headers={
            "Authorization": f"Bearer {require_env('COMPANYCAM_TOKEN')}",
            "Accept": "application/json",
        },
        min_interval_s=0.3,  # ~200 GET/min, under the ~240/min limit
        transport=transport,
    )


def _unix(d: date, end_of_day: bool = False) -> int:
    t = time(23, 59, 59) if end_of_day else time(0, 0)
    return int(datetime.combine(d, t, tzinfo=weeks.BUSINESS_TZ).timestamp())


def fetch_range(config, start_date: date, end_date: date, transport=None) -> list[dict]:
    session = make_session(transport)
    groups: dict[tuple, dict] = {}
    page = 1
    while page <= MAX_PAGES:
        photos = session.get(
            "/photos",
            params={
                "page": page,
                "per_page": PER_PAGE,
                "start_date": _unix(start_date),
                "end_date": _unix(end_date, end_of_day=True),
            },
        )
        if not photos:
            break
        for p in photos:
            captured = p.get("captured_at") or p.get("created_at")
            captured_iso = weeks.to_business(captured).isoformat() if captured else None
            wid = weeks.week_of_timestamp(captured) if captured else None
            key = (str(p.get("creator_id")), str(p.get("project_id")), wid)
            g = groups.setdefault(
                key,
                {
                    "creator_id": str(p.get("creator_id")),
                    "creator_name": p.get("creator_name"),
                    "project_id": str(p.get("project_id")),
                    "project_name": None,  # not on the photo object; not needed for the KPI
                    "photo_count": 0,
                    "first_capture": captured_iso,
                    "last_capture": captured_iso,
                },
            )
            g["photo_count"] += 1
            if captured_iso:
                if g["first_capture"] is None or captured_iso < g["first_capture"]:
                    g["first_capture"] = captured_iso
                if g["last_capture"] is None or captured_iso > g["last_capture"]:
                    g["last_capture"] = captured_iso
        if len(photos) < PER_PAGE:
            break
        page += 1
    return sorted(groups.values(), key=lambda g: (g["first_capture"] or "", g["project_id"]))


def bucket_week(record: dict) -> str:
    return weeks.week_of_timestamp(record["first_capture"])


def fetch_users(transport=None) -> list[dict]:
    """All CompanyCam users (for discovery / reps.yaml mapping)."""
    session = make_session(transport)
    users, page = [], 1
    while True:
        batch = session.get("/users", params={"page": page, "per_page": PER_PAGE})
        if not batch:
            break
        users.extend(batch)
        if len(batch) < PER_PAGE:
            break
        page += 1
    return users
