"""All week/time math for the KPI pipeline.

Single source of truth: weeks are Mon-Sun in the business timezone
(America/New_York). A week is identified by the ISO week of its Monday,
formatted "YYYY-Www" (e.g. 2026-W27). No other module may touch zoneinfo.
"""
from __future__ import annotations

import re
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

BUSINESS_TZ = ZoneInfo("America/New_York")

_WEEK_ID_RE = re.compile(r"^(\d{4})-W(\d{2})$")


def monday_of(d: date) -> date:
    return d - timedelta(days=d.weekday())


def week_id(d: date) -> str:
    """Week ID for the week containing date d."""
    iso = monday_of(d).isocalendar()
    return f"{iso.year}-W{iso.week:02d}"


def week_bounds(wid: str) -> tuple[date, date]:
    """(monday, sunday) dates for a week ID."""
    m = _WEEK_ID_RE.match(wid)
    if not m:
        raise ValueError(f"bad week id: {wid!r}")
    year, week = int(m.group(1)), int(m.group(2))
    monday = date.fromisocalendar(year, week, 1)
    return monday, monday + timedelta(days=6)


def now_business(now_utc: datetime | None = None) -> datetime:
    if now_utc is None:
        now_utc = datetime.now(timezone.utc)
    elif now_utc.tzinfo is None:
        raise ValueError("now_utc must be timezone-aware")
    return now_utc.astimezone(BUSINESS_TZ)


def last_complete_week(now_utc: datetime | None = None) -> str:
    """The most recent Mon-Sun week that has fully ended in business time.

    Run on Monday morning, this is the week that ended yesterday (Sunday).
    """
    today = now_business(now_utc).date()
    return week_id(monday_of(today) - timedelta(days=7))


def weeks_between(start: date, end: date) -> list[str]:
    """Week IDs for every week touching [start, end], oldest first."""
    if start > end:
        raise ValueError("start after end")
    out = []
    cur = monday_of(start)
    while cur <= end:
        out.append(week_id(cur))
        cur += timedelta(days=7)
    return out


def last_n_weeks(n: int, now_utc: datetime | None = None) -> list[str]:
    """The n most recent complete weeks, oldest first."""
    last = last_complete_week(now_utc)
    monday, _ = week_bounds(last)
    return [week_id(monday - timedelta(days=7 * i)) for i in range(n - 1, -1, -1)]


def days_of_week_in_month(wid: str, month: str) -> int:
    """How many days of week `wid` fall inside month "YYYY-MM" (for pro-rata)."""
    monday, sunday = week_bounds(wid)
    y, m = int(month[:4]), int(month[5:7])
    return sum(
        1
        for i in range(7)
        if (d := monday + timedelta(days=i)).year == y and d.month == m
    )


def months_of_week(wid: str) -> list[str]:
    """The month(s) "YYYY-MM" that week `wid` touches (1 or 2)."""
    monday, sunday = week_bounds(wid)
    months = [f"{monday.year}-{monday.month:02d}"]
    end_month = f"{sunday.year}-{sunday.month:02d}"
    if end_month != months[0]:
        months.append(end_month)
    return months


def days_in_month(month: str) -> int:
    y, m = int(month[:4]), int(month[5:7])
    first_next = date(y + 1, 1, 1) if m == 12 else date(y, m + 1, 1)
    return (first_next - date(y, m, 1)).days


def to_business(ts: int | float | str | datetime) -> datetime:
    """Convert a Unix timestamp, ISO-8601 string, or datetime to business time.

    Naive ISO strings are assumed to already be in business time (Leap-style
    local timestamps); numeric timestamps are Unix epoch seconds (UTC).
    """
    if isinstance(ts, (int, float)):
        dt = datetime.fromtimestamp(ts, tz=timezone.utc)
    elif isinstance(ts, str):
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            return dt.replace(tzinfo=BUSINESS_TZ)
    elif isinstance(ts, datetime):
        dt = ts
        if dt.tzinfo is None:
            return dt.replace(tzinfo=BUSINESS_TZ)
    else:
        raise TypeError(f"cannot convert {type(ts)} to datetime")
    return dt.astimezone(BUSINESS_TZ)


def week_of_timestamp(ts: int | float | str | datetime) -> str:
    return week_id(to_business(ts).date())
