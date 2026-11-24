import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, INDICATORS, UNAVAILABLE, NATIONAL, value } from "@/lib/data";
import { fmtUnit } from "@/lib/format";

export const metadata: Metadata = {
  title: "全部指标",
  description: "中国数据地图收录的全部分省统计指标：人口、城镇化、出生率、老龄化、GDP、人均GDP、居民收入与消费、高等教育、医院病床使用率。",
  alternates: { canonical: "/indicators/" },
};

export default function IndicatorsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold">全部指标</h1>
      <p className="mt-2 text-ink-2">V0.1 收录 {INDICATORS.length} 个经过校验的分省指标。每个指标有独立页面，包含分布、排名、趋势、区域比较、完整数据和方法说明。</p>
      {CATEGORIES.map((c) => (
        <section key={c.id} className="mt-8" aria-labelledby={`c-${c.id}`}>
          <h2 id={`c-${c.id}`} className="text-xl font-semibold"><Link href={`/categories/${c.id}/`} className="hover:underline">{c.name}</Link> <span className="text-sm text-muted font-normal">{c.name_en}</span></h2>
          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {INDICATORS.filter((i) => i.category === c.id).map((i) => {
              const y = i.years[i.years.length - 1];
              const nat = i.no_national ? undefined : value(i.id, NATIONAL.code, y);
              return (
                <Link key={i.id} href={`/indicators/${i.id}/`} className="card p-4 hover:border-accent-2" data-testid={`ind-card-${i.id}`}>
                  <div className="font-medium">{i.name}</div>
                  <div className="text-xs text-muted">{i.name_en}</div>
                  <div className="mt-3 text-xl font-semibold num">{nat !== undefined ? fmtUnit(nat, i.unit, i.decimals) : "仅分省"}</div>
                  <div className="text-xs text-muted">{nat !== undefined ? `${y}年全国` : `${y}年，无可比全国值`} · 覆盖 {i.years[0]}–{y}</div>
                  <p className="mt-2 text-xs text-ink-2 line-clamp-2">{i.definition}</p>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
      <section className="mt-10 card p-5 bg-warn-soft/40" aria-labelledby="h-unavail">
        <h2 id="h-unavail" className="font-semibold">计划中但暂未上线的指标</h2>
        <p className="text-sm text-ink-2 mt-1">以下指标因无法取得可核验的官方分省数据而暂缓上线。我们不使用未经核实的替代数据。</p>
        <ul className="mt-3 space-y-2 text-sm">
          {UNAVAILABLE.map((u) => <li key={u.name}><span className="font-medium">{u.name}</span>：<span className="text-ink-2">{u.reason}</span></li>)}
        </ul>
      </section>
    </div>
  );
}
