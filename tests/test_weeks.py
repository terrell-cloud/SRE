from datetime import date, datetime, timezone

from kpi import weeks


def test_week_id_and_bounds_roundtrip():
    wid = weeks.week_id(date(2026, 7, 1))  # Wednesday
    assert wid == "2026-W27"
    monday, sunday = weeks.week_bounds(wid)
    assert monday == date(2026, 6, 29)
    assert sunday == date(2026, 7, 5)


def test_week_id_year_boundary_iso():
    # Jan 1 2027 is a Friday; ISO week 53 of 2026.
    assert weeks.week_id(date(2027, 1, 1)) == "2026-W53"
    # Dec 29 2025 (Monday) starts ISO week 1 of 2026.
    assert weeks.week_id(date(2025, 12, 30)) == "2026-W01"


def test_last_complete_week_monday_morning_run():
    # Monday Jul 6 2026 6:30am ET == 10:30 UTC (EDT).
    now = datetime(2026, 7, 6, 10, 30, tzinfo=timezone.utc)
    assert weeks.last_complete_week(now) == "2026-W27"
    monday, sunday = weeks.week_bounds("2026-W27")
    assert (monday, sunday) == (date(2026, 6, 29), date(2026, 7, 5))


def test_last_complete_week_sunday_still_previous():
    # Sunday night ET: the current week is NOT complete yet.
    now = datetime(2026, 7, 6, 2, 0, tzinfo=timezone.utc)  # Sun Jul 5 10pm ET
    assert weeks.last_complete_week(now) == "2026-W26"


def test_dst_spring_forward_week():
    # US DST starts Sun 2026-03-08. Week Mon Mar 2 - Sun Mar 8.
    wid = weeks.week_id(date(2026, 3, 8))
    assert wid == "2026-W10"
    # A UTC timestamp late Sunday ET still buckets to the same week.
    ts = datetime(2026, 3, 9, 3, 30, tzinfo=timezone.utc)  # Sun Mar 8 11:30pm EDT
    assert weeks.week_of_timestamp(ts) == "2026-W10"


def test_dst_fall_back_week():
    # US DST ends Sun 2026-11-01. 11pm EST Sunday == 04:00 UTC Monday.
    ts = datetime(2026, 11, 2, 4, 0, tzinfo=timezone.utc)
    assert weeks.week_of_timestamp(ts) == "2026-W44"
    assert weeks.week_bounds("2026-W44")[1] == date(2026, 11, 1)


def test_weeks_between_and_last_n():
    ids = weeks.weeks_between(date(2026, 6, 15), date(2026, 7, 5))
    assert ids == ["2026-W25", "2026-W26", "2026-W27"]
    now = datetime(2026, 7, 6, 12, 0, tzinfo=timezone.utc)
    assert weeks.last_n_weeks(3, now) == ["2026-W25", "2026-W26", "2026-W27"]


def test_month_prorata_helpers():
    # Week 2026-W27 = Jun 29 - Jul 5: 2 days June, 5 days July.
    assert weeks.months_of_week("2026-W27") == ["2026-06", "2026-07"]
    assert weeks.days_of_week_in_month("2026-W27", "2026-06") == 2
    assert weeks.days_of_week_in_month("2026-W27", "2026-07") == 5
    assert weeks.days_in_month("2026-02") == 28
    assert weeks.days_in_month("2028-02") == 29
    # Fully-contained week.
    assert weeks.months_of_week("2026-W25") == ["2026-06"]
    assert weeks.days_of_week_in_month("2026-W25", "2026-06") == 7


def test_to_business_handles_unix_iso_naive():
    unix = weeks.to_business(1751818200)  # 2025-07-06T15:30:00Z
    assert unix.tzinfo is not None
    iso = weeks.to_business("2026-07-06T15:30:00Z")
    assert iso.hour == 11  # 15:30 UTC == 11:30 EDT
    naive = weeks.to_business("2026-07-06 08:00:00")
    assert naive.hour == 8  # naive treated as already-business-time
