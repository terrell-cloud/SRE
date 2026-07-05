"""Collector tests against API-shaped fixtures via an injected fake transport.

These prove pagination, normalization, aggregation, error-envelope writing,
and 429 handling — the API response *shapes* themselves remain unverified
until Phase B discovery runs against live accounts.
"""
import json
from datetime import date

import pytest

from kpi.collectors import collect_week, companycam, ghl, leap
from kpi.util.http import ApiSession, CollectorError


class FakeResponse:
    def __init__(self, payload, status_code=200, headers=None):
        self._payload = payload
        self.status_code = status_code
        self.headers = headers or {}
        self.text = json.dumps(payload)

    def json(self):
        return self._payload


class FakeTransport:
    """Records requests; pops responses from a queue or serves via handler."""

    def __init__(self, responses=None, handler=None):
        self.responses = list(responses or [])
        self.handler = handler
        self.requests = []

    def __call__(self, method, url, **kwargs):
        self.requests.append({"method": method, "url": url, **kwargs})
        if self.handler:
            return self.handler(method, url, kwargs)
        return self.responses.pop(0)


@pytest.fixture(autouse=True)
def _tokens(monkeypatch):
    monkeypatch.setenv("COMPANYCAM_TOKEN", "cc-test")
    monkeypatch.setenv("GHL_TOKEN", "ghl-test")
    monkeypatch.setenv("LEAP_TOKEN", "leap-test")


def _no_sleep_session(base, transport):
    return ApiSession(base, headers={}, min_interval_s=0, transport=transport, sleep=lambda s: None)


# ---------------- http layer ----------------

def test_429_honors_retry_after_then_succeeds():
    sleeps = []
    transport = FakeTransport(
        [FakeResponse({}, 429, {"Retry-After": "3"}), FakeResponse({"ok": True})]
    )
    s = ApiSession("https://x", transport=transport, min_interval_s=0, sleep=sleeps.append)
    assert s.get("/y") == {"ok": True}
    assert 3.0 in sleeps


def test_5xx_retries_then_raises():
    transport = FakeTransport([FakeResponse({}, 503)] * 5)
    s = ApiSession("https://x", transport=transport, min_interval_s=0, sleep=lambda s: None)
    with pytest.raises(CollectorError, match="HTTP 503"):
        s.get("/y")
    assert len(transport.requests) == 5


def test_4xx_fails_fast():
    transport = FakeTransport([FakeResponse({"msg": "bad token"}, 401)])
    s = ApiSession("https://x", transport=transport, min_interval_s=0, sleep=lambda s: None)
    with pytest.raises(CollectorError, match="401"):
        s.get("/y")
    assert len(transport.requests) == 1


# ---------------- companycam ----------------

def _cc_photo(creator, project, captured_at):
    return {
        "id": "ph1",
        "creator_id": creator,
        "creator_name": f"User {creator}",
        "project_id": project,
        "captured_at": captured_at,
    }


def test_companycam_aggregates_rep_project_pairs(monkeypatch, config):
    # Tue Jun 30 2026 ~noon ET.
    t0 = 1782489600
    page1 = [_cc_photo("67890", "p1", t0), _cc_photo("67890", "p1", t0 + 600),
             _cc_photo("67901", "p2", t0 + 3600)]
    transport = FakeTransport([FakeResponse(page1)])
    monkeypatch.setattr(
        companycam, "make_session",
        lambda tr=None: _no_sleep_session(companycam.BASE_URL, transport),
    )
    records = companycam.fetch_range(config, date(2026, 6, 29), date(2026, 7, 5))
    assert len(records) == 2  # two distinct (rep, project) pairs
    smith = next(r for r in records if r["creator_id"] == "67890")
    assert smith["photo_count"] == 2
    params = transport.requests[0]["params"]
    assert {"page", "per_page", "start_date", "end_date"} <= set(params)


def test_companycam_paginates_until_short_page(monkeypatch, config):
    t0 = 1782489600
    full = [_cc_photo(str(i), f"p{i}", t0 + i) for i in range(50)]
    transport = FakeTransport([FakeResponse(full), FakeResponse(full[:3])])
    monkeypatch.setattr(
        companycam, "make_session",
        lambda tr=None: _no_sleep_session(companycam.BASE_URL, transport),
    )
    companycam.fetch_range(config, date(2026, 6, 29), date(2026, 7, 5))
    assert [r["params"]["page"] for r in transport.requests] == [1, 2]


# ---------------- ghl ----------------

