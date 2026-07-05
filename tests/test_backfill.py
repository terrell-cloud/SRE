import json
from datetime import datetime, timezone

from kpi import backfill
from kpi.collectors import companycam

NOW = datetime(2026, 7, 6, 10, 30, tzinfo=timezone.utc)


def test_backfill_weeks_span():
    wids = backfill.backfill_weeks(12, NOW)
    assert wids[-1] == "2026-W27"
    assert 51 <= len(wids) <= 54


def _fake_records():
    return [
        {"creator_id": "67890", "creator_name": "John Smith", "project_id": "p1",
         "project_name": None, "photo_count": 5,
         "first_capture": "2026-06-30T10:00:00-04:00",
         "last_capture": "2026-06-30T10:30:00-04:00"},
        {"creator_id": "67901", "creator_name": "Maria Garcia", "project_id": "p2",
         "project_name": None, "photo_count": 8,
         "first_capture": "2026-05-12T09:00:00-04:00",
         "last_capture": "2026-05-12T09:40:00-04:00"},
    ]


def test_backfill_buckets_and_resumes(monkeypatch, tmp_path, config):
    calls = []

    def fake_fetch(cfg, start, end, transport=None):
        calls.append((start, end))
        return _fake_records()

    monkeypatch.setattr(companycam, "fetch_range", fake_fetch)
    results = backfill.run(3, tmp_path, config, sources=["companycam"], now_utc=NOW)
    assert "weekly files" in results["companycam"]
    w27 = json.loads((tmp_path / "sources/companycam/2026-W27.json").read_text())
    assert w27["status"] == "ok" and len(w27["records"]) == 1  # June 30 row
    w20 = json.loads((tmp_path / "sources/companycam/2026-W20.json").read_text())
    assert len(w20["records"]) == 1  # May 12 row
    # Weeks with no records still get an ok envelope (zero-activity week).
    w25 = json.loads((tmp_path / "sources/companycam/2026-W25.json").read_text())
    assert w25["status"] == "ok" and w25["records"] == []

    # Second run: everything already ok -> no re-fetch.
    results2 = backfill.run(3, tmp_path, config, sources=["companycam"], now_utc=NOW)
    assert "already collected" in results2["companycam"]
    assert len(calls) == 1


def test_backfill_failure_leaves_no_partial_files(monkeypatch, tmp_path, config):
    def boom(cfg, start, end, transport=None):
        raise RuntimeError("token expired")

    monkeypatch.setattr(companycam, "fetch_range", boom)
    results = backfill.run(3, tmp_path, config, sources=["companycam"], now_utc=NOW)
    assert results["companycam"].startswith("FAILED")
    assert not (tmp_path / "sources" / "companycam").exists()
