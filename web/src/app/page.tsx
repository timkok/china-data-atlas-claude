import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import FeaturedTiles from "@/components/FeaturedTiles";
import { CATEGORIES, INDICATORS, REGIONS, OBS, QUALITY, SOURCE_FILES, NATIONAL, latestYear, value, ranking, regionName, SLUG, GENERATED } from "@/lib/data";
import { searchIndex } from "@/lib/search";
import { fmt, fmtUnit } from "@/lib/format";

const ICON: Record<string, string> = { population: "👥", economy: "📈", education: "🎓", health: "🏥" };

function featured(id: string) {
  const ind = INDICATORS.find((i) => i.id === id)!;
  const y = latestYear(id);
  return {
    id, name: ind.name, unit: ind.unit, decimals: ind.decimals, year: y,
    values: Object.fromEntries(ranking(id, y).map((r) => [r.region, r.value])),
    national: ind.no_national ? undefined : value(id, NATIONAL.code, y),
  };
}

function discoveries() {
  const out: { title: string; body: string; href: string }[] = [];
  // 1. natural growth negative count
  const ng = ranking("natural-growth-rate", latestYear("natural-growth-rate"));
  const neg = ng.filter((r) => r.value < 0).length;
  out.push({ title: `${neg} 个省份人口自然负增长`, body: `${latestYear("natural-growth-rate")}年，31个省级行政区中有 ${neg} 个出生人数少于死亡人数；全国人口自然增长率为 ${fmt(value("natural-growth-rate", NATIONAL.code, latestYear("natural-growth-rate")), 2)}‰。`, href: "/indicators/natural-growth-rate/" });
  // 2. income gap
  const inc = ranking("disposable-income", latestYear("disposable-income"));
  out.push({ title: `收入最高与最低省份相差 ${(inc[0].value / inc[inc.length - 1].value).toFixed(1)} 倍`, body: `${latestYear("disposable-income")}年居民人均可支配收入：${regionName(inc[0].region)} ${fmt(inc[0].value)} 元，${regionName(inc[inc.length - 1].region)} ${fmt(inc[inc.length - 1].value)} 元。`, href: "/indicators/disposable-income/" });
  // 3. population change 2020->latest (same vintage)
  const y = latestYear("population");
  const grew = REGIONS.map((r) => ({ c: r.code, d: (value("population", r.code, y) ?? 0) - (value("population", r.code, 2020) ?? 0) }));
  const g = grew.filter((x) => x.d > 0).length;
  const most = grew.slice().sort((a, b) => b.d - a.d)[0];
  out.push({ title: `2020年以来 ${g} 个省份常住人口增加`, body: `2020–${y}年，${31 - g} 个省份常住人口减少；增加最多的是${regionName(most.c)}（+${fmt(most.d)} 万人）。`, href: "/indicators/population/" });
  // 4. aging
  const ag = ranking("aged-65-share", latestYear("aged-65-share"));
  const over14 = ag.filter((r) => r.value >= 14).length;
  out.push({ title: `${over14} 个省份65岁及以上人口占比超过14%`, body: `按${latestYear("aged-65-share")}年人口变动抽样调查样本计算，最高为${regionName(ag[0].region)}（${fmt(ag[0].value, 2)}%），最低为${regionName(ag[ag.length - 1].region)}（${fmt(ag[ag.length - 1].value, 2)}%）。14%是常用的“深度老龄化”参考线。`, href: "/indicators/aged-65-share/" });
  return out;
}

