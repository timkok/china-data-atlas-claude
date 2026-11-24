"""Transcribe numeric tables from official NBS yearbook table images.

Method (see docs/methodology.md):
  * Two independent OCR passes with different preprocessing (scale/threshold).
  * Tokens are grouped into rows by y-position; the yellow region-label column is
    excluded; tokens are assigned to columns by right-edge x clusters (NBS tables are
    right-aligned).
  * A cell is accepted automatically only when both passes agree exactly. Otherwise it
    goes to a review queue; the reviewer records the value read from the source image
    in data/manual/ocr_review.csv (auditable, never overwritten automatically).
  * validate.py adds independent checks (machine-readable 2021 .xls overlap, overlap
    between editions of multi-year tables, ranges, year-on-year jumps, sums).
"""
import subprocess, io, csv, re, statistics
from PIL import Image
import numpy as np

PASSES = [
    {"scale": 4, "thresh": 170, "psm": 6},
    {"scale": 3, "thresh": 140, "psm": 6},
]
NUM = re.compile(r"^-?\d+(\.\d+)?$")


def label_edge(img):
    a = np.asarray(img.convert("RGB")).astype(int)
    yellow = (a[:, :, 0] > 220) & (a[:, :, 1] > 220) & (a[:, :, 2] < 170)
    xs = np.where(yellow.mean(axis=0) > 0.3)[0]
    return int(xs.max()) + 2 if len(xs) else int(img.width * 0.08)


def run_pass(img, p, crop_x0):
    w, h = img.size
    g = img.convert("L").crop((crop_x0, 0, w, h))
    g = g.resize((g.width * p["scale"], g.height * p["scale"]), Image.LANCZOS)
    g = g.point(lambda v: 255 if v > p["thresh"] else 0)
    buf = io.BytesIO(); g.save(buf, "PNG")
    out = subprocess.run(["tesseract", "stdin", "stdout", "--psm", str(p["psm"]),
                          "-c", "tessedit_char_whitelist=0123456789.-", "tsv"],
                         input=buf.getvalue(), capture_output=True).stdout.decode()
    toks = []
    for r in csv.DictReader(io.StringIO(out), delimiter="\t", quoting=csv.QUOTE_NONE):
        t = (r.get("text") or "").strip()
        if not t or not NUM.match(t):
            continue
        s = p["scale"]
        toks.append({"t": t, "x": crop_x0 + (int(r["left"]) + int(r["width"])) / s,
                     "y": (int(r["top"]) + int(r["height"]) / 2) / s, "conf": float(r["conf"])})
    return toks


def rows_of(toks, tol=6):
    toks = sorted(toks, key=lambda t: t["y"])
    rows, cur = [], []
    for t in toks:
        if cur and abs(t["y"] - statistics.mean(c["y"] for c in cur)) > tol:
            rows.append(cur); cur = []
        cur.append(t)
    if cur: rows.append(cur)
    return [sorted(r, key=lambda t: t["x"]) for r in rows]


def column_centers(rows, ncols):
    full = [r for r in rows if len(r) == ncols]
    if not full:
        raise ValueError(f"no row with {ncols} tokens")
    return [statistics.median(r[i]["x"] for r in full) for i in range(ncols)]


def grid(path, ncols, nrows):
    """Return (rows[nrows][ncols] with None for disputed cells, issues, row_y)."""
    img = Image.open(path)
    x0 = label_edge(img)
    results = []
    for p in PASSES:
        rs = [r for r in rows_of(run_pass(img, p, x0)) if len(r) >= max(2, ncols // 2)]
        centers = column_centers(rs, ncols)
        span = (centers[-1] - centers[0]) / max(1, ncols - 1) if ncols > 1 else 80
        placed = []
        for r in rs:
            out = [None] * ncols
            for t in r:
                i = min(range(ncols), key=lambda k: abs(centers[k] - t["x"]))
                if abs(centers[i] - t["x"]) < span * 0.45 and out[i] is None:
                    out[i] = t["t"]
            placed.append((out, statistics.mean(t["y"] for t in r)))
        data = placed[-nrows:]
        results.append(([d[0] for d in data], [d[1] for d in data], centers))
    (A, yA, cA), (B, yB, _) = results
    if len(A) != nrows or len(B) != nrows:
        raise ValueError(f"{path}: expected {nrows} rows, got {len(A)}/{len(B)}")
    merged, issues = [], []
    for i in range(nrows):
        row = []
        for j in range(ncols):
            a, b = A[i][j], B[i][j]
            if a is not None and a == b:
                row.append(a)
            else:
                row.append(None)
                issues.append({"row": i, "col": j, "passA": a, "passB": b,
                               "y": round(yA[i]), "x": round(cA[j])})
        merged.append(row)
    return merged, issues, [round(y) for y in yA], [round(c) for c in cA]
