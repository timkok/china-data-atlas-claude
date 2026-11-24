#!/usr/bin/env bash
# One-command rebuild: official files -> raw -> OCR/xls cells -> resolve -> quality gate -> dataset -> static site.
# Usage: ./run_pipeline.sh            (full; OCR extraction takes ~6 min)
#        ./run_pipeline.sh --no-ocr   (reuse data/interim/cells.csv; deterministic resolve/validate/build)
set -euo pipefail
cd "$(dirname "$0")/pipeline"
python3 fetch.py                     # cached; verifies nothing is re-downloaded if present
if [[ "${1:-}" != "--no-ocr" ]]; then python3 extract.py; fi
python3 resolve.py
python3 validate.py                  # exits non-zero if any hard check fails -> stops the build
python3 build.py
cd ../web && npm run build
echo "Done. Static site in web/out/"