export default function Home() {
  const totalTables = SOURCE_FILES.length;
  const cats = CATEGORIES.map((c) => ({ ...c, items: INDICATORS.filter((i) => i.category === c.id) }));
  const latest = INDICATORS.slice().sort((a, b) => b.years[b.years.length - 1] - a.years[a.years.length - 1] || a.name.localeCompare(b.name));
  return (
    <>
      <section className="bg-white border-b border-line">
        <div className="mx-auto max-w-6xl px-4 pt-12 pb-10 grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div>
            <p className="text-sm text-accent font-medium tracking-wide">Make China&apos;s data accessible, understandable, traceable and explorable.</p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">读懂中国各省的<br />官方统计数据</h1>
            <p className="mt-4 text-lg text-ink-2 leading-relaxed max-w-xl">把国家统计局统计年鉴中分散的分省数据，整理成可以查询、比较、可视化、引用和下载的数据。每一个数值都标注年鉴版本、表格和单元格位置。</p>
            <div className="mt-6 max-w-xl"><SearchBox index={searchIndex()} /></div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="text-muted">热门：</span>
              {["population", "gdp-per-capita", "disposable-income", "aged-65-share", "urbanization"].map((id) => (
                <Link key={id} href={`/indicators/${id}/`} className="chip hover:border-accent-2">{INDICATORS.find((i) => i.id === id)!.name}</Link>
              ))}
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3" aria-label="平台统计">
            {[
              [String(INDICATORS.length), "个已校验指标"],
              ["31", "个省级行政区"],
              [OBS.length.toLocaleString(), "个数据点"],
              [`${Math.min(...INDICATORS.map((i) => i.years[0]))}–${Math.max(...INDICATORS.map((i) => i.years[i.years.length - 1]))}`, "年份覆盖"],
              [String(totalTables), "个官方原始表格文件"],
              [QUALITY.passed ? "通过" : "未通过", `数据质量门禁（${QUALITY.hard_checks.length}项硬性检查）`],
            ].map(([v, l]) => (
              <div key={l} className="card p-4">
                <dd className="text-2xl font-semibold num">{v}</dd>
                <dt className="text-xs text-muted mt-1">{l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <section aria-labelledby="h-cats" className="mt-12">
          <h2 id="h-cats" className="text-2xl font-semibold">按主题浏览</h2>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cats.map((c) => (
              <div key={c.id} className="card p-5 flex flex-col">
                <Link href={`/categories/${c.id}/`} className="group">
                  <div className="text-2xl" aria-hidden>{ICON[c.id]}</div>
                  <h3 className="mt-2 font-semibold group-hover:underline">{c.name}</h3>
                  <p className="text-xs text-muted mt-1">{c.desc}</p>
                </Link>
                <ul className="mt-3 space-y-1 text-sm">
                  {c.items.map((i) => <li key={i.id}><Link className="text-accent hover:underline" href={`/indicators/${i.id}/`}>{i.name}</Link></li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="h-feat" className="mt-12 card p-5 sm:p-8">
          <h2 id="h-feat" className="text-2xl font-semibold">一图看各省</h2>
          <div className="mt-5">
            <FeaturedTiles regions={REGIONS.map((r) => ({ code: r.code, name: r.name }))}
              items={["disposable-income", "population", "urbanization", "aged-65-share", "gdp-per-capita"].map(featured)} />
          </div>
          <p className="mt-4 text-xs text-muted">示意方格图：每个方格代表一个省级行政区，仅示意大致相对位置，不表示行政边界或面积。</p>
        </section>

        <section aria-labelledby="h-disc" className="mt-12">
          <h2 id="h-disc" className="text-2xl font-semibold">值得关注的数据</h2>
          <p className="text-sm text-muted mt-1">根据最新可得数据自动计算的事实陈述，不包含因果推断。</p>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            {discoveries().map((d) => (
              <Link key={d.title} href={d.href} className="card p-5 hover:border-accent-2">
                <h3 className="font-semibold text-lg">{d.title}</h3>
                <p className="mt-2 text-sm text-ink-2 leading-relaxed">{d.body}</p>
                <span className="mt-3 inline-block text-sm text-accent">查看数据 →</span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="h-latest" className="mt-12 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 id="h-latest" className="text-2xl font-semibold">全部数据集</h2>
            <div className="mt-4 card divide-y divide-line">
              {latest.map((i) => {
                const y = i.years[i.years.length - 1];
                const nat = i.no_national ? undefined : value(i.id, NATIONAL.code, y);
                return (
                  <Link key={i.id} href={`/indicators/${i.id}/`} className="flex items-center gap-4 p-4 hover:bg-paper">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{i.name} <span className="text-xs text-muted">{i.name_en}</span></div>
                      <div className="text-xs text-muted mt-0.5">{i.years[0]}–{y} · {i.n_obs} 个数据点 · {i.status === "初步" ? "初步核算" : "正式发布"}</div>
                    </div>
                    <div className="text-right num">
                      <div className="font-semibold">{nat !== undefined ? fmtUnit(nat, i.unit, i.decimals) : "分省"}</div>
                      <div className="text-xs text-muted">{nat !== undefined ? `${y}年全国` : `${y}年`}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">数据来源</h2>
            <div className="mt-4 card p-5 text-sm space-y-3">
              <p><span className="font-medium">国家统计局《中国统计年鉴》</span>2016–2025年版分地区表格，共 {totalTables} 个原始文件，每个文件保存 SHA-256 校验值。</p>
              <p className="text-ink-2">数据处理：官方Excel直读；图像表格经两次独立OCR取一致读数，不一致单元格人工对照原图核对；再经 {QUALITY.hard_checks.length} 项自动质量检查。</p>
              <p className="text-ink-2">数据版本：{GENERATED}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link href="/methodology/" className="btn">方法说明</Link>
                <Link href="/quality/" className="btn">质量报告</Link>
                <Link href="/explore/" className="btn btn-primary">浏览全部数据</Link>
              </div>
            </div>
            <h2 className="text-lg font-semibold mt-8">按地区查看</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {REGIONS.map((r) => <Link key={r.code} href={`/regions/${SLUG[r.code]}/`} className="chip hover:border-accent-2">{r.name}</Link>)}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