def test_ghl_contacts_cursor_and_hydration(monkeypatch, config):
    def handler(method, url, kwargs):
        if url.endswith("/contacts/search"):
            body = kwargs["json"]
            assert body["locationId"] == "loc_TEST123"
            if "searchAfter" not in body:
                contacts = [
                    {"id": f"c{i}", "dateAdded": "2026-06-30T10:00:00Z",
                     "source": "FB Lead Ad" if i else "",  # c0 needs hydration
                     "assignedTo": "a1B2c3", "searchAfter": [1, f"c{i}"]}
                    for i in range(100)
                ]
                return FakeResponse({"contacts": contacts, "total": 101})
            return FakeResponse({"contacts": [
                {"id": "c100", "dateAdded": "2026-07-01T10:00:00Z", "source": "Google Ads"}
            ]})
        if "/contacts/c0" in url:
            return FakeResponse({"contact": {"id": "c0", "source": "",
                                             "attributionSource": {"utmSource": "yardsign"}}})
        if "/opportunities/search" in url:
            return FakeResponse({"opportunities": []})
        raise AssertionError(f"unexpected url {url}")

    transport = FakeTransport(handler=handler)
    monkeypatch.setattr(
        ghl, "make_session", lambda tr=None: _no_sleep_session(ghl.BASE_URL, transport)
    )
    records = ghl.fetch_range(config, date(2026, 6, 29), date(2026, 7, 5))
    contacts = [r for r in records if r["type"] == "contact"]
    assert len(contacts) == 101
    assert next(c for c in contacts if c["id"] == "c0")["source_raw"] == "yardsign"


def test_ghl_version_header_present(config):
    transport = FakeTransport([
        FakeResponse({"contacts": []}), FakeResponse({"opportunities": []}),
    ])
    session = ghl.make_session(transport)
    session.min_interval_s = 0
    session._sleep = lambda s: None
    session.get("/contacts/search")
    assert transport.requests[0]["headers"]["Version"] == "2021-07-28"
    assert transport.requests[0]["headers"]["Authorization"] == "Bearer ghl-test"


# ---------------- leap ----------------

LEAP_RAW_JOB = {
    "id": 88101,
    "customer": {"id": 5501},
    "rep": {"id": 12345, "first_name": "John"},
    "current_stage": {"name": "Contract Signed", "code": "cs"},
    "stage_changed_date": "2026-06-30 14:00:00",
    "job_type": "Insurance Restoration",
    "referred_by": "Facebook",
    "amount": "18500.00",
    "total_cost": None,
    "created_at": "2026-06-12 09:00:00",
    "updated_at": "2026-06-30 14:00:00",
    "job_workflow_history": [
        {"stage": {"name": "Estimate Sent"}, "created_at": "2026-06-24 10:00:00"},
        {"stage": {"name": "Contract Signed"}, "created_at": "2026-06-30 14:00:00"},
    ],
}


def test_leap_normalizer_maps_fields(monkeypatch, config):
    transport = FakeTransport([FakeResponse({"data": [LEAP_RAW_JOB]})])
    monkeypatch.setattr(
        leap, "make_session",
        lambda cfg, tr=None: _no_sleep_session("https://api.jobprogress.com/api/v3", transport),
    )
    records = leap.fetch_range(config, date(2026, 6, 29), date(2026, 7, 5))
    job = records[0]
    assert job["type"] == "job"
    assert job["rep_leap_id"] == "12345"
    assert job["division_raw"] == "Insurance Restoration"
    assert job["stage_raw"] == "Contract Signed"
    assert job["source_raw"] == "Facebook"
    assert job["contract_amount"] == 18500.0
    assert [h["stage"] for h in job["stage_history"]] == ["Estimate Sent", "Contract Signed"]
    # Sold-not-completed job -> backlog snapshot record present.
    assert records[-1]["type"] == "backlog_snapshot"
    assert records[-1]["backlog_jobs"] == 1


def test_leap_bucket_week_spans_history():
    record = {
        "type": "job",
        "stage_history": [
            {"stage": "Estimate Sent", "entered_at": "2026-06-24 10:00:00"},
            {"stage": "Contract Signed", "entered_at": "2026-06-30 14:00:00"},
        ],
    }
    assert leap.bucket_week(record) == ["2026-W26", "2026-W27"]


# ---------------- envelope / registry ----------------

def test_collect_week_failure_writes_error_envelope(monkeypatch, tmp_path, config):
    def boom(cfg, start, end, transport=None):
        raise CollectorError("GET /photos failed after 5 attempts: HTTP 503")

    monkeypatch.setattr(companycam, "fetch_range", boom)
    doc = collect_week("companycam", "2026-W27", tmp_path, config)
    assert doc["status"] == "error"
    assert "503" in doc["error"]
    assert doc["records"] == []
    on_disk = json.loads((tmp_path / "sources/companycam/2026-W27.json").read_text())
    assert on_disk["status"] == "error"
