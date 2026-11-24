import type { Metadata } from "next";
import Link from "next/link";
import { REGIONS, SLUG, GROUPS, value, latestYear } from "@/lib/data";
import { fmt } from "@/lib/format";

export const metadata: Metadata = {
  title: "31个省级行政区",
  description: "按省级行政区查看人口、经济、教育、医疗等统计指标的最新数据与历史变化。",
  alternates: { canonical: "/regions/" },
};

export default function RegionsPage() {
  const py = latestYear("population"), iy = latestYear("disposable-income");
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold">31个省级行政区</h1>
      <p className="mt-2 text-ink-2">选择一个省级行政区，查看该地区全部指标的最新可得数据和历史变化。按七大地理分区排列。</p>
      <p className="mt-1 text-xs text-muted">数据覆盖中国大陆31个省级行政区。香港特别行政区、澳门特别行政区和台湾省不在所用国家统计局分地区表格范围内，这不代表任何地理或归属上的判断。</p>
      {Object.entries(GROUPS.geo7).map(([g, codes]) => (
        <section key={g} className="mt-8" aria-labelledby={`g-${g}`}>
          <h2 id={`g-${g}`} className="text-lg font-semibold">{g}</h2>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {codes.map((c) => {
              const r = REGIONS.find((x) => x.code === c)!;
              return (
                <Link key={c} href={`/regions/${SLUG[c]}/`} className="card p-4 hover:border-accent-2" data-testid={`region-card-${c}`}>
                  <div className="font-medium">{r.full}</div>
                  <div className="text-xs text-muted">{r.en} · {c}</div>
                  <div className="text-xs text-ink-2 mt-2 num">常住人口 {fmt(value("population", c, py))} 万（{py}）</div>
                  <div className="text-xs text-ink-2 num">人均可支配收入 {fmt(value("disposable-income", c, iy))} 元</div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
