"""Render data/history.json -> dist/dashboard.html (one self-contained file).

Reads only the history file — never hits APIs. Layout, top to bottom:
header -> warnings -> headline tiles -> marketing (table + stacked columns) ->
closing % leaderboards (retail | insurance) -> inspections -> revenue &
production trends -> data-freshness footer.
"""
from __future__ import annotations

from datetime import date
from html import escape
from pathlib import Path

from ..config import Config
from ..util.io import read_json
from . import svg
from .template import page

CHANNEL_VARS = ["--c1", "--c2", "--c3", "--c4", "--c5", "--c6", "--c7", "--c8"]

SECTION_LABELS = {
    "marketing": "GoHighLevel (leads)",
    "sales": "Leap (sales)",
    "revenue_production": "Leap (production)",
    "inspections": "CompanyCam (inspections)",
    "spend": "QuickBooks (spend)",
}


def _nice_range(snap: dict) -> str:
    start = date.fromisoformat(snap["week_start"])
    end = date.fromisoformat(snap["week_end"])
    if start.month == end.month:
        return f"{start.strftime('%b %-d')} – {end.strftime('%-d, %Y')}"
    return f"{start.strftime('%b %-d')} – {end.strftime('%b %-d, %Y')}"


def _trend(history: dict, weeks_window: list[str], getter) -> list:
    out = []
    for wid in weeks_window:
        snap = history["snapshots"].get(wid)
        try:
            out.append(getter(snap) if snap else None)
        except (KeyError, TypeError):
            out.append(None)
    return out


def _stale_badge(snap: dict, section: str) -> str:
    meta = snap["sections"].get(section) or {}
    if meta.get("status") == "ok":
        return ""
    if meta.get("status") == "stale" and meta.get("as_of_week"):
        return f'<span class="stale-badge">STALE — showing {escape(meta["as_of_week"])}</span>'
    return '<span class="stale-badge">NO DATA</span>'


def _card_cls(snap: dict, *sections: str) -> str:
    ok = all((snap["sections"].get(s) or {}).get("status") == "ok" for s in sections)
    return "card" if ok else "card stale"


