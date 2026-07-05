from kpi import email_summary


def _rendered(pipeline_run, config, tmp_path):
    root, _ = pipeline_run
    out = email_summary.render(root, config, tmp_path / "email.md")
    return out.read_text(encoding="utf-8")


def test_email_subject_is_first_line(pipeline_run, config, tmp_path):
    text = _rendered(pipeline_run, config, tmp_path)
    subject = text.splitlines()[0]
    assert subject.startswith("Weekly KPIs 2026-06-29 to 2026-07-05")
    assert "leads" in subject and "sold" in subject


def test_email_flags_stale_sections_first(pipeline_run, config, tmp_path):
    text = _rendered(pipeline_run, config, tmp_path)
    attention = text.index("## ⚠ Attention")
    headline = text.index("## Headline")
    assert attention < headline
    assert "inspections" in text[attention:headline]
    assert "2026-W26" in text[attention:headline]


def test_email_has_link_placeholder_and_key_numbers(pipeline_run, config, tmp_path):
    text = _rendered(pipeline_run, config, tmp_path)
    assert "{{DASHBOARD_URL}}" in text
    for needle in ["Closing % retail", "Closing % insurance", "Leads & cost by source",
                   "Inspections", "Production & pipeline", "CAC"]:
        assert needle in text, needle
