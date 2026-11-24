"use client";
import { useMemo, useState } from "react";
import EChart from "./EChart";
import { fmt } from "@/lib/format";

type Ind = { id: string; name: string; unit: string; decimals: number; years: number[] };
type Row = [string, string, number, number]; // indicator, region, year, value

/** V0.5 preview: two-indicator scatter for one year, with correlation (descriptive only). */
export default function CrossExplorer({ indicators, obs, regions }: { indicators: Ind[]; obs: Row[]; regions: { code: string; name: string }[] }) {
  const [xi, setXi] = useState("gdp-per-capita");
  const [yi, setYi] = useState("aged-65-share");
  const X = indicators.find((i) => i.id === xi)!, Y = indicators.find((i) => i.id === yi)!;
  const common = X.years.filter((y) => Y.years.includes(y));
  const [year, setYear] = useState(common[common.length - 1]);
  const yr = common.includes(year) ? year : common[common.length - 1];

  const pts = useMemo(() => {
    const m = new Map<string, number>();
    for (const [ind, r, y, v] of obs) if (y === yr && ind === yi) m.set(r, v);
    const out: { c: string; name: string; x: number; y: number }[] = [];
    for (const [ind, r, y, v] of obs)
      if (y === yr && ind === xi && r !== "100000" && m.has(r)) out.push({ c: r, name: regions.find((g) => g.code === r)?.name ?? r, x: v, y: m.get(r)! });
    return out;
  }, [obs, xi, yi, yr, regions]);

  const r = useMemo(() => {
    const n = pts.length; if (n < 3) return undefined;
    const mx = pts.reduce((s, p) => s + p.x, 0) / n, my = pts.reduce((s, p) => s + p.y, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (const p of pts) { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; syy += (p.y - my) ** 2; }
    return sxy / Math.sqrt(sxx * syy);
  }, [pts]);

  const option = useMemo(() => ({
    grid: { left: 70, right: 30, top: 20, bottom: 50 },
    tooltip: { trigger: "item", formatter: (p: { data: { name: string; value: [number, number] } }) => `${p.data.name}<br/>${X.name}: ${fmt(p.data.value[0], X.decimals)} ${X.unit}<br/>${Y.name}: ${fmt(p.data.value[1], Y.decimals)} ${Y.unit}` },
    xAxis: { type: "value", scale: true, name: `${X.name}（${X.unit}）`, nameLocation: "middle", nameGap: 30, splitLine: { lineStyle: { color: "#eef1f3" } } },
    yAxis: { type: "value", scale: true, name: `${Y.name}（${Y.unit}）`, nameLocation: "middle", nameGap: 50, splitLine: { lineStyle: { color: "#eef1f3" } } },
    series: [{ type: "scatter", symbolSize: 12, itemStyle: { color: "rgba(28,95,122,0.75)" },
      label: { show: true, position: "right", formatter: (p: { data: { name: string } }) => p.data.name, fontSize: 10, color: "#3b4a57" },
      data: pts.map((p) => ({ name: p.name, value: [p.x, p.y] })) }],
  }), [pts, X, Y]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-sm"><span className="block text-xs text-muted mb-1">横轴指标</span>
          <select data-testid="x-ind" value={xi} onChange={(e) => setXi(e.target.value)} className="border border-line rounded-md px-2 py-1.5 bg-white">
            {indicators.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
        <label className="text-sm"><span className="block text-xs text-muted mb-1">纵轴指标</span>
          <select data-testid="y-ind" value={yi} onChange={(e) => setYi(e.target.value)} className="border border-line rounded-md px-2 py-1.5 bg-white">
            {indicators.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
        <label className="text-sm"><span className="block text-xs text-muted mb-1">年份（两指标共有）</span>
          <select value={yr} onChange={(e) => setYear(Number(e.target.value))} className="border border-line rounded-md px-2 py-1.5 bg-white num">
            {common.slice().reverse().map((y) => <option key={y}>{y}</option>)}</select></label>
      </div>
      {common.length === 0 ? <p className="mt-4 text-sm text-muted">两个指标没有共同年份。</p> : (
        <>
          <EChart option={option} height={460} ariaLabel={`${X.name}与${Y.name}散点图`} exportName={`scatter-${xi}-vs-${yi}-${yr}`} />
          <p className="text-sm text-ink-2 mt-2" data-testid="corr">
            {yr}年 {pts.length} 个省份，皮尔逊相关系数 r = <span className="num font-semibold">{r?.toFixed(2) ?? "—"}</span>。
            <span className="text-muted">相关系数只描述两组数值的线性共变程度（统计相关），不代表因果关系；省份为加总单位，存在生态学谬误风险。</span>
          </p>
        </>
      )}
    </div>
  );
}
