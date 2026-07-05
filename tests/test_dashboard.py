import re

from kpi.dashboard import build as dash_build


def _built(pipeline_run, config, tmp_path):
    root, _ = pipeline_run
    out = dash_build.build(root, config, tmp_path / "dashboard.html")
    return out.read_text(encoding="utf-8")


def test_dashboard_is_self_contained(pipeline_run, config, tmp_path):
    html = _built(pipeline_run, config, tmp_path)
    # Artifact CSP: zero external requests of any kind.
    for attr in ("src=", "href=", "url("):
        for m in re.finditer(re.escape(attr), html):
            snippet = html[m.start(): m.start() + 60]
            assert "http://" not in snippet and "https://" not in snippet, snippet
    assert "<script" not in html.lower()  # fully readable with JS disabled
    assert len(html.encode()) < 1_500_000


def test_dashboard_has_all_sections(pipeline_run, config, tmp_path):
    html = _built(pipeline_run, config, tmp_path)
    for needle in [
        "<title>SRE Weekly KPIs</title>",
        "Leads",  # tiles
        "Revenue sold",
        "Gross margin",
        "Marketing — leads, cost &amp; CAC by source",
        "Leads by source",
        "Closing % — retail",
        "Closing % — insurance",
        "Inspections — jobs with photo activity per rep",
        "Pipeline — this week",
        "Trends — last",
        "Data freshness",
        "John Smith",  # rep names resolve
    ]:
        assert needle in html, f"missing section: {needle}"


def test_dashboard_dark_mode_tokens(pipeline_run, config, tmp_path):
    html = _built(pipeline_run, config, tmp_path)
    assert "@media (prefers-color-scheme: dark)" in html
    assert ':root[data-theme="dark"] .kpi-root' in html
    assert ':root[data-theme="light"] .kpi-root' in html


def test_dashboard_shows_staleness(pipeline_run, config, tmp_path):
    html = _built(pipeline_run, config, tmp_path)
    # Fixture W27 has a CompanyCam outage -> stale badge + amber pill.
    assert "STALE — showing 2026-W26" in html
    assert 'class="pill stale"' in html
    assert "Warnings" in html


def test_dashboard_escapes_untrusted_strings(pipeline_run, config, tmp_path):
    # Rep/channel/warning strings are external data; ensure escaping happens.
    root, hist = pipeline_run
    snap = hist["snapshots"]["2026-W27"]
    snap["warnings"].append('<img src=x onerror=alert(1)>')
    from kpi.util.io import write_json

    write_json(root / "weekly" / "2026-W27.json", snap)
    from kpi import history

    history.rebuild(root)
    html = dash_build.build(root, config, tmp_path / "d2.html").read_text()
    assert "<img src=x" not in html
    assert "&lt;img src=x" in html
