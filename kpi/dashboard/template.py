"""HTML skeleton + stylesheet for the dashboard.

Written as an Artifact-ready fragment: <title> + <style> + content, no
doctype/html/head/body (the Artifact host wraps it; browsers auto-wrap when the
file is opened directly). Zero external requests — CSP-safe by construction.

Color tokens follow the dataviz reference palette; dark mode is a selected
set of steps, keyed off both prefers-color-scheme and the Artifact viewer's
data-theme attribute.
"""
from __future__ import annotations

LIGHT = {
    "surface": "#fcfcfb",
    "page": "#f9f9f7",
    "ink": "#0b0b0b",
    "ink2": "#52514e",
    "muted": "#898781",
    "grid": "#e1e0d9",
    "axis": "#c3c2b7",
    "border": "rgba(11,11,11,0.10)",
    "accent": "#2a78d6",
    "spark": "#c3c2b7",
    "good": "#006300",
    "bad": "#d03b3b",
    "warnbg": "#fdf3d7",
    "warnink": "#6b4d00",
    "stalebg": "#fdf3d7",
    "c1": "#2a78d6",
    "c2": "#1baf7a",
    "c3": "#eda100",
    "c4": "#008300",
    "c5": "#4a3aa7",
    "c6": "#e34948",
    "c7": "#e87ba4",
    "c8": "#eb6834",
    "seq": "#256abf",
    "seqtrack": "#cde2fb",
}
DARK = {
    "surface": "#1a1a19",
    "page": "#0d0d0d",
    "ink": "#ffffff",
    "ink2": "#c3c2b7",
    "muted": "#898781",
    "grid": "#2c2c2a",
    "axis": "#383835",
    "border": "rgba(255,255,255,0.10)",
    "accent": "#3987e5",
    "spark": "#52514e",
    "good": "#0ca30c",
    "bad": "#e66767",
    "warnbg": "#3a3212",
    "warnink": "#fab219",
    "stalebg": "#3a3212",
    "c1": "#3987e5",
    "c2": "#199e70",
    "c3": "#c98500",
    "c4": "#008300",
    "c5": "#9085e9",
    "c6": "#e66767",
    "c7": "#d55181",
    "c8": "#d95926",
    "seq": "#3987e5",
    "seqtrack": "#184f95",
}


def _vars(tokens: dict) -> str:
    return "".join(f"--{k}:{v};" for k, v in tokens.items())


def stylesheet() -> str:
    return f"""<style>
.kpi-root{{{_vars(LIGHT)}
  background:var(--page);color:var(--ink);
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif;
  line-height:1.45;margin:0;padding:20px clamp(10px,3vw,36px) 48px;min-height:100vh;}}
@media (prefers-color-scheme: dark){{.kpi-root{{{_vars(DARK)}}}}}
:root[data-theme="dark"] .kpi-root{{{_vars(DARK)}}}
:root[data-theme="light"] .kpi-root{{{_vars(LIGHT)}}}

.kpi-root *{{box-sizing:border-box}}
.kpi-root h1{{font-size:20px;margin:0;font-weight:650}}
.kpi-root h2{{font-size:14px;font-weight:650;margin:0 0 10px;color:var(--ink)}}
.kpi-root .sub{{color:var(--ink2);font-size:13px;margin-top:2px}}
.kpi-header{{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 16px;margin-bottom:16px}}
.kpi-header .gen{{color:var(--muted);font-size:12px;margin-left:auto}}

.warnbar{{background:var(--warnbg);color:var(--warnink);border:1px solid var(--border);
  border-radius:8px;padding:8px 12px;font-size:13px;margin:0 0 16px}}
.warnbar ul{{margin:4px 0 0;padding-left:18px}}

.grid{{display:grid;gap:12px;margin-bottom:16px}}
.tiles{{grid-template-columns:repeat(auto-fit,minmax(168px,1fr))}}
.cols-2{{grid-template-columns:repeat(auto-fit,minmax(320px,1fr))}}

.card{{background:var(--surface);border:1px solid var(--border);border-radius:10px;
  padding:14px 16px;overflow-x:auto}}
.card.stale{{opacity:.92}}
.stale-badge{{display:inline-block;background:var(--stalebg);color:var(--warnink);
  font-size:11px;font-weight:600;border-radius:5px;padding:1px 7px;margin-left:8px;
  vertical-align:middle}}

.tile .label{{font-size:12px;color:var(--ink2)}}
.tile .value{{font-size:28px;font-weight:600;margin:2px 0 4px}}
.tile .row{{display:flex;align-items:center;gap:8px;flex-wrap:wrap}}
.chip{{font-size:12px;font-weight:600;border-radius:5px;padding:0 6px;white-space:nowrap}}
.chip-good{{color:var(--good)}}
.chip-bad{{color:var(--bad)}}
.chip-flat{{color:var(--muted)}}
.spark{{display:block}}

table.kpi-table{{border-collapse:collapse;width:100%;font-size:13px}}
.kpi-table th{{text-align:left;color:var(--muted);font-weight:500;font-size:12px;
  border-bottom:1px solid var(--grid);padding:4px 10px 6px 0}}
.kpi-table td{{padding:6px 10px 6px 0;border-bottom:1px solid var(--grid);
  font-variant-numeric:tabular-nums}}
.kpi-table tr:last-child td{{border-bottom:none}}
.kpi-table .num{{text-align:right}}
.kpi-table th.num{{text-align:right}}
.swatch{{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:7px;
  vertical-align:baseline}}

.legend{{display:flex;flex-wrap:wrap;gap:4px 16px;font-size:12px;color:var(--ink2);
  margin-top:8px}}
.legend span{{white-space:nowrap}}

.tick{{font-size:10px;fill:var(--muted)}}
.cap-label{{font-size:11px;font-weight:600;fill:var(--ink)}}
.seg rect{{transition:opacity .1s}}
.seg:hover rect{{opacity:.8}}

.hbar-row{{display:grid;grid-template-columns:minmax(112px,148px) 1fr 84px;align-items:center;
  gap:10px;padding:4px 0;font-size:13px}}
.hbar-label{{color:var(--ink2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}
.hbar-track{{background:var(--seqtrack);border-radius:4px;height:10px;position:relative}}
.hbar-track.hbar-none{{background:transparent}}
.hbar-fill{{background:var(--seq);border-radius:4px 4px 4px 4px;height:10px;min-width:2px}}
.hbar-value{{text-align:right;font-variant-numeric:tabular-nums;font-weight:600}}
.hbar-note{{font-size:11px;color:var(--muted);margin-top:6px}}

.trend-row{{display:flex;align-items:center;gap:14px;padding:6px 0;flex-wrap:wrap}}
.trend-row .label{{width:150px;font-size:13px;color:var(--ink2)}}
.trend-row .value{{width:90px;font-weight:600;font-variant-numeric:tabular-nums}}

.pills{{display:flex;flex-wrap:wrap;gap:8px;font-size:12px}}
.pill{{border:1px solid var(--border);border-radius:999px;padding:3px 10px;color:var(--ink2)}}
.pill.ok::before{{content:"● ";color:var(--good)}}
.pill.stale::before{{content:"● ";color:var(--warnink)}}
.pill.missing::before{{content:"● ";color:var(--bad)}}
.footnote{{color:var(--muted);font-size:12px;margin-top:10px}}
</style>"""


def page(title: str, body: str) -> str:
    return f"<title>{title}</title>\n{stylesheet()}\n<div class=\"kpi-root\">\n{body}\n</div>\n"
