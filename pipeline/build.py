"""Build the normalized dataset and the website data files.

Inputs : data/interim/selected.csv (validated cells), quality report, table titles
Outputs: data/processed/observations.csv|parquet, atlas.duckdb
         web/src/data/atlas.json        (build-time data for static pages)
         web/public/data/*.csv          (downloads; one per indicator + all)
         web/public/data/data_dictionary.csv, quality_report.json, sources.csv
"""
import csv, json, pathlib, datetime, collections
from regions import REGIONS, NATIONAL, EN, FULL, GEO7, NBS4
from indicators import INDICATORS, CATEGORIES, UNAVAILABLE, AGENCY, PUB

ROOT = pathlib.Path(__file__).resolve().parent.parent
SEL = ROOT / "data/interim/selected.csv"
PROC = ROOT / "data/processed"; PROC.mkdir(parents=True, exist_ok=True)
WEB = ROOT / "web"
TITLES = json.loads((ROOT / "data/raw/nbs_yearbook/table_titles.json").read_text())
FETCH = json.loads((ROOT / "data/raw/nbs_yearbook/fetch_log.json").read_text())
QUALITY = json.loads((PROC / "quality_report.json").read_text())


def method_label(m):
    if m == "xls": return "官方Excel文件直接读取"
    if "manual_review" in m: return "图像表格OCR后人工逐格核对"
    if m == "ocr_crossref": return "图像表格OCR，经其他版本年鉴交叉核验"
    return "图像表格双重OCR一致"


def obs_from(r, ind, value, extra_note=""):
    ed = int(r["edition"]); code = r["code"]
    title = TITLES.get(f"{ed}/{code}", "")
    status = ind.get("status", "正式")
    if r.get("revision_note"): status = "修订" if status == "正式" else status
    return {
        "indicator": ind["id"], "region_code": r["region_code"], "year": int(r["year"]), "value": value,
        "unit": ind["unit"], "status": status,
        "source_agency": AGENCY, "source_publication": f"中国统计年鉴{ed}",
        "source_table": title, "source_url": r["url"], "source_cell": r["cell_id"],
        "release_date": "", "release_note": f"{ed}年版年鉴（确切发布日期未取得）",
        "retrieved": FETCH.get(r["file"], {}).get("retrieved", ""),
        "method": method_label(r["method"]), "method_code": r["method"],
        "precision_from": r.get("precision_from", ""),
        "revision_note": (r.get("revision_note") or "") + extra_note,
    }


