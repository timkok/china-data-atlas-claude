# Map compliance (Section 5B)

**Conclusion: geographic map deferred in V0.1; boundary-free schematic tile grid + rankings used instead.**

Basis (Chinese regulations, summarised; sources: 《地图管理条例》(国务院令第664号, 2015), 《地图审核管理规定》(自然资源部), 自然资源部标准地图服务 http://bzdt.ch.mnr.gov.cn/ — accessed for reference 2026-11-23):
1. Maps of China published or displayed publicly must be reviewed (审图号) unless they are unmodified standard maps from the official standard-map service, and must represent national boundaries and territory completely and accurately.
2. Standard maps may be used directly; if their content is modified the result may need to go through map review again. Whether interactive choropleth shading of province polygons counts as a modification that triggers review could not be confirmed with certainty from public guidance.
3. Freely circulating GeoJSON boundary files (e.g. widely used web-map extracts) carry no 审图号 and their completeness of national territory could not be verified.

Decision: no geographic boundaries are drawn anywhere on the site. The "地区分布" view is a schematic grid of equal squares (one per province, approximate relative position, explicitly labeled as not a map, no outline/coastline/boundary/area). Rankings and regional dot plots are the primary distribution views.
Future: use an officially reviewed map service or obtain review for a base map; update methodology page.
Coverage statement on every page footer & methodology: HK SAR, Macao SAR and Taiwan Province are outside the scope of the NBS provincial tables used — not a judgement about geography or sovereignty.
