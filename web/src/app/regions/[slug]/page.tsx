import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { REGIONS, SLUG, CODE_BY_SLUG, INDICATORS, CATEGORIES, NATIONAL, value, latestYear, ranking, obsFor, GROUPS } from "@/lib/data";
import { fmt, changeLabel } from "@/lib/format";
import Sparkline from "@/components/Sparkline";

export function generateStaticParams() { return REGIONS.map((r) => ({ slug: SLUG[r.code] })); }
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = REGIONS.find((x) => x.code === CODE_BY_SLUG[slug]);
  if (!r) return {};
  const py = latestYear("population");
  return {
    title: `${r.full}统计数据`,
    description: `${r.full}（${r.en}）主要统计指标：${py}年常住人口${fmt(value("population", r.code, py))}万人，以及GDP、人均GDP、居民收入、城镇化率、出生率、老龄化、高等教育等指标的最新数据与全国排名。来源：国家统计局。`,
    alternates: { canonical: `/regions/${slug}/` },
  };
}

export default async function RegionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const code = CODE_BY_SLUG[slug];
  const r = REGIONS.find((x) => x.code === code);
  if (!r) notFound();
  const geo = Object.entries(GROUPS.geo7).find(([, cs]) => cs.includes(code))?.[0];
  const nbs = Object.entries(GROUPS.nbs4).find(([, cs]) => cs.includes(code))?.[0];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-xs text-muted"><Link href="/">首页</Link> / <Link href="/regions/">地区</Link></nav>
      <h1 className="text-3xl font-semibold mt-2">{r.full}</h1>
      <p className="text-muted">{r.en} · 行政区划代码 {code} · {geo}地区 · 国家统计局{nbs}地区</p>
      {CATEGORIES.map((c) => (
        <section key={c.id} className="mt-8" aria-labelledby={`h-${c.id}`}>
          <h2 id={`h-${c.id}`} className="text-xl font-semibold">{c.name}</h2>
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            {INDICATORS.filter((i) => i.category === c.id).map((i) => {
              const y = latestYear(i.id);
              const v = value(i.id, code, y);
              const prev = i.years.includes(y - 1) && !i.breaks.some((b) => b.year === y) ? value(i.id, code, y - 1) : undefined;
              const rk = ranking(i.id, y).find((x) => x.region === code)?.rank;
              const nat = i.no_national ? undefined : value(i.id, NATIONAL.code, y);
              const series = obsFor(i.id).filter((o) => o.region === code).map((o) => [o.year, o.value] as [number, number]);
              return (
                <Link key={i.id} href={`/indicators/${i.id}/?regions=${code}`} className="card p-4 hover:border-accent-2 flex gap-4 items-center" data-testid={`region-ind-${i.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink-2">{i.name}</div>
                    <div className="text-2xl font-semibold num mt-0.5">{fmt(v, i.decimals)} <span className="text-sm font-normal text-muted">{i.unit}</span></div>
                    <div className="text-xs text-muted mt-1 num">
                      {y}年 · 全国第 {rk ?? "—"} 位{nat !== undefined ? ` · 全国 ${fmt(nat, i.decimals)}` : ""}
                      {prev !== undefined && v !== undefined ? ` · 同比 ${changeLabel(prev, v, i.unit)}` : ""}
                    </div>
                  </div>
                  <Sparkline data={series} />
                </Link>
              );
            })}
          </div>
        </section>
      ))}
      <p className="mt-8 text-xs text-muted">点击任一指标进入详情页，可与其他省份比较、查看出处和下载数据。排名按数值从高到低，仅表示数值大小，不代表优劣评价。</p>
    </div>
  );
}