def build(data_dir: str | Path, config: Config, out_path: str | Path = "dist/dashboard.html") -> Path:
    history = read_json(Path(data_dir) / "history.json")
    if not history["weeks"]:
        raise ValueError("history.json has no weeks — run compute first")
    current = history["weeks"][-1]
    snap = history["snapshots"][current]
    prev = history["snapshots"].get(history["weeks"][-2]) if len(history["weeks"]) > 1 else None
    n_trend = int((config.settings.get("dashboard") or {}).get("trend_weeks", 12))
    window = history["weeks"][-n_trend:]
    small_n = int((config.settings.get("dashboard") or {}).get("small_sample_n", 4))
    k = snap["kpis"]
    pk = (prev or {}).get("kpis", {})

    body: list[str] = []
    title = (config.settings.get("dashboard") or {}).get("title", "Weekly KPIs")
    body.append(
        '<div class="kpi-header">'
        f"<h1>{escape(title)}</h1>"
        f'<span class="sub">Week of {_nice_range(snap)} ({escape(current)})</span>'
        f'<span class="gen">generated {escape(str(snap.get("generated_at", ""))[:16])}</span>'
        "</div>"
    )

    if snap.get("warnings"):
        items = "".join(f"<li>{escape(w)}</li>" for w in snap["warnings"])
        body.append(f'<div class="warnbar"><strong>Warnings</strong><ul>{items}</ul></div>')

    # ---------- headline tiles ----------
    def total_leads(s):
        return sum((s["kpis"].get("leads_by_source") or {}).values())

    def closing_overall(s):
        r = s["kpis"].get("closing_pct_retail") or {}
        i = s["kpis"].get("closing_pct_insurance") or {}
        sold = (r.get("overall") or {}).get("sold", 0) + (i.get("overall") or {}).get("sold", 0)
        lost = (r.get("overall") or {}).get("lost", 0) + (i.get("overall") or {}).get("lost", 0)
        return round(100 * sold / (sold + lost), 1) if sold + lost else None

    tiles = [
        ("Leads", svg.fmt_num(total_leads(snap)), total_leads(snap),
         total_leads(prev) if prev else None, "", False, total_leads),
        ("Revenue sold", svg.fmt_money((k.get("revenue_sold") or {}).get("total")),
         (k.get("revenue_sold") or {}).get("total"),
         (pk.get("revenue_sold") or {}).get("total"), "$", False,
         lambda s: (s["kpis"].get("revenue_sold") or {}).get("total")),
        ("Revenue collected", svg.fmt_money((k.get("revenue_collected") or {}).get("leap")),
         (k.get("revenue_collected") or {}).get("leap"),
         (pk.get("revenue_collected") or {}).get("leap"), "$", False,
         lambda s: (s["kpis"].get("revenue_collected") or {}).get("leap")),
        ("Closing % (blended)", svg.fmt_pct(closing_overall(snap)), closing_overall(snap),
         closing_overall(prev) if prev else None, "", True, closing_overall),
        ("Avg job size", svg.fmt_money(k.get("avg_job_size")), k.get("avg_job_size"),
         pk.get("avg_job_size"), "$", False, lambda s: s["kpis"].get("avg_job_size")),
        ("Gross margin", svg.fmt_pct((k.get("gross_margin") or {}).get("pct")),
         (k.get("gross_margin") or {}).get("pct"),
         (pk.get("gross_margin") or {}).get("pct"), "", True,
         lambda s: (s["kpis"].get("gross_margin") or {}).get("pct")),
    ]
    tile_html = []
    for label, value, cur, prv, unit, pct_points, getter in tiles:
        trend = _trend(history, window, getter)
        tile_html.append(
            '<div class="card tile">'
            f'<div class="label">{escape(label)}</div>'
            f'<div class="value">{value}</div>'
            f'<div class="row">{svg.delta_chip(cur, prv, unit, pct_points=pct_points)}'
            f"{svg.sparkline(trend, labels=window)}</div></div>"
        )
    body.append(f'<div class="grid tiles">{"".join(tile_html)}</div>')

    # ---------- marketing ----------
    channels = [c for c in config.channels]
    leads = k.get("leads_by_source") or {}
    prev_leads = pk.get("leads_by_source") or {}
    cpl = k.get("cost_per_lead") or {}
    cac = k.get("cac_by_source") or {}
    spend = k.get("spend_by_channel") or {}
    rows = []
    for i, c in enumerate(channels):
        var = CHANNEL_VARS[i % len(CHANNEL_VARS)]
        rows.append(
            "<tr>"
            f'<td><span class="swatch" style="background:var({var})"></span>{escape(c.label)}</td>'
            f'<td class="num">{svg.fmt_num(leads.get(c.key))}</td>'
            f'<td class="num">{svg.delta_chip(leads.get(c.key), prev_leads.get(c.key))}</td>'
            f'<td class="num">{svg.fmt_money(cpl.get(c.key), compact=False)}</td>'
            f'<td class="num">{svg.fmt_money(cac.get(c.key), compact=False)}</td>'
            f'<td class="num">{svg.fmt_money(spend.get(c.key), compact=False)}</td>'
            "</tr>"
        )
    series = [
        (c.label, CHANNEL_VARS[i % len(CHANNEL_VARS)],
         _trend(history, window, lambda s, key=c.key: (s["kpis"].get("leads_by_source") or {}).get(key)))
        for i, c in enumerate(channels)
    ]
    legend = "".join(
        f'<span><span class="swatch" style="background:var({v})"></span>{escape(l)}</span>'
        for l, v, _ in series
    )
    body.append(
        f'<div class="{_card_cls(snap, "marketing", "spend")}">'
        f'<h2>Marketing — leads, cost &amp; CAC by source{_stale_badge(snap, "marketing")}'
        f'{_stale_badge(snap, "spend")}</h2>'
        '<table class="kpi-table"><thead><tr><th>Channel</th><th class="num">Leads</th>'
        '<th class="num">WoW</th><th class="num">Cost / lead</th><th class="num">CAC</th>'
        '<th class="num">Spend</th></tr></thead>'
        f'<tbody>{"".join(rows)}</tbody></table>'
        '<div class="footnote">“—” = unpaid channel (no ad spend) or no data.</div>'
        f'<h2 style="margin-top:18px">Leads by source — last {len(window)} weeks</h2>'
        f"{svg.stacked_bars(window, series)}"
        f'<div class="legend">{legend}</div>'
        "</div>"
    )

    # ---------- closing % leaderboards ----------
    rep_names = {r.key: r.name for r in config.reps}
    rep_names["unmapped"] = "(unmapped)"

    def leaderboard(block: dict | None) -> str:
        if not block:
            return '<div class="hbar-note">No data.</div>'
        rows = []
        overall = block.get("overall") or {}
        by_rep = block.get("by_rep") or {}
        ranked = sorted(
            by_rep.items(), key=lambda kv: (kv[1]["pct"] is not None, kv[1]["pct"] or 0), reverse=True
        )
        for rep_key, rec in ranked:
            n = rec["sold"] + rec["lost"]
            name = rep_names.get(rep_key, rep_key)
            title = f"{name}: {rec['sold']} sold / {rec['lost']} lost"
            if n < small_n or rec["pct"] is None:
                rows.append(svg.hbar_row(name, f"{rec['sold']}–{rec['lost']}", 0, title, small=True))
            else:
                rows.append(svg.hbar_row(name, svg.fmt_pct(rec["pct"]), rec["pct"] / 100, title))
        rows.append(
            svg.hbar_row(
                "Overall",
                svg.fmt_pct(overall.get("pct")),
                (overall.get("pct") or 0) / 100,
                f"Overall: {overall.get('sold', 0)} sold / {overall.get('lost', 0)} lost",
                small=(overall.get("pct") is None),
            )
        )
        return "".join(rows) + (
            f'<div class="hbar-note">Reps with fewer than {small_n} decisions show '
            "sold–lost counts only.</div>"
        )

    body.append(
        '<div class="grid cols-2">'
        f'<div class="{_card_cls(snap, "sales")}"><h2>Closing % — retail{_stale_badge(snap, "sales")}</h2>'
        f'{leaderboard(k.get("closing_pct_retail"))}</div>'
        f'<div class="{_card_cls(snap, "sales")}"><h2>Closing % — insurance{_stale_badge(snap, "sales")}</h2>'
        f'{leaderboard(k.get("closing_pct_insurance"))}</div>'
        "</div>"
    )

    # ---------- inspections ----------
    insp = k.get("inspections_by_rep") or {}
    team_trend = _trend(
        history, window, lambda s: sum((s["kpis"].get("inspections_by_rep") or {}).values())
    )
    peak = max([v for v in insp.values()] or [1]) or 1
    insp_rows = "".join(
        svg.hbar_row(
            rep_names.get(rk, rk), svg.fmt_num(v), v / peak,
            f"{rep_names.get(rk, rk)}: {v} jobs with photo activity",
        )
        for rk, v in sorted(insp.items(), key=lambda kv: -kv[1])
    )
    body.append(
        f'<div class="{_card_cls(snap, "inspections")}">'
        f'<h2>Inspections — jobs with photo activity per rep{_stale_badge(snap, "inspections")}</h2>'
        f"{insp_rows}"
        f'<div class="trend-row"><span class="label">Team, last {len(window)} wks</span>'
        f'<span class="value">{svg.fmt_num(sum(insp.values()))}</span>{svg.sparkline(team_trend, labels=window)}</div>'
        "</div>"
    )

    # ---------- revenue & production trends ----------
    pipe = k.get("pipeline") or {}
    prod = k.get("production") or {}
    funnel = [
        ("Appointments set", pipe.get("appointments_set")),
        ("Appointments run", pipe.get("appointments_run")),
        ("Estimates given", pipe.get("estimates_given")),
        ("Contracts signed", pipe.get("contracts_signed")),
    ]
    fmax = max([v or 0 for _, v in funnel] or [1]) or 1
    funnel_rows = "".join(
        svg.hbar_row(label, svg.fmt_num(v), (v or 0) / fmax, f"{label}: {svg.fmt_num(v)}")
        for label, v in funnel
    )
    trend_specs = [
        ("Revenue sold", lambda s: (s["kpis"].get("revenue_sold") or {}).get("total"), svg.fmt_money),
        ("Revenue collected", lambda s: (s["kpis"].get("revenue_collected") or {}).get("leap"), svg.fmt_money),
        ("Avg job size", lambda s: s["kpis"].get("avg_job_size"), svg.fmt_money),
        ("Leads", total_leads, svg.fmt_num),
    ]
    trend_rows = "".join(
        f'<div class="trend-row"><span class="label">{escape(label)}</span>'
        f'<span class="value">{fmt(getter(snap))}</span>'
        f"{svg.sparkline(_trend(history, window, getter), labels=window)}</div>"
        for label, getter, fmt in trend_specs
    )
    prod_bits = (
        f"<strong>{svg.fmt_num(prod.get('started'))}</strong> started · "
        f"<strong>{svg.fmt_num(prod.get('in_production'))}</strong> in production · "
        f"<strong>{svg.fmt_num(prod.get('completed'))}</strong> completed · backlog "
        f"<strong>{svg.fmt_num(prod.get('backlog_jobs'))}</strong> jobs "
        f"(<strong>{svg.fmt_money(prod.get('backlog_value'))}</strong>)"
    )
    margin = k.get("gross_margin") or {}
    margin_note = (
        f'Gross margin basis: {escape(str(margin.get("basis") or "n/a"))}'
        + (f' ({margin.get("jobs_counted")} completed jobs with cost data)' if margin.get("jobs_counted") else "")
    )
    body.append(
        '<div class="grid cols-2">'
        f'<div class="{_card_cls(snap, "revenue_production")}">'
        f'<h2>Pipeline — this week{_stale_badge(snap, "revenue_production")}</h2>{funnel_rows}'
        f'<div class="footnote" style="margin-top:12px">{prod_bits}</div>'
        f'<div class="footnote">{margin_note}</div></div>'
        f'<div class="{_card_cls(snap, "revenue_production")}">'
        f"<h2>Trends — last {len(window)} weeks</h2>{trend_rows}</div>"
        "</div>"
    )

    # ---------- freshness footer ----------
    pills = []
    for section, label in SECTION_LABELS.items():
        meta = snap["sections"].get(section) or {}
        status = meta.get("status", "missing")
        detail = ""
        if status == "ok":
            detail = " · fresh"
        elif status == "stale":
            detail = f' · showing {meta.get("as_of_week")}'
        pills.append(f'<span class="pill {status}">{escape(label)}{escape(detail)}</span>')
    body.append(
        '<div class="card"><h2>Data freshness</h2>'
        f'<div class="pills">{"".join(pills)}</div>'
        '<div class="footnote">Backfilled weeks before go-live are best-effort: historical '
        "stage-transition timestamps and backlog snapshots may be incomplete.</div></div>"
    )

    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(page(title, "\n".join(body)), encoding="utf-8")
    return out_path
