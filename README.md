AI-GENERATED PROTOTYPE — built by Claude Opus 5.5 — 2026-11-23 22:30 ET. Independent work for model comparison. Statistical values come only from the official sources cited on each page.

# China Data Atlas｜中国数据地图 (V0.1)

Make China's Data Accessible, Understandable, Traceable and Explorable.

A static data product that turns the provincial tables of the National Bureau of Statistics' *China Statistical Yearbook* (2016–2025 editions) into a queryable, comparable, citable and downloadable dataset with a website.

- **12 indicators · 31 provinces (+ national where published) · 4,616 observations · 2004–2024**
- Every value carries: yearbook edition, table title, raw-file URL, row/column of the cell, extraction method, status (正式/初步/修订/派生), revision note.
- 120 official raw files kept in `data/raw/nbs_yearbook/` with SHA-256 (`docs/raw_manifest.csv`).

Links:
- Vercel Preview: https://china-data-atlas-claude-cgc0nwahr-timkok621-1320.vercel.app (Vercel Deployment Protection is on: logged-out visitors are redirected to Vercel login)
- Note: Vercel CLI 66 placed the very first deploy of this new project in its Production environment: https://china-data-atlas-claude-9y8l7i7ru-timkok621-1320.vercel.app (same build; no pre-existing project touched)
- GitHub: https://github.com/timkok/china-data-atlas-claude · PR: https://github.com/timkok/china-data-atlas-claude/pull/1
- Drive: China Data Atlas AI Comparison / China Data Atlas - Claude Opus 5.5

## Reproduce
```bash
pip3 install -r pipeline/requirements.txt      # pandas, xlrd, duckdb, pyarrow, pillow, numpy; needs `tesseract` (brew install tesseract)
cd web && npm ci && cd ..
./run_pipeline.sh            # fetch (cached) → OCR/xls extract (~6 min) → resolve → quality gate → build dataset → next build
./run_pipeline.sh --no-ocr   # deterministic rebuild from data/interim/cells.csv
cd web && npx playwright test   # 11 scenarios × desktop/mobile
```
Output: `web/out/` (static site), `data/processed/observations.csv|parquet`, `atlas.duckdb`, `web/public/data/*.csv`.

## Pipeline
Official Sources → `fetch.py` (raw + hashes) → `extract.py` (2021 Excel read directly; other editions are table **images**: two independent OCR passes, only identical readings accepted) → `resolve.py` (cross-edition verification, manual review file `data/manual/ocr_review.csv` always wins, newest edition = latest revision, older values kept) → `validate.py` (quality gate; non-zero exit blocks the build) → `build.py` (normalized dataset, CSVs, site data) → Next.js static export.

## Repository layout
`pipeline/` Python · `data/raw` official files · `data/manual` human review (audited, never auto-overwritten) · `data/interim` cells · `data/processed` dataset + quality report · `web/` Next.js 16 + TypeScript + Tailwind 4 + ECharts 6 · `docs/` research, sources, blockers, map compliance, tests, self-check.

## Known limits
OCR-derived values not covered by a second edition rely on two-pass agreement + identity checks (see docs/self_check.md). GDP is preliminary (初步核算) from the following year's yearbook; later revisions not applied. No geographic map (compliance; see docs/map_compliance.md). 3 requested indicators not available from verifiable official provincial tables in this run (docs/blockers.md). Release dates of yearbook editions not captured (field left empty with note).
