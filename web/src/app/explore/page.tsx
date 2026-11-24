import type { Metadata } from "next";
import Link from "next/link";
import CrossExplorer from "@/components/CrossExplorer";
import { INDICATORS, OBS, REGIONS, categoryName } from "@/lib/data";

export const metadata: Metadata = {
  title: "数据浏览与下载",
  description: "下载中国数据地图全部分省统计数据（CSV，含完整出处字段），并进行跨指标散点比较。",
  alternates: { canonical: "/explore/" },
};

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold">数据浏览与下载</h1>
      <p className="mt-2 text-ink-2">全部数据以开放格式提供。每一行包含指标、地区代码、年份、数值、状态以及来源年鉴、表格、原始文件链接和单元格位置。</p>

      <section className="mt-8 card p-5" aria-labelledby="h-dl">
        <h2 id="h-dl" className="text-lg font-semibold">下载</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <a className="btn btn-primary" href="/data/china-data-atlas-all.csv" download data-testid="csv-all">全部数据 CSV（{OBS.length.toLocaleString()} 行）</a>
          <a className="btn" href="/data/data_dictionary.csv" download>数据字典 CSV</a>
          <a className="btn" href="/data/quality_report.json" download>质量报告 JSON</a>
        </div>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead className="text-left text-muted border-b border-line"><tr><th className="py-1.5 pr-3">指标</th><th className="pr-3">类别</th><th className="pr-3">单位</th><th className="pr-3">年份</th><th className="pr-3">数据点</th><th>文件</th></tr></thead>
            <tbody>
              {INDICATORS.map((i) => (
                <tr key={i.id} className="border-b border-line/60">
                  <td className="py-1.5 pr-3"><Link className="text-accent hover:underline" href={`/indicators/${i.id}/`}>{i.name}</Link></td>
                  <td className="pr-3 text-ink-2">{categoryName(i.category)}</td>
                  <td className="pr-3">{i.unit}</td>
                  <td className="pr-3 num">{i.years[0]}–{i.years[i.years.length - 1]}</td>
                  <td className="pr-3 num">{i.n_obs}</td>
                  <td><a className="underline" href={`/data/${i.id}.csv`} download>{i.id}.csv</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 card p-5" aria-labelledby="h-cross">
        <h2 id="h-cross" className="text-lg font-semibold">跨指标比较（V0.5 预览）</h2>
        <p className="text-xs text-muted mt-1 mb-3">选择两个指标和年份，查看31个省份的分布关系。图表可导出 PNG/SVG。</p>
        <CrossExplorer
          indicators={INDICATORS.map((i) => ({ id: i.id, name: i.name, unit: i.unit, decimals: i.decimals, years: i.years }))}
          obs={OBS.map((o) => [o.indicator, o.region, o.year, o.value] as [string, string, number, number])}
          regions={REGIONS.map((r) => ({ code: r.code, name: r.name }))} />
      </section>
    </div>
  );
}
