import json
from pathlib import Path

from kpi import compute

GOLDEN = Path(__file__).parent / "golden"


def _golden(name):
    return json.loads((GOLDEN / "weekly" / f"{name}.json").read_text())


def test_snapshot_matches_golden_mid_history(pipeline_run):
    root, hist = pipeline_run
    assert hist["snapshots"]["2026-W20"] == _golden("2026-W20")


def test_latest_week_matches_golden_with_stale_inspections(pipeline_run):
    root, hist = pipeline_run
    snap = hist["snapshots"]["2026-W27"]
    assert snap == _golden("2026-W27")
    # The fixture simulates a CompanyCam outage in W27: section must be stale,
    # carrying W26 values, and the email-facing warning must say so.
    assert snap["sections"]["inspections"]["status"] == "stale"
    assert snap["sections"]["inspections"]["as_of_week"] == "2026-W26"
    assert snap["kpis"]["inspections_by_rep"] == hist["snapshots"]["2026-W26"]["kpis"]["inspections_by_rep"]
    assert any("inspections" in w and "2026-W26" in w for w in snap["warnings"])


def test_closing_pct_consistency(pipeline_run):
    _, hist = pipeline_run
    for snap in hist["snapshots"].values():
        for div in ("retail", "insurance"):
            block = snap["kpis"][f"closing_pct_{div}"]
            rep_sold = sum(r["sold"] for r in block["by_rep"].values())
            rep_lost = sum(r["lost"] for r in block["by_rep"].values())
            assert rep_sold == block["overall"]["sold"]
            assert rep_lost == block["overall"]["lost"]


def test_revenue_and_customers_tie_out(pipeline_run):
    _, hist = pipeline_run
    for snap in hist["snapshots"].values():
        kpis = snap["kpis"]
        # Contracts == total sold decisions == customers acquired.
        sold = (
            kpis["closing_pct_retail"]["overall"]["sold"]
            + kpis["closing_pct_insurance"]["overall"]["sold"]
        )
        assert kpis["revenue_sold"]["contracts"] == sold
        assert sum(kpis["customers_by_source"].values()) == sold
        assert kpis["pipeline"]["contracts_signed"] == sold
        if sold:
            assert kpis["avg_job_size"] == round(kpis["revenue_sold"]["total"] / sold, 2)


def test_unmapped_source_warns_not_drops(pipeline_run):
    _, hist = pipeline_run
    warned = [
        s for s in hist["snapshots"].values() if any("yardsign" in w for w in s["warnings"])
    ]
    assert warned, "fixture yardsign leads should produce unmapped-source warnings"
    for snap in warned:
        assert snap["kpis"]["leads_by_source"]["other"] >= 1


def test_missing_section_with_no_prior_is_null(tmp_path, config):
    # Only a GHL file for the very first week: leap/companycam/spend have no
    # prior snapshots to carry from -> sections missing, KPIs null.
    import shutil

    src = Path(__file__).parent / "fixtures" / "sources" / "ghl" / "2026-W14.json"
    dest = tmp_path / "sources" / "ghl" / "2026-W14.json"
    dest.parent.mkdir(parents=True)
    shutil.copy(src, dest)
    snap = compute.compute_week("2026-W14", tmp_path, config, generated_at="x")
    assert snap["sections"]["marketing"]["status"] == "ok"
    assert snap["sections"]["sales"]["status"] == "missing"
    assert snap["kpis"]["closing_pct_retail"] is None
    assert snap["kpis"]["leads_by_source"]  # fresh GHL data still computed


def test_idempotent_recompute(pipeline_run, config):
    root, hist = pipeline_run
    before = (root / "weekly" / "2026-W20.json").read_text()
    compute.compute_week("2026-W20", root, config, generated_at="2026-07-06T10:45:00-04:00")
    after = (root / "weekly" / "2026-W20.json").read_text()
    assert before == after
