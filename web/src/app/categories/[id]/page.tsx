import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, INDICATORS, NATIONAL, value, ranking, regionName } from "@/lib/data";
import { fmt, fmtUnit } from "@/lib/format";

export function generateStaticParams() { return CATEGORIES.map((c) => ({ id: c.id })); }
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const c = CATEGORIES.find((x) => x.id === id);
  if (!c) return {};
  return { title: `${c.name}数据`, description: `中国31个省级行政区${c.name}统计数据：${c.desc}。来源：国家统计局《中国统计年鉴》。`, alternates: { canonical: `/categories/${id}/` } };
}

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = CATEGORIES.find((x) => x.id === id);
  if (!c) notFound();
  const items = INDICATORS.filter((i) => i.category === id);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-xs text-muted"><Link href="/">首页</Link> / <Link href="/indicators/">指标</Link></nav>
      <h1 className="text-3xl font-semibold mt-2">{c.name}</h1>
      <p className="text-ink-2 mt-2">{c.desc}。共 {items.length} 个指标。</p>
      <div className="mt-6 space-y-4">
        {items.map((i) => {
          const y = i.years[i.years.length - 1];
          const rk = ranking(i.id, y);
          const nat = i.no_national ? undefined : value(i.id, NATIONAL.code, y);
          return (
            <Link key={i.id} href={`/indicators/${i.id}/`} className="card p-5 block hover:border-accent-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl font-semibold">{i.name} <span className="text-sm font-normal text-muted">{i.name_en}</span></h2>
                <span className="text-sm text-muted">{i.years[0]}–{y}</span>
              </div>
              <p className="text-sm text-ink-2 mt-1">{i.definition}</p>
              <p className="text-sm mt-3 num">
                {nat !== undefined && <>{y}年全国 <b>{fmtUnit(nat, i.unit, i.decimals)}</b>；</>}
                最高 {regionName(rk[0].region)} {fmt(rk[0].value, i.decimals)}，最低 {regionName(rk[rk.length - 1].region)} {fmt(rk[rk.length - 1].value, i.decimals)}（{i.unit}）
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
