# Phase 1 — Product research & MVP scope

AI-GENERATED PROTOTYPE — built by Claude Opus 5.5 — 2026-11-23. Independent work for model comparison.

## Reference site: themapsdaily.com (India) — pages studied 2026-11-23
Home, one indicator page (`/posts/in-infant-mortality-rate`), `/methodology`, `/categories/health`.

| # | Area | Observation |
|---|---|---|
| 1 | Home & IA | Tagline + one-line promise; headline counts (datasets, topics, sources, datapoints); featured chart; "Recently added"; topic cards with sub-topic counts; "How we work" trust strip; footer. |
| 2 | Taxonomy | Two levels, ~20 topics; many thin sub-categories (1–3 datasets); inconsistent slugs (`crime_law` vs hyphens). |
| 3 | Maps | State choropleth with diverging green/red vs national value; national reference line. |
| 4 | Topic page | Numbered narrative "Part 1…5" with finding-as-headline; anchor nav (Overview/Data/Methodology/Cite/Related). |
| 5 | Trend | National 2004–2023 trend with a single "compare with state" selector. |
| 6 | Ranking/regions | Top/bottom lists, most improved/worsened since a base year, zone medians. |
| 7 | CSV/Explorer | Repeated download links; schema panel (column, type, unique, min/median/max); no filter-and-download. |
| 8 | Sources/citation | Strong: publisher, exact table, unit, licence (CC BY 4.0), copy-ready citation, data-quality score with checklist, chart flags for suspect/derived values. |
| 9 | SEO | Clean slugs, breadcrumbs, finding-style titles, substantial text next to charts, related cards. |
| 10 | Mobile | Long single-column narrative; paginated category cards (not directly measured). |

### 借鉴 (borrow)
Finding-as-headline summaries; explicit methodology & "what we don't do"; copy-ready citation + CSV next to every chart; schema / data dictionary panel; chart flags for breaks and derived values.

### 不足 (weak)
Red/green diverging palette (colour-blind risk); single-state comparison; no filtered download, no share links, no PNG/SVG export; quality score not explained; revision history promised but not visible.

### 超越 (exceed) — implemented in V0.1
- Cell-level provenance: every value carries yearbook edition, table, raw-file URL and row/column (`source_cell`), raw files hashed.
- Revision handling visible: newest edition wins, earlier-edition values kept in `revision_note`; caliber breaks drawn on charts; YoY suppressed in break years.
- Multi-province comparison (≤8), regional groupings (7 geographic + NBS 4), filtered CSV, PNG/SVG export, share links, cross-indicator scatter (V0.5 preview).
- Colour-blind-safe sequential palette, keyboard-operable tiles, static HTML for every indicator & province page, schema.org Dataset JSON-LD.
- Published quality gate with identities (birth−death=growth, GDP=Σindustries, Σage groups=total, Σprovinces=national for additive education indicators).

## Existing Chinese data products (context)
- data.stats.gov.cn (国家数据): authoritative query DB; API returned HTTP 403 (WAF) to automated access on 2026-11-23 — not used.
- 国家统计局 年鉴 HTML (www.stats.gov.cn/sj/ndsj/): public; 2016–2025 editions; tables as images except the 2021 edition (Excel).
- Gap these leave: no cross-year normalized series with provenance, no comparison UX, no downloadable tidy CSV.

## MVP scope (V0.1)
12 indicators, 31 provinces (+ national where published), years 2004–2024 depending on indicator; home, categories, 12 indicator pages (A–G), 31 province pages, explorer & downloads, methodology, quality report, about. Map deferred (see map_compliance.md); schematic tile grid instead.
