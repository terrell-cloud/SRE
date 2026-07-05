"""Render the Monday email body (markdown) from the latest snapshot.

Output file: first line = subject, blank line, then the body. The agent sends
it via Gmail MCP after substituting {{DASHBOARD_URL}} with the artifact link
(see RUNBOOK.md). The agent must not rewrite the numbers.
"""
from __future__ import annotations

from pathlib import Path

from .config import Config
from .dashboard.svg import fmt_money, fmt_num, fmt_pct
from .util.io import read_json


def _arrow(cur, prv) -> str:
    if cur is None or prv is None or cur == prv:
        return ""
    return " ↑" if cur > prv else " ↓"


def render(data_dir: str | Path, config: Config, out_path: str | Path = "dist/email.md") -> Path:
    history = read_json(Path(data_dir) / "history.json")
    current = history["weeks"][-1]
    snap = history["snapshots"][current]
    prev = history["snapshots"].get(history["weeks"][-2]) if len(history["weeks"]) > 1 else None
    k, pk = snap["kpis"], (prev or {}).get("kpis", {})

    leads = sum((k.get("leads_by_source") or {}).values())
    prev_leads = sum((pk.get("leads_by_source") or {}).values()) if pk else None
    revenue = (k.get("revenue_sold") or {}).get("total")
    prev_revenue = (pk.get("revenue_sold") or {}).get("total")
    contracts = (k.get("revenue_sold") or {}).get("contracts")

    def overall(div):
        block = k.get(f"closing_pct_{div}") or {}
        o = block.get("overall") or {}
        return o.get("pct"), o.get("sold", 0), o.get("lost", 0)

    retail_pct, retail_sold, retail_lost = overall("retail")
    ins_pct, ins_sold, ins_lost = overall("insurance")

    subject = (
        f"Weekly KPIs {snap['week_start']} to {snap['week_end']}: "
        f"{fmt_num(leads)} leads, {fmt_money(revenue)} sold, {fmt_num(contracts)} contracts"
    )

    lines = [subject, ""]
    lines.append(f"# {config.settings.get('company', 'Weekly KPIs')} — week {current}")
    lines.append("")
    lines.append("**Dashboard:** {{DASHBOARD_URL}}")
    lines.append("")

    stale = {name: meta for name, meta in snap["sections"].items() if meta.get("status") != "ok"}
    if stale or snap.get("warnings"):
        lines.append("## ⚠ Attention")
        for name, meta in stale.items():
            lines.append(
                f"- **{name}** data is {meta.get('status')}"
                + (f" (showing week {meta['as_of_week']})" if meta.get("as_of_week") else "")
                + (f" — {meta.get('error')}" if meta.get("error") else "")
            )
        for w in snap.get("warnings", []):
            if "is stale" not in w:  # staleness already listed above
                lines.append(f"- {w}")
        lines.append("")

    lines.append("## Headline")
    lines.append(f"- Leads: **{fmt_num(leads)}**{_arrow(leads, prev_leads)}"
                 + (f" (prev {fmt_num(prev_leads)})" if prev_leads is not None else ""))
    lines.append(
        f"- Revenue sold: **{fmt_money(revenue)}** across {fmt_num(contracts)} contracts"
        f"{_arrow(revenue, prev_revenue)}"
        + (f" (prev {fmt_money(prev_revenue)})" if prev_revenue is not None else "")
    )
    lines.append(f"- Closing % retail: **{fmt_pct(retail_pct)}** ({retail_sold} sold / {retail_lost} lost)")
    lines.append(f"- Closing % insurance: **{fmt_pct(ins_pct)}** ({ins_sold} sold / {ins_lost} lost)")
    lines.append(f"- Avg job size: **{fmt_money(k.get('avg_job_size'))}**")
    margin = k.get("gross_margin") or {}
    lines.append(f"- Gross margin: **{fmt_pct(margin.get('pct'))}** (basis: {margin.get('basis') or 'n/a'})")
    lines.append("")

    lines.append("## Leads & cost by source")
    cpl = k.get("cost_per_lead") or {}
    cac = k.get("cac_by_source") or {}
    for c in config.channels:
        n = (k.get("leads_by_source") or {}).get(c.key)
        if not n and c.key == "other":
            continue
        cost_bits = ""
        if c.qb_account:
            cost_bits = f" · cost/lead {fmt_money(cpl.get(c.key), compact=False)} · CAC {fmt_money(cac.get(c.key), compact=False)}"
        lines.append(f"- {c.label}: **{fmt_num(n)}** leads{cost_bits}")
    lines.append("")

    lines.append("## Inspections (jobs with photo activity)")
    rep_names = {r.key: r.name for r in config.reps}
    insp = k.get("inspections_by_rep") or {}
    for rk, v in sorted(insp.items(), key=lambda kv: -kv[1]):
        lines.append(f"- {rep_names.get(rk, rk)}: **{fmt_num(v)}**")
    lines.append("")

    prod = k.get("production") or {}
    pipe = k.get("pipeline") or {}
    lines.append("## Production & pipeline")
    lines.append(
        f"- Appts set {fmt_num(pipe.get('appointments_set'))} → run "
        f"{fmt_num(pipe.get('appointments_run'))} → estimates "
        f"{fmt_num(pipe.get('estimates_given'))} → contracts {fmt_num(pipe.get('contracts_signed'))}"
    )
    lines.append(
        f"- Started {fmt_num(prod.get('started'))} · in production "
        f"{fmt_num(prod.get('in_production'))} · completed {fmt_num(prod.get('completed'))} · "
        f"backlog {fmt_num(prod.get('backlog_jobs'))} jobs ({fmt_money(prod.get('backlog_value'))})"
    )

    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return out_path
