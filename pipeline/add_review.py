"""Append visual-review readings: python3 add_review.py "0:7723,1:4.71,..." (indexes into review_queue.csv)."""
import csv, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
q = list(csv.DictReader(open(ROOT / "data/interim/review_queue.csv", encoding="utf-8")))
path = ROOT / "data/manual/ocr_review.csv"
existing = {r["cell_id"] for r in csv.DictReader(open(path, encoding="utf-8"))} if path.exists() else set()
with open(path, "a", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    for item in sys.argv[1].split(","):
        i, v = item.split(":", 1); r = q[int(i)]
        if r["cell_id"] in existing: continue
        w.writerow([r["cell_id"], v, "claude-visual", "2026-11-23",
                    f"read from source image; OCR A={r['passA']} B={r['passB']} raw={r['raw']}"])
print("ok")
