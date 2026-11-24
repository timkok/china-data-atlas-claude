import { INDICATORS, REGIONS, SLUG, categoryName } from "./data";

export type SearchItem = { label: string; sub: string; href: string; kw: string };

/** Static search index (indicators + provinces), shipped to the client search box. */
export function searchIndex(): SearchItem[] {
  return [
    ...INDICATORS.map((i) => ({
      label: i.name, sub: `${categoryName(i.category)} · ${i.unit}`, href: `/indicators/${i.id}/`,
      kw: `${i.name} ${i.name_en} ${i.id} ${categoryName(i.category)}`.toLowerCase(),
    })),
    ...REGIONS.map((r) => ({
      label: r.full, sub: `地区 · ${r.en}`, href: `/regions/${SLUG[r.code]}/`,
      kw: `${r.name} ${r.full} ${r.en} ${SLUG[r.code]}`.toLowerCase(),
    })),
  ];
}
