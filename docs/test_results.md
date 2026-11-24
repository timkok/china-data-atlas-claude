# Test results

Final run: 2026-11-24T03:15:15.582Z UTC · Playwright 1.65 · Chromium · static export served locally

**22/22 passed** — 20 on first attempt, 2 passed on retry (network-only: live HTTP check of stats.gov.cn hit a TLS reset), 0 failed. 11 scenarios × desktop 1440×900 + mobile Pixel 7.

| Test | Project | Status | ms |
|---|---|---|---|
| 1. homepage loads with value proposition, search, categories and no console errors | desktop | passed | 496 |
| 1. homepage loads with value proposition, search, categories and no console errors | mobile | passed | 497 |
| 2. every indicator page loads with sections A–G and no console errors | desktop | passed | 2591 |
| 2. every indicator page loads with sections A–G and no console errors | mobile | passed | 2636 |
| 3. year switch updates map, ranking and values | desktop | passed | 401 |
| 3. year switch updates map, ranking and values | mobile | passed | 378 |
| 4. province selection drives comparison (chips, tiles, trend) | desktop | passed | 669 |
| 4. province selection drives comparison (chips, tiles, trend) | mobile | passed | 634 |
| 5. regional ranking filter | desktop | passed | 461 |
| 5. regional ranking filter | mobile | passed | 471 |
| 6. charts and tables match the published data | desktop | passed | 1115 |
| 6. charts and tables match the published data | mobile | passed | 1072 |
| 7. CSV export: full file and filtered download | desktop | passed | 591 |
| 7. CSV export: full file and filtered download | mobile | passed | 631 |
| 8. no-data states are explicit (missing year, empty filter, unknown page) | desktop | passed | 358 |
| 8. no-data states are explicit (missing year, empty filter, unknown page) | mobile | passed | 366 |
| 9. source links point to official NBS files | desktop | passed (retry 1: first attempt ECONNRESET from stats.gov.cn) | 10946 |
| 9. source links point to official NBS files | mobile | passed (retry 1: first attempt ECONNRESET from stats.gov.cn) | 7333 |
| 10. responsive layout: no horizontal overflow; content readable | desktop | passed | 688 |
| 10. responsive layout: no horizontal overflow; content readable | mobile | passed | 748 |
| 11. SEO: main content is in static HTML; three-click path to any province value | desktop | passed | 382 |
| 11. SEO: main content is in static HTML; three-click path to any province value | mobile | passed | 396 |

Coverage of Brief §8: 1 homepage · 2 all 12 indicator pages, A–G headings, console errors asserted empty · 3 year switch · 4 province switch (chips, tiles, trend legend) · 5 ranking filter by region · 6 chart labels / table rows vs dataset · 7 CSV (row counts for all 12 files + filtered download content) · 8 no-data states (2020 gap, empty filter, 404) · 9 source links (pattern + live HTTP 200 sample) · 10 responsive (no horizontal overflow on 5 pages, both viewports) · 11 SEO static HTML, sitemap, JSON-LD + 3-click path.

Screenshots (`node tests/screens.mjs`): 375 / 768 / 1440 px → console errors 0 / 0 / 0; files in `screenshots/`.

Data Quality Gate: `python3 pipeline/validate.py` → PASSED, 0 hard failures (`quality_report.json`).
Reproducibility: re-running resolve → validate → build twice produced byte-identical observations.csv.
Spot check: 30/30 randomly sampled published values matched the source images (`spot_check.csv`).

Earlier runs: one run had 1 failure (same live link check, 30 s timeout) → timeout raised to 50 s and 1 retry allowed for network errors only.