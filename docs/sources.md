# Sources

All statistical values: **国家统计局《中国统计年鉴》** (China Statistical Yearbook, China Statistics Press), editions 2016–2025, provincial (分地区) tables published at `https://www.stats.gov.cn/sj/ndsj/{edition}/html/{code}.{jpg|xls}`; navigation `…/{edition}/left.htm` (copies in `data/raw/nbs_yearbook/navigation/`).
120 files, retrieved 2026-11-23, each with bytes + SHA-256 → `raw_manifest.csv`.

| Indicator | Tables (by edition) | Format |
|---|---|---|
| 常住人口 | 2-6 (2016–2020 ed.), 2-5 (2021–2025) 分地区年末人口数 | jpg; 2021 xls |
| 城镇化率 | 2-7 / 2-6 分地区年末城镇人口比重 | jpg; 2021 xls |
| 出生率、自然增长率 | 2-8 / 2-7 分地区人口的城乡构成和出生率、死亡率、自然增长率 | jpg (2021 ed. has no such table) |
| 65岁及以上人口占比 (derived) | 2-12 / 2-16 (2021) / 2-11 分地区人口年龄构成和抚养比 | jpg; 2021 xls |
| 地区生产总值, 人均GDP | 3-11 + 3-10 (2016 ed.), 3-9 地区生产总值 (2017–2025) | jpg; 2021 xls |
| 居民人均可支配收入 | 6-17 / 6-18 | jpg; 2021 xls |
| 居民人均消费支出 | 6-19 / 6-20 | jpg; 2021 xls |
| 普通本专科在校生数 | 21-24 (2016), 21-14 | jpg; 2021 xls |
| 普通高等学校数 | 21-25 (2016), 21-15 | jpg; 2021 xls |
| 医院病床使用率 | 22-8 分地区医院床位利用情况 | jpg; 2021 xls |

Access log (2026-11-23):
- `https://data.stats.gov.cn/easyquery.htm?...` → HTTP 403, WAF page "reason:UrlACL". Not bypassed.
- `https://www.stats.gov.cn/sj/ndsj/{2005…2025}/indexch.htm` → 200 (editions 2001–2004 404).
- Editions 2016–2020 and 2022–2025: tables as JPEG only (`.xls` 404); 2021: `.xls` available.
- Reference site research: https://themapsdaily.com/ (+ /methodology, /categories/health, one topic page).
- Regulations consulted for map decision: 《地图管理条例》; 自然资源部标准地图服务 bzdt.ch.mnr.gov.cn (see map_compliance.md).
