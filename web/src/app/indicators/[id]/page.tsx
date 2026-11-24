import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import IndicatorDashboard from "@/components/IndicatorDashboard";
import { INDICATORS, REGIONS, GROUPS, getIndicator, clientPayload, categoryName, GENERATED } from "@/lib/data";
import { summary, findings } from "@/lib/insights";
import { fmt, fmtUnit, changeLabel } from "@/lib/format";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return INDICATORS.map((i) => ({ id: i.id }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const ind = getIndicator(id);
  if (!ind) return {};
  const s = summary(id);
  const lead = s.nat !== undefined ? `${s.y}年全国${ind.name}为${fmtUnit(s.nat, ind.unit, ind.decimals)}。` : `${s.y}年${s.top ? `${REGIONS.find((r) => r.code === s.top.region)?.name}最高` : ""}。`;
  const title = `${ind.name}（分省，${ind.years[0]}–${s.y}）`;
  const description = `${lead}中国31个省级行政区${ind.name}数据：排名、历史趋势、区域比较与CSV下载。数据来自国家统计局《中国统计年鉴》，每个数值可追溯至原始表格。`;
  return {
    title, description,
    alternates: { canonical: `/indicators/${id}/` },
    openGraph: { title: `${title} | ${SITE.name}`, description, type: "article", url: `/indicators/${id}/` },
  };
}

export default async function IndicatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ind = getIndicator(id);
  if (!ind) notFound();
  const s = summary(id);
  const f = findings(id);
  const payload = clientPayload(id);
  const related = INDICATORS.filter((i) => i.id !== id && i.category === ind.category).concat(
    INDICATORS.filter((i) => i.category !== ind.category).slice(0, 2));
  const yearsTxt = `${ind.years[0]}–${s.y}`;
  const citation = `国家统计局.《中国统计年鉴》（${ind.sources.map((x) => x.publication.replace("中国统计年鉴", "")).filter((v, i, a) => a.indexOf(v) === i).sort()[0]}–${s.y + 1}年版）. 中国数据地图（China Data Atlas）整理：${ind.name}，分省，${yearsTxt}年. ${SITE.url}/indicators/${id}/ （数据版本 ${GENERATED}）`;
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Dataset",
    name: `${ind.name}（中国分省，${yearsTxt}）`, alternateName: ind.name_en,
    description: `${ind.definition} ${ind.caliber}`,
    url: `${SITE.url}/indicators/${id}/`, temporalCoverage: `${ind.years[0]}/${s.y}`,
    spatialCoverage: "中国大陆31个省级行政区", license: "https://creativecommons.org/licenses/by/4.0/",
    creator: { "@type": "Organization", name: "国家统计局 National Bureau of Statistics of China", url: "https://www.stats.gov.cn/" },
    distribution: [{ "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${SITE.url}/data/${id}.csv` }],
    variableMeasured: { "@type": "PropertyValue", name: ind.name, unitText: ind.unit },
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* A. Summary */}
      <header className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <nav aria-label="面包屑" className="text-xs text-muted">
            <Link href="/">首页</Link> / <Link href="/indicators/">指标</Link> / <Link href={`/categories/${ind.category}/`}>{categoryName(ind.category)}</Link>
          </nav>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{ind.name}</h1>
            <span className="text-muted">{ind.name_en}</span>
          </div>
          <p className="mt-2 text-ink-2 max-w-3xl">{ind.definition}</p>
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label={ind.no_national ? `${s.y}年 · 最高省份` : `${s.y}年 · 全国`} testid="stat-latest"
                  value={ind.no_national ? (s.top ? fmtUnit(s.top.value, ind.unit, ind.decimals) : "—") : fmtUnit(s.nat, ind.unit, ind.decimals)}
                  sub={ind.no_national ? `${REGIONS.find((r) => r.code === s.top?.region)?.name ?? ""}（各省之和≠全国，不显示全国值）` : `状态：${ind.status}`} />
            <Stat label="同比变化" value={!ind.no_national && s.comparable && s.natPrev !== undefined && s.nat !== undefined ? changeLabel(s.natPrev, s.nat, ind.unit) : "—"}
                  sub={ind.no_national ? "无全国值" : s.comparable ? `与${s.prev}年相比` : s.prev ? `${s.y}年口径变化，不计算` : "上一年无数据"} />
            <Stat label="地区差距" value={s.top && s.bottom ? `${fmt(s.bottom.value, ind.decimals)} – ${fmt(s.top.value, ind.decimals)}` : "—"}
                  sub={`${ind.unit}，最低至最高（${s.rk.length}个省份）`} />
            <Stat label="数据覆盖" value={`${yearsTxt}`} sub={`${ind.n_obs.toLocaleString()} 个数据点 · ${ind.sources.length} 张官方表格`} />
          </div>
          {f.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-ink-2">关键发现</h2>
              <ul className="mt-2 space-y-1.5 text-[15px]" data-testid="findings">
                {f.map((x) => <li key={x} className="flex gap-2"><span className="text-accent-2">●</span><span>{x}</span></li>)}
              </ul>
              <p className="mt-2 text-xs text-muted">以上陈述由程序根据已校验数据按规则生成，仅描述数值，不含因果解释。</p>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <IndicatorDashboard indicator={payload.indicator} obs={payload.obs} regions={REGIONS.map((r) => ({ code: r.code, name: r.name, en: r.en }))} groups={GROUPS} />

        {/* G. Methodology */}
        <section aria-labelledby="sec-method" className="mt-10 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-5 prose-cn">
            <h2 id="sec-method" className="text-lg font-semibold">方法与口径</h2>
            <h3>指标定义</h3>
            <p>{ind.definition}</p>
            {ind.formula && (<><h3>计算公式</h3><p className="font-mono text-sm bg-accent-soft rounded p-2">{ind.formula}</p></>)}
            <h3>口径说明与已知局限</h3>
            <p>{ind.caliber}</p>
            {ind.breaks.length > 0 && <ul>{ind.breaks.map((b) => <li key={b.year}>{b.year}年：{b.note}</li>)}</ul>}
            <h3>数据处理</h3>
            <ul>
              <li>每年数值取自国家统计局《中国统计年鉴》对应版本中的分地区表格；同一年度在多个版本中出现时，采用最新版本（即最新修订值），并在数据文件 revision_note 字段中保留较早版本的数值。</li>
              <li>2021年版年鉴提供官方Excel文件，直接读取；其余版本仅以表格图像发布，采用两次独立OCR、仅接受完全一致的读数，不一致的单元格由人工对照原图逐格核对（共核对 {Object.entries(ind.methods).filter(([k]) => k === "manual_review").reduce((a, [, v]) => a + v, 0)} 个），并经下方质量检查。</li>
              <li>不做插值、平滑或估算；缺失年份保持缺失。</li>
              <li>取数方法统计：{Object.entries(ind.methods).map(([k, v]) => `${({ xls: "Excel直读", ocr_consensus: "双重OCR一致", ocr_crossref: "OCR+跨版本核验", manual_review: "人工核对" } as Record<string, string>)[k] ?? k} ${v}`).join("；")}。</li>
            </ul>
            <h3>修订说明</h3>
            <p>国家统计局会根据人口普查、经济普查等对历史数据进行修订。本站以最新版本年鉴为准；{ind.status === "初步" ? "该指标在年鉴中标注为初步核算数，后续可能修订。" : "历史版本数值见CSV文件。"}</p>
          </div>
          <aside className="card p-5 text-sm space-y-4">
            <div>
              <h2 className="font-semibold">数据来源</h2>
              <p className="mt-1 text-ink-2">国家统计局《中国统计年鉴》（中国统计出版社）。原始表格（{ind.sources.length}）：</p>
              <ul className="mt-2 space-y-1 max-h-64 overflow-auto pr-1" data-testid="source-links">
                {ind.sources.map((x) => (
                  <li key={x.url}><a href={x.url} target="_blank" rel="noopener noreferrer" className="underline decoration-line hover:decoration-accent">{x.publication} · {x.table}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-semibold">推荐引用</h2>
              <p className="mt-1 text-ink-2 text-xs leading-relaxed bg-paper border border-line rounded p-2 select-all" data-testid="citation">{citation}</p>
            </div>
            <div>
              <h2 className="font-semibold">下载</h2>
              <ul className="mt-1 space-y-1">
                <li><a className="underline" href={`/data/${id}.csv`} download>{id}.csv</a>（UTF-8，含完整出处字段）</li>
                <li><a className="underline" href="/data/data_dictionary.csv" download>数据字典 data_dictionary.csv</a></li>
              </ul>
            </div>
          </aside>
        </section>

        <section aria-labelledby="sec-related" className="mt-10">
          <h2 id="sec-related" className="text-lg font-semibold">相关指标</h2>
          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {related.slice(0, 4).map((r) => (
              <Link key={r.id} href={`/indicators/${r.id}/`} className="card p-4 hover:border-accent-2">
                <div className="text-xs text-muted">{categoryName(r.category)}</div>
                <div className="font-medium mt-0.5">{r.name}</div>
                <div className="text-xs text-muted mt-1">{r.years[0]}–{r.years[r.years.length - 1]} · {r.unit}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}

function Stat({ label, value, sub, testid }: { label: string; value: string; sub?: string; testid?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-xl sm:text-2xl font-semibold mt-1 num" data-testid={testid}>{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
}
