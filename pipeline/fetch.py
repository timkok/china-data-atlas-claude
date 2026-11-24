"""Download raw official table files (polite: sequential, delay, cached, no bypassing)."""
import json, time, hashlib, datetime, pathlib, urllib.request
from sources import T, BASE
ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT/"data/raw/nbs_yearbook"
UA = {"User-Agent": "Mozilla/5.0 (ChinaDataAtlas data pipeline; public statistics)"}

def get(url):
    """Fetch with curl (system TLS store); returns (status, content_type, body)."""
    import subprocess, tempfile, os
    with tempfile.NamedTemporaryFile(delete=False) as f: tmp = f.name
    meta = subprocess.run(["curl", "-s", "-m", "40", "-A", UA["User-Agent"], "-o", tmp,
                           "-w", "%{http_code} %{content_type}", url], capture_output=True, text=True).stdout.split(" ", 1)
    body = open(tmp, "rb").read(); os.unlink(tmp)
    return int(meta[0] or 0), (meta[1] if len(meta) > 1 else ""), body

def main():
    log_path = RAW/"fetch_log.json"
    log = json.loads(log_path.read_text()) if log_path.exists() else {}
    for key, eds in T.items():
        for ed, code in eds.items():
            exts = ["xls","jpg"] if ed == 2021 else ["jpg"]
            for ext in exts:
                dest = RAW/str(ed)/f"{code}.{ext}"
                if dest.exists(): continue
                url = BASE.format(ed=ed, code=code, ext=ext)
                try:
                    st, ct, body = get(url)
                except Exception as e:
                    print("FAIL", url, e); continue
                if st != 200 or "html" in ct: print("SKIP", url, st, ct); continue
                dest.parent.mkdir(parents=True, exist_ok=True); dest.write_bytes(body)
                log[f"{ed}/{code}.{ext}"] = {"url": url, "table_key": key, "edition": ed,
                    "sha256": hashlib.sha256(body).hexdigest(), "bytes": len(body),
                    "retrieved": datetime.date.today().isoformat()}
                print("OK", url, flush=True); time.sleep(0.4)
    log_path.write_text(json.dumps(log, ensure_ascii=False, indent=1, sort_keys=True))

if __name__ == "__main__": main()
