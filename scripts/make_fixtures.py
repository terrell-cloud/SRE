"""Generate deterministic, realistic roofing-company fixture data.

Produces 14 weeks (2026-W14 .. 2026-W27) of normalized source files plus
monthly QuickBooks-style spend inputs, in the exact shapes the collectors
write. Frozen into tests/fixtures/ and used by golden tests and `kpi demo`.

Run from the repo root:  python scripts/make_fixtures.py
"""
from __future__ import annotations

import random
import sys
from datetime import datetime, time, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from kpi import weeks  # noqa: E402
from kpi.util.io import write_json  # noqa: E402

OUT = Path(__file__).resolve().parents[1] / "tests" / "fixtures"
WEEKS = [f"2026-W{n:02d}" for n in range(14, 28)]
MONTHS = ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07"]

REPS = [
    # (key, name, leap_id, companycam_id, ghl_id, skill: closing propensity)
    ("jsmith", "John Smith", "12345", "67890", "a1B2c3", 0.72),
    ("mgarcia", "Maria Garcia", "12399", "67901", "d4E5f6", 0.63),
    ("tlee", "Tom Lee", "12411", "67955", "g7H8i9", 0.55),
    ("bwill", "Bree Williams", "12480", "68011", "j1K2l3", 0.46),
]

# (channel, ghl source spellings, weekly lead base, contract propensity)
CHANNELS = [
    ("google", ["Google Ads", "GMB", "LSA"], 11, 0.30),
    ("facebook", ["Facebook", "FB Lead Ad", "Instagram"], 8, 0.22),
    ("door_knocking", ["Door Knock", "canvassing"], 6, 0.35),
    ("referral", ["Referral", "Customer Referral"], 4, 0.45),
]

STREETS = [
    "Maple Ave", "Oakwood Dr", "Cedar Ln", "Birchwood Ct", "Elm St",
    "Hickory Rd", "Willow Way", "Sycamore Blvd", "Chestnut St", "Poplar Dr",
]


def season_factor(week_index: int) -> float:
    """Lead volume ramps into storm season (Apr-Jun peak)."""
    return 0.7 + 0.6 * min(week_index, 9) / 9


def ts(day, hour, minute=0) -> str:
    return datetime.combine(day, time(hour, minute)).isoformat()


