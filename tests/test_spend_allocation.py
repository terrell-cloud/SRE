import json
from pathlib import Path

from kpi import weeks
from kpi.spend import allocate_month_cents, allocate_week

GOLDEN = Path(__file__).parent / "golden"


def test_month_allocation_sums_exactly():
    for month, total in [("2026-06", 420057), ("2026-02", 999999), ("2026-07", 1)]:
        alloc = allocate_month_cents(total, month)
        assert sum(alloc.values()) == total, month
        assert all(v >= 0 for v in alloc.values())


def test_straddling_week_split_by_days():
    # 2026-W27 = Jun 29-Jul 5: 2 days of June (30d), 5 days of July (31d).
    june = allocate_month_cents(300000, "2026-06")  # $3000
    assert june["2026-W27"] == round(300000 * 2 / 30)
    july = allocate_month_cents(310000, "2026-07")
    assert july["2026-W27"] == round(310000 * 5 / 31)


def test_full_month_coverage():
    # Every week touching the month gets a slice.
    from datetime import date

    alloc = allocate_month_cents(100000, "2026-06")
    assert set(alloc) == set(weeks.weeks_between(date(2026, 6, 1), date(2026, 6, 30)))


def test_allocate_week_matches_golden(data_dir, config):
    doc = allocate_week("2026-W27", data_dir / "inputs" / "spend", config)
    golden = json.loads((GOLDEN / "spend-2026-W27.json").read_text())
    assert doc == golden
    # Paid channels got dollars; unpaid stayed zero; parent account -> other.
    assert doc["channels"]["google"] > 0
    assert doc["channels"]["facebook"] > 0
    assert doc["channels"]["door_knocking"] == 0
    assert doc["channels"]["other"] > 0  # parent "Advertising" remainder
    assert doc["months_used"] == ["2026-06", "2026-07"]


def test_missing_monthly_inputs_raise(tmp_path, config):
    import pytest

    (tmp_path / "monthly").mkdir(parents=True)
    with pytest.raises(FileNotFoundError):
        allocate_week("2026-W27", tmp_path, config)
