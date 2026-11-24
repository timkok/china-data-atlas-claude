"""Resolve disputed OCR cells and flag suspicious consensus cells.

Resolution order for a disputed cell (passA != passB):
  1. Manual review file data/manual/ocr_review.csv (value read by a reviewer from the image).
  2. Cross-reference: exactly one of the two OCR readings equals an independent reading
     of the same (field, region, year) from another edition or the machine-readable
     2021 .xls -> accepted, method=ocr_crossref.
  3. Otherwise -> left in review queue (data/interim/review_queue.csv) and NOT published.

Consensus cells that disagree with an independent reading of the same year by more than
rounding are also queued (could be a shared OCR error or a genuine NBS revision; the
reviewer decides and notes which).
"""
import csv, pathlib, collections
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
INTERIM = ROOT / "data/interim"
MANUAL = ROOT / "data/manual/ocr_review.csv"
RAW = ROOT / "data/raw/nbs_yearbook"


def key(r):
    return (r["field"], r["region_code"], int(r["year"]))


def cell_id(r):
    return f'{r["file"]}#r{r["row"]}c{r["col"]}'


def num(s):
    try: return float(s)
    except Exception: return None


def same(a, b):
    """equal allowing for different published precision (e.g. 31291.4 vs 31291)."""
    fa, fb = num(a), num(b)
    if fa is None or fb is None: return False
    if fa == fb: return True
    da = len(a.split(".")[1]) if "." in a else 0
    db = len(b.split(".")[1]) if "." in b else 0
    p = min(da, db)
    return round(fa, p) == round(fb, p) or abs(fa - fb) <= 0.5 * 10 ** (-p) + 1e-9


def select(out, by):
    """Pick one reading per (field, region, year): the newest edition. Queue the pick
    for review when it is unresolved, or when a reading from a near edition (<=2 years
    older, i.e. same revision vintage most likely) disagrees and none agrees."""
    groups = collections.defaultdict(list)
    for r in out: groups[key(r)].append(r)
    sel, queue = [], []
    for k, rs in groups.items():
        rs = sorted(rs, key=lambda r: int(r["edition"]), reverse=True)
        top = rs[0]
        good = [r for r in rs if r["status"] in ("accepted", "reviewed") and r["value_text"] != ""]
        if top["status"] == "rejected":
            continue
        if top["status"] == "needs_review" and top["method"] == "ocr_disputed":
            if not top["field"].startswith("chk_"): queue.append(top)
            continue
        v = top["value_text"]
        others = [r for r in good if r is not top]
        agree = [r for r in others if same(v, r["value_text"])]
        near = [r for r in others if int(top["edition"]) - int(r["edition"]) <= 2]
        near_conf = [r for r in near if not same(v, r["value_text"])]
        if near_conf and not top["field"].startswith("chk_") and not [r for r in near if same(v, r["value_text"])] and top["method"] != "xls" \
                and top["status"] != "reviewed":
            top = dict(top); top["review_note"] = "near-edition conflict: " + ";".join(
                f'{r["file"]}={r["value_text"]}' for r in near_conf[:3])
            queue.append(top); continue
        pick = dict(top)
        # precision upgrade: older reading with more decimals that rounds to the pick
        dec = lambda s: len(s.split(".")[1]) if "." in s else 0
        better = [r for r in agree if dec(r["value_text"]) > dec(v)]
        if better:
            b = max(better, key=lambda r: (dec(r["value_text"]), int(r["edition"])))
            pick["value_text"] = b["value_text"]; pick["precision_from"] = b["file"]
        revised = [r for r in others if not same(v, r["value_text"])]
        if revised:
            pick["revision_note"] = "earlier edition values: " + ";".join(
                sorted({f'{r["edition"]}版={r["value_text"]}' for r in revised}))
        pick["n_agree"] = len(agree)
        sel.append(pick)
    return sel, queue


