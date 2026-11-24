"""Extract raw cell values from official yearbook tables -> data/interim/cells.csv.

One output row = one source cell, with provenance (edition, table code, row/col,
data year, field, raw text, method). Column layouts were determined by inspecting
each edition's table header and are recorded explicitly in LAYOUT.
"""
import csv, pathlib, sys
import pandas as pd
from sources import T, BASE
from regions import REGIONS, NATIONAL
import ocr

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "data/raw/nbs_yearbook"
INTERIM = ROOT / "data/interim"; INTERIM.mkdir(parents=True, exist_ok=True)


def multi(ncols, first_year=None, national=True, cols=None):
    """Multi-year table: consecutive years; by default ending at edition-1."""
    return {"ncols": ncols, "national": national, "multi": True, "first_year": first_year, "cols": cols}


def single(ncols, national, fields):
    return {"ncols": ncols, "national": national, "fields": fields}


GDPCHK = {"chk_gdp_p1": 1, "chk_gdp_p2": 2, "chk_gdp_p3": 3}
EDS = [2016, 2017, 2018, 2019, 2020, 2022, 2023, 2024, 2025]
LAYOUT = {
 "pop":  {**{e: multi(12) for e in [2016, 2017, 2018, 2019, 2020]}, **{e: multi(10) for e in [2022, 2023, 2024, 2025]}},
 "urb":  {**{e: multi(9) for e in [2016, 2017, 2018, 2019, 2020]}, **{e: multi(10) for e in [2022, 2023, 2024, 2025]}},
 "inc":  {2016: multi(3), 2017: multi(4), 2018: multi(5), 2019: multi(6), 2020: multi(7),
          **{e: multi(7) for e in [2022, 2023, 2024, 2025]}},
 "cons": {2016: multi(3), 2017: multi(4), 2018: multi(5), 2019: multi(6), 2020: multi(7),
          **{e: multi(7) for e in [2022, 2023, 2024, 2025]}},
 "birth": {e: single(8, True, {"birth_rate": 5, "death_rate": 6, "natural_growth_rate": 7,
                                      "chk_pop": 0, "chk_urb": 2, "chk_rural_share": 4}) for e in EDS},
 "age":  {e: single(7, True, {"age_sample_total": 0, "age_65_plus": 3, "old_dependency": 6,
                                      "chk_age_0_14": 1, "chk_age_15_64": 2}) for e in EDS},
 "gdp":  {2016: single(20, False, {"gdp": 0, **GDPCHK}),
          2019: single(13, False, {"gdp": 0, "gdp_per_capita": 4, **GDPCHK}),
          **{e: single(22, False, {"gdp": 0, "gdp_per_capita": 13, **GDPCHK}) for e in [2017, 2018, 2020, 2022, 2023, 2024, 2025]}},
 # 2016 edition table 3-10: per-capita GRP 2011-2015 in first 5 of 10 columns
 "gdppc16": {2016: multi(10, first_year=2011, national=False, cols=5)},
 "stu":  {**{e: single(13, True, {"college_enrolment": 3}) for e in [2016, 2017, 2018, 2019, 2020]},
          **{e: single(16, True, {"college_enrolment": 4}) for e in [2022, 2023, 2024, 2025]}},
 "col":  {**{e: single(12, True, {"colleges": 0}) for e in [2016, 2017, 2018, 2019, 2020]},
          **{e: single(11, True, {"colleges": 0}) for e in [2022, 2023, 2024, 2025]}},
 "bed":  {e: single(9, True, {"bed_utilization": 3}) for e in EDS},
}
FIELD_OF = {"pop": "population", "urb": "urbanization", "inc": "disposable_income",
            "cons": "consumption_expenditure", "gdppc16": "gdp_per_capita"}

