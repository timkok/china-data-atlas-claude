# Indicators not published in V0.1 / replacements

| Requested indicator | Status | Evidence (2026-11-23) | Replacement & reason |
|---|---|---|---|
| 社会消费品零售总额（分省） | Not published | NBS yearbook 2016–2025 left-nav tables (`/sj/ndsj/{E}/left.htm`) contain no 分地区社会消费品零售总额 table; data.stats.gov.cn `easyquery.htm` returned **HTTP 403** ("reason:UrlACL", WAF). Not bypassed. | 居民人均消费支出 (yearbook table 6-20 / 6-19) is published as a separate indicator. It is **not** a substitute measure; labeled as different concept. Next: auditable manual import from 31 provincial statistical communiqués. |
| 每千人口执业（助理）医师数（分省） | Not published | Not among 分地区 tables of the NBS yearbook (chapter 22 only national 22-3). Authoritative source is NHC《中国卫生健康统计年鉴》; no machine-readable or table-image source obtained in this run. | — (planned manual import) |
| 每千人口医疗卫生机构床位数（分省） | Not published | Same as above (22-6 is national). | 医院病床使用率 (yearbook 22-8, 分地区医院床位利用情况) as the V0.1 health indicator — different concept (utilisation, hospitals only), stated on page. |
| 普通高等学校在校生人数 | Published as 普通本专科在校生数 | Yearbook 21-14 gives 普通（及2021起职业）本专科 enrolment; postgraduates not by province in same table. | Name states the exact scope. |
| Added | 人口自然增长率 | Same table as birth rate; enables identity check birth−death=growth. | Added to strengthen population category. |
| Gap | 出生率 / 自然增长率 2020 | 2021 yearbook edition has no 分地区出生率 table (census year). | Left missing, not interpolated. |
