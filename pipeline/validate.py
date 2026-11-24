"""Data Quality Gate on selected cells (data/interim/selected.csv).

Hard checks (fail the gate): types, region codes, years, duplicates, ranges, decimal
format, identities (birth - death = natural growth), additivity where the indicator is
additive AND the national row is defined as the provincial total (college enrolment,
number of colleges), per-capita GDP consistent with GDP / population.
Soft checks (reported): year-on-year jumps, single-reading cells, revisions.
Writes data/processed/quality_report.json. Exit code 1 if any hard check fails.
"""
import csv, json, pathlib, collections, sys, math
from regions import REGIONS, NATIONAL

ROOT = pathlib.Path(__file__).resolve().parent.parent
SEL = ROOT / "data/interim/selected.csv"
OUT = ROOT / "data/processed/quality_report.json"
CODES = {c for c, _ in REGIONS} | {NATIONAL[0]}

RANGE = {"population": (250, 14_500), "urbanization": (15, 95), "birth_rate": (2, 20), "death_rate": (3, 10),
         "natural_growth_rate": (-8, 14), "age_sample_total": (500, 1.5e9), "age_65_plus": (50, 2.5e8),
         "old_dependency": (5, 45), "gdp": (500, 150_000), "gdp_per_capita": (10_000, 250_000),
         "disposable_income": (5_000, 100_000), "consumption_expenditure": (4_000, 60_000),
         "college_enrolment": (20_000, 40_000_000), "colleges": (4, 3_200), "bed_utilization": (40, 110)}
JUMP = {"population": 0.06, "urbanization": 0.08, "gdp": 0.25, "gdp_per_capita": 0.25, "disposable_income": 0.2,
        "consumption_expenditure": 0.25, "college_enrolment": 0.25, "colleges": 0.15, "bed_utilization": 0.25,
        "birth_rate": 0.3}


def load():
    rows = list(csv.DictReader(open(SEL, encoding="utf-8")))
    V = {}
    for r in rows:
        V[(r["field"], r["region_code"], int(r["year"]))] = r
    return rows, V