def main():
    cells = list(csv.DictReader(open(INTERIM / "cells.csv", encoding="utf-8")))
    manual = {}
    if MANUAL.exists():
        for m in csv.DictReader(open(MANUAL, encoding="utf-8")):
            manual[m["cell_id"]] = m
    by = collections.defaultdict(list)
    for r in cells:
        by[key(r)].append(r)
    # decimal-format check: OCR sometimes drops the decimal point in BOTH passes.
    dec = lambda s: len(s.split(".")[1]) if "." in s else 0
    colfmt = collections.defaultdict(collections.Counter)
    for r in cells:
        if r["method"] != "xls" and r["raw"]:
            colfmt[(r["file"], r["col"])][dec(r["raw"])] += 1
    for r in cells:
        if r["method"] == "xls": continue
        maj = colfmt[(r["file"], r["col"])].most_common(1)
        if not maj or maj[0][0] == 0: continue
        d = maj[0][0]
        cands = [c for c in (r["raw"], r["passA"], r["passB"]) if c]
        if any(dec(c) != d for c in cands):
            fixed = [c[:-d] + "." + c[-d:] if ("." not in c and len(c) > d) else c for c in cands]
            r["method"] = "ocr_disputed"
            r["passA"], r["passB"] = (fixed + [""])[0], (fixed + ["", ""])[1] if len(fixed) > 1 else ""
            r["format_note"] = f"decimal format mismatch (column has {d} decimals); candidates {fixed}"

    out = []
    for r in cells:
        cid = cell_id(r)
        r["cell_id"] = cid
        if cid in manual:
            m = manual[cid]
            r["value_text"] = m["value"]; r["status"] = "reviewed" if m["value"] != "" else "rejected"
            r["method"] = r["method"] + "+manual_review"; r["review_note"] = m.get("note", "")
            out.append(r); continue
        others = [o for o in by[key(r)] if o is not r and o["method"] in ("xls", "ocr_consensus")]
        if r["method"] == "ocr_disputed":
            cands = list(dict.fromkeys(c for c in (r["passA"], r["passB"]) if c))
            hits = {c for c in cands for o in others if same(c, o["raw"])}
            if len(hits) == 1:
                r["value_text"] = hits.pop(); r["method"] = "ocr_crossref"; r["status"] = "accepted"
            else:
                r["value_text"] = ""; r["status"] = "needs_review"
        elif r["method"] == "ocr_consensus":
            conflict = [o for o in others if not same(r["raw"], o["raw"])]
            agree = [o for o in others if same(r["raw"], o["raw"])]
            if conflict and not agree:
                r["value_text"] = r["raw"]; r["status"] = "accepted"
                r["review_note"] = "conflicts with " + ";".join(f'{o["file"]}={o["raw"]}' for o in conflict[:3])
            else:
                r["value_text"] = r["raw"]; r["status"] = "accepted"
        else:  # xls
            r["value_text"] = r["raw"]; r["status"] = "accepted"
        out.append(r)

    # ---- selection: newest edition wins (latest official revision) -------------
    sel_rows, queue = select(out, by)

    fields = list(out[0].keys())
    for extra in ("value_text", "status", "review_note", "cell_id"):
        if extra not in fields: fields.append(extra)
    with open(INTERIM / "cells_resolved.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore"); w.writeheader(); w.writerows(out)
    with open(INTERIM / "review_queue.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore"); w.writeheader(); w.writerows(queue)
    sf = fields + ["revision_note", "precision_from", "n_agree"]
    with open(INTERIM / "selected.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=sf, extrasaction="ignore"); w.writeheader(); w.writerows(sel_rows)
    st = collections.Counter(r["status"] for r in out)
    print(dict(st), "selected", len(sel_rows), "queue", len(queue))
    print(collections.Counter((q["table"], q["method"]) for q in queue).most_common(30))


def sheets(n_per=40):
    """Contact sheets of queued cells for visual review (row/col label + cell crop)."""
    q = list(csv.DictReader(open(INTERIM / "review_queue.csv", encoding="utf-8")))
    outdir = INTERIM / "review_sheets"; outdir.mkdir(exist_ok=True)
    for old in outdir.glob("*.png"): old.unlink()
    for s in range(0, len(q), n_per):
        chunk = q[s:s + n_per]
        H = 46 * len(chunk); sheet = Image.new("RGB", (900, H), "white"); d = ImageDraw.Draw(sheet)
        for i, r in enumerate(chunk):
            im = Image.open(RAW / r["file"]).convert("RGB")
            y = int(float(r["y"])); x = int(float(r["x"])) if r["x"] else 0
            if x:
                crop = im.crop((max(0, x - 110), max(0, y - 13), min(im.width, x + 6), y + 13)).resize((348, 41))
            else:  # whole row strip
                crop = im.crop((0, max(0, y - 13), im.width, y + 13)).resize((380, max(8, int(26 * 380 / im.width))))
            sheet.paste(crop, (520, i * 46 + 2))
            d.text((4, i * 46 + 6), f'{s+i:04d} {r["file"]} r{r["row"]} c{r["col"]} {r["region"]} {r["year"]} {r["field"]}', fill="black")
            d.text((4, i * 46 + 24), f'A={r["passA"]} B={r["passB"]} raw={r["raw"]} {r.get("review_note","")[:40]}', fill="blue")
            d.line((0, i * 46 + 44, 900, i * 46 + 44), fill="#ccc")
        sheet.save(outdir / f"sheet_{s//n_per:03d}.png")
    print("sheets", (len(q) + n_per - 1) // n_per)


if __name__ == "__main__":
    import sys
    main()
    if "--sheets" in sys.argv: sheets()
