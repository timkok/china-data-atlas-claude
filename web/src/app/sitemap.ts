import type { MetadataRoute } from "next";
import { INDICATORS, CATEGORIES, REGIONS, SLUG, GENERATED } from "@/lib/data";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string) => `${SITE.url}${p}`;
  const lastModified = new Date(GENERATED);
  return [
    { url: u("/"), lastModified, priority: 1 },
    { url: u("/indicators/"), lastModified, priority: 0.9 },
    ...INDICATORS.map((i) => ({ url: u(`/indicators/${i.id}/`), lastModified, priority: 0.9 })),
    ...CATEGORIES.map((c) => ({ url: u(`/categories/${c.id}/`), lastModified, priority: 0.6 })),
    { url: u("/regions/"), lastModified, priority: 0.7 },
    ...REGIONS.map((r) => ({ url: u(`/regions/${SLUG[r.code]}/`), lastModified, priority: 0.6 })),
    ...["/explore/", "/methodology/", "/quality/", "/about/"].map((p) => ({ url: u(p), lastModified, priority: 0.5 })),
  ];
}
