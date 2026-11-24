// Build-time data access. atlas.json is produced by pipeline/build.py from validated data.
import atlas from "@/data/atlas.json";

export type Region = { code: string; name: string; full: string; en: string };
export type Break = { year: number; note: string };
export type Indicator = {
  id: string; field: string; category: string; decimals: number; derived?: boolean;
  name: string; name_en: string; unit: string; unit_en: string; definition: string; caliber: string;
  formula?: string; breaks: Break[]; missing_years: Record<string, string>; additive: boolean;
  higher: string; no_national?: boolean; status: string; years: number[]; n_obs: number;
  sources: { publication: string; table: string; url: string }[]; methods: Record<string, number>;
};
export type Obs = { indicator: string; region: string; year: number; value: number; status: string; cell: string; method: string; revision: string };
export type Category = { id: string; name: string; name_en: string; desc: string };

type AtlasJson = {
  generated: string; regions: Region[]; national: { code: string; name: string };
  groups: { geo7: Record<string, string[]>; nbs4: Record<string, string[]> };
  categories: Category[]; indicators: Indicator[]; unavailable: { name: string; reason: string }[];
  obs: [string, string, number, number, string, string, string, string][];
  quality: { passed: boolean; cells: number; soft_counts: Record<string, number>; hard_checks: string[] };
  sources_files: { file: string; url: string; title: string; sha256: string; retrieved: string; edition: number }[];
};
const A = atlas as unknown as AtlasJson;

export const GENERATED = A.generated;
export const REGIONS = A.regions;
export const NATIONAL = A.national;
export const GROUPS = A.groups;
export const CATEGORIES = A.categories;
export const INDICATORS = A.indicators;
export const UNAVAILABLE = A.unavailable;
export const QUALITY = A.quality;
export const SOURCE_FILES = A.sources_files;

export const OBS: Obs[] = A.obs.map(([indicator, region, year, value, status, cell, method, revision]) => ({
  indicator, region, year, value, status, cell, method, revision,
}));

const byInd = new Map<string, Obs[]>();
for (const o of OBS) {
  if (!byInd.has(o.indicator)) byInd.set(o.indicator, []);
  byInd.get(o.indicator)!.push(o);
}

export const regionName = (code: string) =>
  code === NATIONAL.code ? "全国" : REGIONS.find((r) => r.code === code)?.name ?? code;

// URL slugs for province pages
export const SLUG: Record<string, string> = {
  "110000": "beijing", "120000": "tianjin", "130000": "hebei", "140000": "shanxi", "150000": "inner-mongolia",
  "210000": "liaoning", "220000": "jilin", "230000": "heilongjiang", "310000": "shanghai", "320000": "jiangsu",
  "330000": "zhejiang", "340000": "anhui", "350000": "fujian", "360000": "jiangxi", "370000": "shandong",
  "410000": "henan", "420000": "hubei", "430000": "hunan", "440000": "guangdong", "450000": "guangxi",
  "460000": "hainan", "500000": "chongqing", "510000": "sichuan", "520000": "guizhou", "530000": "yunnan",
  "540000": "xizang", "610000": "shaanxi", "620000": "gansu", "630000": "qinghai", "640000": "ningxia",
  "650000": "xinjiang",
};
export const CODE_BY_SLUG = Object.fromEntries(Object.entries(SLUG).map(([c, s]) => [s, c]));

export function getIndicator(id: string) {
  return INDICATORS.find((i) => i.id === id);
}
export function obsFor(id: string): Obs[] {
  return byInd.get(id) ?? [];
}
export function value(id: string, region: string, year: number): number | undefined {
  return obsFor(id).find((o) => o.region === region && o.year === year)?.value;
}
export function latestYear(id: string): number {
  const ys = getIndicator(id)?.years ?? [];
  return ys[ys.length - 1];
}
export function yearValues(id: string, year: number) {
  return obsFor(id).filter((o) => o.year === year && o.region !== NATIONAL.code);
}
export function hasBreakAt(ind: Indicator, year: number) {
  return ind.breaks.some((b) => b.year === year);
}

/** Provincial ranking for a year (1 = highest value). */
export function ranking(id: string, year: number) {
  return yearValues(id, year)
    .slice()
    .sort((a, b) => b.value - a.value)
    .map((o, i) => ({ ...o, rank: i + 1 }));
}

export function categoryName(id: string) {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id;
}

/** Compact data for client components (only what a page needs). */
export function clientPayload(id: string) {
  const ind = getIndicator(id)!;
  return {
    indicator: ind,
    obs: obsFor(id).map((o) => [o.region, o.year, o.value, o.status] as [string, number, number, string]),
  };
}
