"""Hand-rolled inline SVG chart primitives (no external libs, CSP-safe).

Specs follow the dataviz method: 2px lines, bars <= 24px thick with 4px rounded
data-ends (square at the baseline), 2px surface gaps between touching marks,
recessive hairline axes, text in ink tokens (never the series color). Colors
are referenced as CSS custom properties so light/dark swap in the stylesheet.
Native SVG <title> elements provide the hover readout without JS.
"""
from __future__ import annotations

from html import escape


def fmt_money(v, compact=True) -> str:
    if v is None:
        return "—"
    if compact and abs(v) >= 1_000_000:
        return f"${v / 1_000_000:.1f}M"
    if compact and abs(v) >= 10_000:
        return f"${v / 1_000:.1f}K"
    return f"${v:,.0f}"


def fmt_num(v) -> str:
    return "—" if v is None else f"{v:,.0f}" if abs(v) >= 1000 else f"{v:g}"


def fmt_pct(v) -> str:
    return "—" if v is None else f"{v:.1f}%".replace(".0%", "%")


def delta_chip(current, previous, unit="", up_is_good=True, pct_points=False) -> str:
    """WoW delta chip. Returns muted em-dash chip when either side is missing."""
    if current is None or previous is None:
        return '<span class="chip chip-flat">—</span>'
    diff = current - previous
    if pct_points:
        text = f"{abs(diff):.1f}pt"
    elif unit == "$":
        text = fmt_money(abs(diff))
    elif previous:
        text = f"{abs(diff) / previous * 100:.0f}%"
    else:
        text = fmt_num(abs(diff))
    if abs(diff) < 1e-9:
        return '<span class="chip chip-flat">±0</span>'
    good = (diff > 0) == up_is_good
    arrow = "▲" if diff > 0 else "▼"
    cls = "chip-good" if good else "chip-bad"
    return f'<span class="chip {cls}">{arrow} {escape(text)}</span>'


def sparkline(values: list, width=120, height=32, labels: list[str] | None = None) -> str:
    """12-point sparkline: de-emphasis gray line, accent dot on current period."""
    pts = [(i, v) for i, v in enumerate(values) if v is not None]
    if len(pts) < 2:
        return f'<svg class="spark" width="{width}" height="{height}" role="img"></svg>'
    vals = [v for _, v in pts]
    lo, hi = min(vals), max(vals)
    span = (hi - lo) or 1
    pad = 4
    n = len(values) - 1

    def xy(i, v):
        x = pad + (width - 2 * pad) * (i / n if n else 0.5)
        y = height - pad - (height - 2 * pad) * ((v - lo) / span)
        return f"{x:.1f}", f"{y:.1f}"

    path = " ".join(
        ("M" if k == 0 else "L") + " " + " ".join(xy(i, v)) for k, (i, v) in enumerate(pts)
    )
    ex, ey = xy(*pts[-1])
    title = ""
    if labels:
        title = "<title>" + escape(
            ", ".join(f"{l}: {fmt_num(v)}" for l, (_, v) in zip(labels[-len(pts):], pts))
        ) + "</title>"
    return (
        f'<svg class="spark" width="{width}" height="{height}" viewBox="0 0 {width} {height}" '
        f'role="img">{title}'
        f'<path d="{path}" fill="none" stroke="var(--spark)" stroke-width="2" '
        f'stroke-linecap="round" stroke-linejoin="round"/>'
        f'<circle cx="{ex}" cy="{ey}" r="4" fill="var(--accent)" '
        f'stroke="var(--surface)" stroke-width="2"/>'
        f"</svg>"
    )


def stacked_bars(
    week_labels: list[str],
    series: list[tuple[str, str, list[float]]],  # (label, css_var, values-per-week)
    width=720,
    height=180,
) -> str:
    """Weekly stacked columns with 2px surface gaps between segments."""
    n = len(week_labels)
    if not n:
        return ""
    totals = [sum(s[2][i] or 0 for s in series) for i in range(n)]
    peak = max(totals) or 1
    pad_l, pad_b, pad_t = 4, 18, 14
    plot_h = height - pad_b - pad_t
    band = (width - pad_l) / n
    bar_w = min(24.0, band * 0.55)
    parts = [
        f'<svg class="chart" width="100%" viewBox="0 0 {width} {height}" role="img" '
        f'preserveAspectRatio="xMidYMid meet">'
    ]
    baseline_y = height - pad_b
    parts.append(
        f'<line x1="0" y1="{baseline_y}" x2="{width}" y2="{baseline_y}" '
        f'stroke="var(--axis)" stroke-width="1"/>'
    )
    for i, wl in enumerate(week_labels):
        x = pad_l + band * i + (band - bar_w) / 2
        y = baseline_y
        for label, var, values in series:
            v = values[i] or 0
            if v <= 0:
                continue
            h = plot_h * v / peak
            gap = 2 if y != baseline_y else 0  # 2px surface gap between segments
            y_top = y - h
            parts.append(
                f'<g class="seg"><title>{escape(wl)} — {escape(label)}: {fmt_num(v)} '
                f"(week total {fmt_num(totals[i])})</title>"
                f'<rect x="{x:.1f}" y="{y_top:.1f}" width="{bar_w:.1f}" height="{max(h - gap, 1):.1f}" '
                f'fill="var({var})"/></g>'
            )
            y = y_top
        # round only the very top data-end: overlay a rounded cap on the last segment
        if totals[i] > 0:
            parts.append(
                f'<rect x="{x:.1f}" y="{(baseline_y - plot_h * totals[i] / peak):.1f}" '
                f'width="{bar_w:.1f}" height="4" rx="2" fill="var({series_top_var(series, i)})"/>'
            )
        # sparse x labels: first, last, and every 4th
        if i == 0 or i == n - 1 or i % 4 == 0:
            parts.append(
                f'<text x="{x + bar_w / 2:.1f}" y="{height - 4}" class="tick" '
                f'text-anchor="middle">{escape(wl)}</text>'
            )
        if i == n - 1:  # direct-label the current week's total at the cap
            parts.append(
                f'<text x="{x + bar_w / 2:.1f}" y="{(baseline_y - plot_h * totals[i] / peak) - 5:.1f}" '
                f'class="cap-label" text-anchor="middle">{fmt_num(totals[i])}</text>'
            )
    parts.append("</svg>")
    return "".join(parts)


def series_top_var(series, i) -> str:
    """CSS var of the topmost non-zero segment for week i (for the rounded cap)."""
    for label, var, values in reversed(series):
        if (values[i] or 0) > 0:
            return var
    return "--axis"


def hbar_row(label: str, value_text: str, frac: float, title: str, small=False) -> str:
    """One leaderboard row: label | bar | value. frac in [0,1]."""
    pct = max(0.0, min(1.0, frac)) * 100
    bar = (
        f'<div class="hbar-track"><div class="hbar-fill" style="width:{pct:.1f}%"></div></div>'
        if not small
        else '<div class="hbar-track hbar-none"></div>'
    )
    return (
        f'<div class="hbar-row" title="{escape(title)}">'
        f'<span class="hbar-label">{escape(label)}</span>{bar}'
        f'<span class="hbar-value">{escape(value_text)}</span></div>'
    )