# 2021 edition machine-readable .xls: col 0 = region; years header row for multi-year
XLS = {
 "pop": dict(years_row=3), "urb": dict(years_row=3), "inc": dict(years_row=3), "cons": dict(years_row=3),
 "age": dict(fields={"age_sample_total": 1, "age_65_plus": 4, "old_dependency": 7, "chk_age_0_14": 2, "chk_age_15_64": 3}),
 "gdp": dict(fields={"gdp": 1, "gdp_per_capita": 14, "chk_gdp_p1": 2, "chk_gdp_p2": 3, "chk_gdp_p3": 4}),
 "stu": dict(fields={"college_enrolment": 4}),
 "col": dict(fields={"colleges": 1}),
 "bed": dict(fields={"bed_utilization": 4}),
}


def rec(key, ed, code, ext, r, c, reg, year, field, raw, method, iss=None, y=""):
    return {"table": key, "edition": ed, "code": code, "row": r, "col": c,
            "region_code": reg[0], "region": reg[1], "year": year, "field": field,
            "raw": raw, "method": method,
            "passA": (iss or {}).get("passA") or "", "passB": (iss or {}).get("passB") or "",
            "y": y, "x": (iss or {}).get("x", ""), "file": f"{ed}/{code}.{ext}",
            "url": BASE.format(ed=ed, code=code, ext=ext)}


def cells_from_image(key, ed, code, spec):
    path = RAW / str(ed) / f"{code}.jpg"
    nrows = 31 + (1 if spec["national"] else 0)
    grid, issues, ys, xs = ocr.grid(path, spec["ncols"], nrows)
    regs = ([NATIONAL] if spec["national"] else []) + REGIONS
    iss = {(i["row"], i["col"]): i for i in issues}
    out = []
    for r in range(nrows):
        if spec.get("multi"):
            n = spec["cols"] or spec["ncols"]
            fy = spec["first_year"] or (ed - n)
            todo = [(c, fy + c, FIELD_OF[key]) for c in range(n)]
        else:
            todo = [(c, ed - 1, f) for f, c in spec["fields"].items()]
        for c, year, field in todo:
            i = iss.get((r, c))
            if i: i = {**i, "x": xs[c]}
            out.append(rec(key, ed, code, "jpg", r, c, regs[r], year, field, grid[r][c] or "",
                           "ocr_disputed" if i else "ocr_consensus", i, ys[r]))
    return out


def cells_from_xls(key, code, fields=None, years_row=None):
    df = pd.read_excel(RAW / "2021" / f"{code}.xls", header=None, dtype=str)
    names = df[0].fillna("").str.replace(r"\s+", "", regex=True)
    lookup = {"全国": NATIONAL, "总计": NATIONAL, **{n: (c, n) for c, n in REGIONS}}
    out = []
    for idx, nm in names.items():
        if nm not in lookup: continue
        reg = lookup[nm]
        if fields is None:
            hdr = df.iloc[years_row]
            for c in range(1, df.shape[1]):
                try: yr = int(float(hdr[c]))
                except Exception: continue
                v = df.iloc[idx, c]
                out.append(rec(key, 2021, code, "xls", idx, c, reg, yr, FIELD_OF[key], "" if pd.isna(v) else str(v), "xls"))
        else:
            for f, c in fields.items():
                v = df.iloc[idx, c]
                out.append(rec(key, 2021, code, "xls", idx, c, reg, 2020, f, "" if pd.isna(v) else str(v), "xls"))
    return out


def main(only=None):
    out = INTERIM / "cells.csv"
    keep = []
    if only and out.exists():
        keep = [r for r in csv.DictReader(open(out, encoding="utf-8")) if r["table"] not in only]
    rows = []
    for key, eds in LAYOUT.items():
        if only and key not in only: continue
        for ed, spec in sorted(eds.items()):
            code = T[key][ed]
            try:
                rows += cells_from_image(key, ed, code, spec)
            except Exception as e:
                print("ERR", key, ed, code, e, flush=True)
        if key in XLS and 2021 in T.get(key, {}):
            rows += cells_from_xls(key, T[key][2021], XLS[key].get("fields"), XLS[key].get("years_row"))
    allrows = keep + rows
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(allrows)
    print("cells", len(allrows), "disputed", sum(r["method"] == "ocr_disputed" for r in allrows))


if __name__ == "__main__":
    main(set(sys.argv[1:]) or None)