def main():
    rows, V = load()
    hard, soft = collections.defaultdict(list), collections.defaultdict(list)
    f = lambda k: float(V[k]["value_text"])

    keys = collections.Counter((r["field"], r["region_code"], r["year"]) for r in rows)
    for k, n in keys.items():
        if n > 1: hard["duplicate"].append(str(k))
    for r in rows:
        k = (r["field"], r["region_code"], int(r["year"]))
        if r["region_code"] not in CODES: hard["region_code"].append(r["cell_id"])
        if not (2000 <= int(r["year"]) <= 2025): hard["year"].append(r["cell_id"])
        try: v = float(r["value_text"])
        except Exception: hard["numeric"].append(r["cell_id"]); continue
        if not math.isfinite(v): hard["numeric"].append(r["cell_id"])
        if r["field"].startswith("chk_"): continue
        lo, hi = RANGE[r["field"]]
        if r["region_code"] == "100000" and r["field"] == "population": lo, hi = 120_000, 145_000
        if not (lo <= v <= hi): hard["range"].append(f'{r["cell_id"]} {r["field"]} {r["region"]} {r["year"]}={v}')

    # identity: birth - death = natural growth (published to 2 dp, allow 0.025)
    for (fld, rc, y), r in V.items():
        if fld != "birth_rate": continue
        d, n = ("death_rate", rc, y), ("natural_growth_rate", rc, y)
        if d in V and n in V:
            diff = f((fld, rc, y)) - f(d) - f(n)
            if abs(diff) > 0.025:
                hard["identity_birth_death_growth"].append(f"{r['region']} {y}: {f((fld,rc,y))}-{f(d)}!={f(n)} [{r['cell_id']}]")

    # additivity (national row = sum of provinces in education tables)
    for fld in ("college_enrolment", "colleges"):
        years = {y for (ff, rc, y) in V if ff == fld}
        for y in sorted(years):
            nat = ("%s" % fld, "100000", y)
            parts = [(fld, c, y) for c, _ in REGIONS]
            if nat in V and all(p in V for p in parts):
                s = sum(f(p) for p in parts)
                if abs(s - f(nat)) > 0.5:
                    hard["additivity_" + fld].append(f"{y}: sum={s:.0f} national={f(nat):.0f}")

    # 65+ <= sample total
    for (fld, rc, y), r in V.items():
        if fld == "age_65_plus" and ("age_sample_total", rc, y) in V:
            share = f((fld, rc, y)) / f(("age_sample_total", rc, y)) * 100
            if not (3 <= share <= 30): hard["age_share_range"].append(f"{r['region']} {y} share={share:.2f}")
        # old-age dependency consistent with share? (dependency = 65+/15-64; share < dependency)
            if ("old_dependency", rc, y) in V and share >= f(("old_dependency", rc, y)):
                hard["age_share_vs_dependency"].append(f"{r['region']} {y} share={share:.2f} dep={f(('old_dependency', rc, y))}")

    # per-capita GDP ~ GDP / population (per-capita uses average population)
    for (fld, rc, y), r in V.items():
        if fld != "gdp_per_capita": continue
        g, p = ("gdp", rc, y), ("population", rc, y)
        if g in V and p in V:
            ratio = f((fld, rc, y)) / (f(g) * 1e8 / (f(p) * 1e4))
            lo, hi = (0.93, 1.07) if y >= 2020 else (0.85, 1.15)  # 2011-2019 population revised after 2020 census
            if not (lo <= ratio <= hi):
                hard["gdp_per_capita_consistency"].append(f"{r['region']} {y}: ratio={ratio:.3f} [{r['cell_id']}]")

    # GDP = primary + secondary + tertiary (published rounding)
    for (fld, rc, y), r in V.items():
        if fld != "gdp": continue
        parts = [("chk_gdp_p%d" % i, rc, y) for i in (1, 2, 3)]
        if all(p in V for p in parts):
            d = f((fld, rc, y)) - sum(f(p) for p in parts)
            if abs(d) > 0.35:
                hard["identity_gdp_components"].append(f"{r['region']} {y}: gdp={f((fld,rc,y))} sum={sum(f(p) for p in parts):.2f} [{r['cell_id']}]")
        else:
            soft["gdp_components_unverified"].append(f"{r['region']} {y}")
    # age groups sum to sample total
    for (fld, rc, y), r in V.items():
        if fld != "age_sample_total": continue
        parts = [("chk_age_0_14", rc, y), ("chk_age_15_64", rc, y), ("age_65_plus", rc, y)]
        if all(p in V for p in parts):
            d = f((fld, rc, y)) - sum(f(p) for p in parts)
            if abs(d) > 3:  # NBS sample counts are weighted; published groups can differ by 1-2
                hard["identity_age_groups"].append(f"{r['region']} {y}: total={f((fld,rc,y))} sum={sum(f(p) for p in parts):.0f} [{r['cell_id']}]")
        else:
            soft["age_groups_unverified"].append(f"{r['region']} {y}")
    # same-edition cross-table readings: birth-table population/urban share vs pop/urb tables
    import csv as _csv
    allc = list(_csv.DictReader(open(ROOT / "data/interim/cells_resolved.csv", encoding="utf-8")))
    ed_read = {}
    for c in allc:
        if c["status"] in ("accepted", "reviewed") and c["value_text"]:
            ed_read[(c["field"], c["region_code"], int(c["year"]), int(c["edition"]))] = c
    for (fld, rc, y, ed), c in ed_read.items():
        if fld in ("chk_pop", "chk_urb"):
            tgt = {"chk_pop": "population", "chk_urb": "urbanization"}[fld]
            o = ed_read.get((tgt, rc, y, ed))
            if o and abs(float(o["value_text"]) - float(c["value_text"])) > (0.5 if fld == "chk_pop" else 0.005):
                hard["cross_table_" + tgt].append(f"{c['region']} {y} ed{ed}: {tgt}={o['value_text']} [{o['cell_id']}] vs birth-table={c['value_text']} [{c['cell_id']}]")
        if fld == "chk_urb":
            rs_ = ed_read.get(("chk_rural_share", rc, y, ed))
            if rs_ and abs(float(c["value_text"]) + float(rs_["value_text"]) - 100) > 0.015:
                soft["urban_rural_share_sum"].append(f"{c['region']} {y} ed{ed}: {c['value_text']}+{rs_['value_text']}")

    # soft: year-on-year jumps
    for (fld, rc, y), r in V.items():
        if fld in JUMP and (fld, rc, y - 1) in V:
            a, b = f((fld, rc, y - 1)), f((fld, rc, y))
            if a and abs(b / a - 1) > JUMP[fld]:
                soft["yoy_jump"].append(f"{fld} {r['region']} {y-1}->{y}: {a} -> {b} [{r['cell_id']}]")
    for r in rows:
        if r["method"].startswith("ocr") and r.get("n_agree") in ("0", "") and "manual" not in r["method"]:
            soft["single_reading_ocr"].append(r["cell_id"])
        if r.get("revision_note"):
            soft["revised_vs_earlier_edition"].append(f'{r["field"]} {r["region"]} {r["year"]}')

    report = {"cells": len(rows),
              "hard_failures": {k: v for k, v in hard.items()},
              "soft_counts": {k: len(v) for k, v in soft.items()},
              "soft_samples": {k: v[:60] for k, v in soft.items()},
              "methods": collections.Counter(r["method"] for r in rows),
              "passed": not any(hard.values())}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=1))
    for k, v in hard.items():
        print("HARD", k, len(v)); [print("   ", x) for x in v[:40]]
    for k, v in soft.items():
        print("soft", k, len(v))
    print("PASSED" if report["passed"] else "FAILED")
    return report["passed"]


if __name__ == "__main__":
    sys.exit(0 if main() else 1)