def main():
    rows = list(csv.DictReader(open(SEL, encoding="utf-8")))
    V = {(r["field"], r["region_code"], int(r["year"])): r for r in rows}
    obs = []
    for ind in INDICATORS:
        if ind["id"] == "aged-65-share":
            for (f, rc, y), r in V.items():
                if f != "age_65_plus": continue
                tot = V.get(("age_sample_total", rc, y))
                if not tot: continue
                val = round(float(r["value_text"]) / float(tot["value_text"]) * 100, 2)
                o = obs_from(r, ind, val)
                o["status"] = "派生"
                o["method"] = method_label(r["method"]) + "；本站按公式计算"
                o["formula_inputs"] = f'65岁及以上={r["value_text"]}; 人口数={tot["value_text"]}'
                obs.append(o)
            continue
        for (f, rc, y), r in V.items():
            if f != ind["field"]: continue
            if ind.get("no_national") and rc == NATIONAL[0]: continue
            v = float(r["value_text"])
            if r["method"] == "xls" or r.get("precision_from", "").endswith(".xls"):
                # Excel cells hold unrounded floats; round to the yearbook's printed precision
                v = round(v, 1 if f in ("disposable_income", "consumption_expenditure") else 2)
            obs.append(obs_from(r, ind, v))
    obs.sort(key=lambda o: (o["indicator"], o["region_code"], o["year"]))

    # ---- normalized outputs -------------------------------------------------
    cols = list(obs[0].keys()) + ["formula_inputs"]
    cols = list(dict.fromkeys(cols))
    with open(PROC / "observations.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore"); w.writeheader(); w.writerows(obs)
    try:
        import duckdb, pandas as pd
        df = pd.DataFrame(obs)
        df.to_parquet(PROC / "observations.parquet", index=False)
        db = PROC / "atlas.duckdb"
        if db.exists(): db.unlink()
        con = duckdb.connect(str(db))
        con.execute("CREATE TABLE observations AS SELECT * FROM df")
        con.execute("CREATE TABLE regions AS SELECT * FROM (VALUES " + ",".join(
            f"('{c}','{n}','{EN[c]}')" for c, n in [NATIONAL] + REGIONS) + ") t(code,name,name_en)")
        con.close()
    except Exception as e:
        print("duckdb/parquet skipped:", e)

    # ---- website data ---------------------------------------------------------
    today = datetime.date.today().isoformat()
    regions = [{"code": c, "name": n, "full": FULL.get(c, n), "en": EN[c]} for c, n in REGIONS]
    ind_out = []
    for ind in INDICATORS:
        o = [x for x in obs if x["indicator"] == ind["id"]]
        years = sorted({x["year"] for x in o})
        tables = sorted({(x["source_publication"], x["source_table"], x["source_url"]) for x in o})
        meta = {k: v for k, v in ind.items() if k not in ("tables",)}
        meta["missing_years"] = {str(k): v for k, v in ind.get("missing_years", {}).items()}
        meta["years"] = years
        meta["n_obs"] = len(o)
        meta["sources"] = [{"publication": a, "table": b, "url": c} for a, b, c in tables]
        meta["status"] = ind.get("status", "正式")
        meta["methods"] = dict(collections.Counter(x["method_code"].split("+")[0] if "manual" not in x["method_code"] else "manual_review" for x in o))
        ind_out.append(meta)
    compact = [[o["indicator"], o["region_code"], o["year"], o["value"], o["status"], o["source_cell"],
                o["method_code"], o["revision_note"]] for o in obs]
    atlas = {"generated": today, "regions": regions, "national": {"code": NATIONAL[0], "name": "全国"},
             "groups": {"geo7": GEO7, "nbs4": NBS4}, "categories": CATEGORIES, "indicators": ind_out,
             "unavailable": UNAVAILABLE,
             "obs_fields": ["indicator", "region", "year", "value", "status", "cell", "method", "revision"],
             "obs": compact,
             "quality": {"passed": QUALITY["passed"], "cells": QUALITY["cells"], "soft_counts": QUALITY["soft_counts"],
                         "hard_checks": ["数据类型与有限值", "地区代码（GB/T 2260）", "年份范围", "重复记录", "数值范围与单位",
                                         "出生率−死亡率=自然增长率", "三次产业增加值之和=地区生产总值", "年龄组之和=人口总数",
                                         "教育指标分省之和=全国", "人均GDP与GDP/人口一致性", "同版年鉴跨表人口与城镇化率一致",
                                         "65岁及以上占比与老年抚养比逻辑一致"]},
             "sources_files": [{"file": k, **v, "title": TITLES.get(k.rsplit(".", 1)[0], "")} for k, v in sorted(FETCH.items())]}
    (WEB / "src/data").mkdir(parents=True, exist_ok=True)
    (WEB / "src/data/atlas.json").write_text(json.dumps(atlas, ensure_ascii=False, separators=(",", ":")))

    pub = WEB / "public/data"; pub.mkdir(parents=True, exist_ok=True)
    name = {c: n for c, n in [NATIONAL] + REGIONS}
    csv_cols = ["indicator_id", "indicator_name", "indicator_name_en", "unit", "region_code", "region_name", "region_name_en",
                "year", "value", "status", "source_agency", "source_publication", "source_table", "source_url", "source_cell",
                "release_note", "retrieved", "method", "revision_note", "formula_inputs"]
    def write_csv(path, items):
        with open(path, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.writer(f); w.writerow(csv_cols)
            meta = {i["id"]: i for i in INDICATORS}
            for o in items:
                m = meta[o["indicator"]]
                w.writerow([o["indicator"], m["name"], m["name_en"], o["unit"], o["region_code"], name[o["region_code"]],
                            EN[o["region_code"]], o["year"], o["value"], o["status"], o["source_agency"], o["source_publication"],
                            o["source_table"], o["source_url"], o["source_cell"], o["release_note"], o["retrieved"],
                            o["method"], o["revision_note"], o.get("formula_inputs", "")])
    for ind in INDICATORS:
        write_csv(pub / f"{ind['id']}.csv", [o for o in obs if o["indicator"] == ind["id"]])
    write_csv(pub / "china-data-atlas-all.csv", obs)
    with open(pub / "data_dictionary.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f); w.writerow(["indicator_id", "name", "name_en", "category", "unit", "definition", "caliber", "formula", "years", "observations", "status"])
        for m in ind_out:
            w.writerow([m["id"], m["name"], m["name_en"], m["category"], m["unit"], m["definition"], m["caliber"], m.get("formula", ""),
                        f'{m["years"][0]}-{m["years"][-1]}' if m["years"] else "", m["n_obs"], m["status"]])
    (pub / "quality_report.json").write_text(json.dumps(QUALITY, ensure_ascii=False, indent=1))
    print("observations", len(obs))
    for m in ind_out:
        print(f'  {m["id"]:26s} {m["n_obs"]:5d}  {m["years"][0]}-{m["years"][-1]}  missing={[y for y in range(m["years"][0], m["years"][-1]+1) if y not in m["years"]]}')


if __name__ == "__main__":
    main()