def main() -> None:
    rng = random.Random(20260704)
    fetched = "2026-07-06T10:35:00-04:00"

    job_seq = 4000
    contact_seq = 90000
    project_seq = 700
    open_backlog: list[dict] = []  # sold-not-completed jobs carried across weeks

    for wi, wid in enumerate(WEEKS):
        monday, sunday = weeks.week_bounds(wid)
        ghl_records: list[dict] = []
        leap_records: list[dict] = []
        cc_records: list[dict] = []

        # ---- GHL contacts (leads) ----
        week_leads: list[tuple[str, str]] = []  # (channel, source_raw)
        for channel, spellings, base, _ in CHANNELS:
            n = max(1, round(rng.gauss(base * season_factor(wi), base * 0.22)))
            for _ in range(n):
                week_leads.append((channel, rng.choice(spellings)))
        if rng.random() < 0.5:  # occasional unmapped source (config-drift demo)
            week_leads.append(("other", "yardsign"))
        for channel, source_raw in week_leads:
            contact_seq += 1
            day = monday + timedelta(days=rng.randrange(7))
            ghl_records.append(
                {
                    "type": "contact",
                    "id": f"ghl_c_{contact_seq}",
                    "date_added": ts(day, rng.randrange(8, 19), rng.randrange(60)),
                    "source_raw": source_raw,
                    "assigned_to": rng.choice(REPS)[4],
                }
            )

        # ---- Leap: appointments -> estimates -> decisions ----
        n_appts = max(3, round(len(week_leads) * rng.uniform(0.5, 0.65)))
        decisions_this_week = []
        for _ in range(n_appts):
            rep = rng.choice(REPS)
            channel, source_raw = rng.choice(week_leads)
            appt_day = monday + timedelta(days=rng.randrange(6))
            ran = rng.random() < 0.8
            job_seq += 1
            job_id = f"leap_j_{job_seq}"
            division = "Insurance" if rng.random() < 0.45 else rng.choice(["Retail", "Cash"])
            history = [
                {"stage": "Appointment Set", "entered_at": ts(appt_day, 9)},
            ]
            stage_now = "Appointment Set"
            if ran:
                history.append({"stage": "Appointment Run", "entered_at": ts(appt_day, 14)})
                stage_now = "Appointment Run"
                if rng.random() < 0.85:
                    est_day = min(appt_day + timedelta(days=rng.randrange(2)), sunday)
                    history.append({"stage": "Estimate Sent", "entered_at": ts(est_day, 16)})
                    stage_now = "Estimate Sent"
                    # Decision propensity: rep skill x channel quality, insurance closes higher.
                    close_p = rep[5] * (1.25 if division not in ("Retail", "Cash") else 1.0)
                    if rng.random() < 0.75:  # decision reached this same week
                        dec_day = min(est_day + timedelta(days=rng.randrange(1, 3)), sunday)
                        if rng.random() < close_p:
                            amount = round(rng.uniform(9000, 45000), 2)
                            history.append(
                                {"stage": "Contract Signed", "entered_at": ts(dec_day, 17)}
                            )
                            stage_now = "Contract Signed"
                            decisions_this_week.append((job_id, amount))
                            open_backlog.append(
                                {
                                    "job_id": job_id,
                                    "rep": rep,
                                    "division": division,
                                    "source_raw": source_raw,
                                    "amount": amount,
                                    "sold_week_index": wi,
                                    "weeks_to_complete": rng.randrange(2, 6),
                                    "started": False,
                                }
                            )
                        else:
                            history.append({"stage": "Lost", "entered_at": ts(dec_day, 17)})
                            stage_now = "Lost"
            amount_now = next((a for j, a in decisions_this_week if j == job_id), 0)
            leap_records.append(
                {
                    "type": "job",
                    "id": job_id,
                    "customer_id": f"leap_cust_{job_seq}",
                    "rep_leap_id": rep[2],
                    "division_raw": division,
                    "stage_raw": stage_now,
                    "stage_entered_at": history[-1]["entered_at"],
                    "stage_history": history,
                    "source_raw": source_raw,
                    "contract_amount": amount_now,
                    "invoiced_amount": 0,
                    "collected_amount": 0,
                    "cost_amount": 0,
                    "created_at": history[0]["entered_at"],
                    "modified_at": history[-1]["entered_at"],
                }
            )

        # ---- Production progression on the backlog ----
        for job in list(open_backlog):
            age = wi - job["sold_week_index"]
            if age <= 0:
                continue
            history = []
            if not job["started"] and age >= 1:
                job["started"] = True
                history.append({"stage": "Job Started", "entered_at": ts(monday + timedelta(days=1), 8)})
                history.append(
                    {"stage": "In Production", "entered_at": ts(monday + timedelta(days=1), 12)}
                )
                stage_now = "In Production"
            elif age >= job["weeks_to_complete"]:
                comp_day = monday + timedelta(days=rng.randrange(4))
                history.append({"stage": "Completed", "entered_at": ts(comp_day, 15)})
                stage_now = "Completed"
                open_backlog.remove(job)
            else:
                continue
            amount = job["amount"]
            completed = stage_now == "Completed"
            cost = round(amount * rng.uniform(0.58, 0.72), 2) if completed else 0
            leap_records.append(
                {
                    "type": "job",
                    "id": job["job_id"],
                    "customer_id": job["job_id"].replace("leap_j_", "leap_cust_"),
                    "rep_leap_id": job["rep"][2],
                    "division_raw": job["division"],
                    "stage_raw": stage_now,
                    "stage_entered_at": history[-1]["entered_at"],
                    "stage_history": history,
                    "source_raw": job["source_raw"],
                    "contract_amount": amount,
                    "invoiced_amount": round(amount * (1.0 if completed else 0.5), 2),
                    "collected_amount": round(amount * (0.95 if completed else 0.4), 2),
                    "cost_amount": cost,
                    "created_at": history[0]["entered_at"],
                    "modified_at": history[-1]["entered_at"],
                }
            )

        # Point-in-time backlog snapshot (collector queries open sold jobs).
        leap_records.append(
            {
                "type": "backlog_snapshot",
                "as_of": ts(sunday, 23, 59),
                "backlog_jobs": len(open_backlog),
                "backlog_value": round(sum(j["amount"] for j in open_backlog), 2),
                "in_production_jobs": sum(1 for j in open_backlog if j["started"]),
            }
        )

        # ---- CompanyCam photo activity (inspections) ----
        for rep in REPS:
            n_inspections = max(0, round(rng.gauss(7 * season_factor(wi), 2)))
            for _ in range(n_inspections):
                project_seq += 1
                day = monday + timedelta(days=rng.randrange(6))
                first = datetime.combine(day, time(rng.randrange(8, 16), rng.randrange(60)))
                cc_records.append(
                    {
                        "creator_id": rep[3],
                        "creator_name": rep[1],
                        "project_id": f"cc_p_{project_seq}",
                        "project_name": f"{rng.randrange(100, 9999)} {rng.choice(STREETS)}",
                        "photo_count": rng.randrange(6, 40),
                        "first_capture": first.isoformat(),
                        "last_capture": (first + timedelta(minutes=rng.randrange(20, 90))).isoformat(),
                    }
                )
        if rng.random() < 0.15:  # occasional photos from an unmapped office user
            project_seq += 1
            cc_records.append(
                {
                    "creator_id": "99999",
                    "creator_name": "Office Admin",
                    "project_id": f"cc_p_{project_seq}",
                    "project_name": "Office upload",
                    "photo_count": 3,
                    "first_capture": ts(monday, 10),
                    "last_capture": ts(monday, 10, 30),
                }
            )

        # ---- write the three weekly source files ----
        common = {"week": wid, "week_start": monday.isoformat(), "week_end": sunday.isoformat(),
                  "fetched_at": fetched, "error": None, "status": "ok"}
        write_json(OUT / "sources" / "ghl" / f"{wid}.json",
                   {**common, "source": "ghl", "records": ghl_records})
        write_json(OUT / "sources" / "leap" / f"{wid}.json",
                   {**common, "source": "leap", "records": leap_records})
        if wid == WEEKS[-1]:
            # Simulate a CompanyCam outage in the newest week to exercise the
            # stale-section carry-forward path end to end.
            write_json(
                OUT / "sources" / "companycam" / f"{wid}.json",
                {**common, "source": "companycam", "status": "error",
                 "error": "HTTP 503 from api.companycam.com after 5 attempts", "records": []},
            )
        else:
            write_json(OUT / "sources" / "companycam" / f"{wid}.json",
                       {**common, "source": "companycam", "records": cc_records})

    # ---- monthly QuickBooks spend inputs ----
    for month in MONTHS:
        mi = MONTHS.index(month)
        google = round(3600 * (0.8 + 0.15 * mi) + rng.uniform(-150, 150), 2)
        facebook = round(2400 * (0.8 + 0.12 * mi) + rng.uniform(-120, 120), 2)
        parent_misc = round(rng.uniform(350, 700), 2)
        revenue = round(rng.uniform(380000, 560000) * (0.8 + 0.1 * mi), 2)
        cogs = round(revenue * rng.uniform(0.62, 0.68), 2)
        write_json(
            OUT / "inputs" / "spend" / "monthly" / f"{month}.json",
            {
                "month": month,
                "source": "quickbooks_mcp",
                "fetched_at": fetched,
                "accounts": {
                    "Advertising:Google": google,
                    "Advertising:Facebook": facebook,
                    "Advertising": parent_misc,
                },
                "pnl": {
                    "revenue": revenue,
                    "cogs": cogs,
                    "gross_profit": round(revenue - cogs, 2),
                },
            },
        )

    print(f"fixtures written under {OUT} for {len(WEEKS)} weeks + {len(MONTHS)} months")


if __name__ == "__main__":
    main()
