# Decisions (reversible defaults, with reasons)
1. **Separate working folder** `china-data-atlas-claude/`: another agent was concurrently writing into `china-data-atlas/` and altered files; moved to avoid collisions, did not touch the other folder after that.
2. **Source = NBS China Statistical Yearbook HTML (2016–2025)**; data.stats.gov.cn API returned 403 (WAF) → not used, not bypassed.
3. **Image tables transcribed** with two-pass OCR + cross-edition checks + identities + human visual review of every disputed/flagged cell (152 cells reviewed). Rejected alternative: manual typing of all ~14k cells (error-prone, slower).
4. **Newest edition wins** for a given indicator·region·year (latest official revision); older values retained in `revision_note`.
5. **Series breaks** declared where population/urbanization switch from pre- to post-7th-census vintage (2011), census years, tertiary-education scope change (2021). YoY suppressed in break years.
6. **Indicator substitutions**: 居民人均消费支出 added (retail sales unavailable — different concept, labeled); 医院病床使用率 as health indicator (per-1000 doctors/beds unavailable); 人口自然增长率 added (enables identity check).
7. **65+ share derived** from the same table's 65+ count / sample total (sample survey; noted).
8. **GDP shows no national value** (Σprovinces ≠ national accounting).
9. **No geographic map**; boundary-free tile grid (see map_compliance.md).
10. **Static export** (Next.js `output: export`) — no server, no keys, SEO-readable HTML.
11. Excel cells rounded to the yearbook's printed precision (1 dp income/consumption, else 2 dp).
