"use client";
import { useEffect, useMemo, useState } from "react";
import EChart from "./EChart";
import TileGrid from "./TileGrid";
import DataExplorer from "./DataExplorer";
import { fmt, changeLabel } from "@/lib/format";
import type { Indicator } from "@/lib/data";

type Row = [string, number, number, string]; // region, year, value, status
type Props = {
  indicator: Indicator; obs: Row[];
  regions: { code: string; name: string; en: string }[];
  groups: { geo7: Record<string, string[]>; nbs4: Record<string, string[]> };
};

const LINE_COLORS = ["#1c5f7a", "#c2410c", "#7c3aed", "#15803d", "#be185d", "#0369a1", "#a16207", "#4b5563"];
const NAT = "100000";

export default function IndicatorDashboard({ indicator: ind, obs, regions, groups }: Props) {
  const years = ind.years;
  const latest = years[years.length - 1];
  const [year, setYear] = useState(latest);
  const [selected, setSelected] = useState<string[]>([]);
  const [groupSet, setGroupSet] = useState<"geo7" | "nbs4">("geo7");
  const [filterGroup, setFilterGroup] = useState<string>("全部");
  const [copied, setCopied] = useState(false);

  const nameOf = useMemo(() => Object.fromEntries([[NAT, "全国"], ...regions.map((r) => [r.code, r.name])]), [regions]);
  const V = useMemo(() => {
    const m = new Map<string, number>();
    for (const [r, y, v] of obs) m.set(`${r}|${y}`, v);
    return m;
  }, [obs]);
  const get = (r: string, y: number) => V.get(`${r}|${y}`);

  // default selection = highest, median, lowest province in latest year; or from share URL
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const y = Number(p.get("year"));
    if (y && years.includes(y)) setYear(y);
    const rs = (p.get("regions") || "").split(",").filter((c) => nameOf[c] && c !== NAT);
    if (rs.length) { setSelected(rs.slice(0, 8)); return; }
    const ranked = regions.map((r) => ({ c: r.code, v: get(r.code, latest) })).filter((x) => x.v !== undefined)
      .sort((a, b) => b.v! - a.v!);
    if (ranked.length >= 3) setSelected([ranked[0].c, ranked[Math.floor(ranked.length / 2)].c, ranked[ranked.length - 1].c]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (c: string) =>
    setSelected((s) => (s.includes(c) ? s.filter((x) => x !== c) : s.length >= 8 ? s : [...s, c]));

  const yearVals: Record<string, number | undefined> = Object.fromEntries(regions.map((r) => [r.code, get(r.code, year)]));
  const natVal = get(NAT, year);
  const unitShort = ind.unit;

  // ---------------- ranking ----------------
  const inGroup = (c: string) => filterGroup === "全部" || groups[groupSet][filterGroup]?.includes(c);
  const prevYear = years.includes(year - 1) ? year - 1 : undefined;
  const comparablePrev = prevYear !== undefined && !ind.breaks.some((b) => b.year === year);
  const rankAll = regions.map((r) => ({ code: r.code, name: r.name, v: get(r.code, year) }))
    .filter((x) => x.v !== undefined).sort((a, b) => b.v! - a.v!).map((x, i) => ({ ...x, rank: i + 1 }));
  const prevRank: Record<string, number> = {};
  if (prevYear !== undefined) {
    regions.map((r) => ({ c: r.code, v: get(r.code, prevYear) })).filter((x) => x.v !== undefined)
      .sort((a, b) => b.v! - a.v!).forEach((x, i) => (prevRank[x.c] = i + 1));
  }
  const rankShown = rankAll.filter((x) => inGroup(x.code));
  const missingThisYear = regions.filter((r) => get(r.code, year) === undefined);

  const rankOption = useMemo(() => ({
    grid: { left: 64, right: 70, top: 10, bottom: 24 },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: (v: number) => `${fmt(v, ind.decimals)} ${unitShort}` },
    xAxis: { type: "value", splitLine: { lineStyle: { color: "#eef1f3" } }, axisLabel: { color: "#6b7a87" } },
    yAxis: { type: "category", inverse: true, data: rankShown.map((x) => `${x.rank}. ${x.name}`), axisTick: { show: false },
             axisLine: { show: false }, axisLabel: { color: "#13202b", fontSize: 12 } },
    series: [{
      type: "bar", barMaxWidth: 16,
      data: rankShown.map((x) => ({ value: x.v, itemStyle: { color: selected.includes(x.code) ? "#c2410c" : "#3f93a3", borderRadius: [0, 3, 3, 0] } })),
      label: { show: true, position: "right", fontSize: 11, color: "#3b4a57", formatter: (p: { value: number }) => fmt(p.value, ind.decimals) },
      markLine: natVal !== undefined ? {
        symbol: "none", lineStyle: { color: "#13202b", type: "dashed" },
        label: { formatter: `全国 ${fmt(natVal, ind.decimals)}`, color: "#13202b", fontSize: 11 },
        data: [{ xAxis: natVal }],
      } : undefined,
    }],
  }), [rankShown, selected, natVal, ind.decimals, unitShort]);

  // ---------------- trend ----------------
  const trendSeries = [...(ind.no_national ? [] : [NAT]), ...selected];
  const trendOption = useMemo(() => {
    const allYears: number[] = [];
    for (let y = years[0]; y <= years[years.length - 1]; y++) allYears.push(y);
    const missing = allYears.filter((y) => !years.includes(y));
    return {
      grid: { left: 64, right: 24, top: 40, bottom: 56 },
      legend: { top: 0, type: "scroll", textStyle: { fontSize: 12 } },
      tooltip: { trigger: "axis", valueFormatter: (v: number | null) => (v === null || v === undefined ? "无数据" : `${fmt(v, ind.decimals)} ${unitShort}`) },
      xAxis: { type: "category", data: allYears.map(String), boundaryGap: false, axisLabel: { color: "#6b7a87" } },
      yAxis: { type: "value", scale: true, splitLine: { lineStyle: { color: "#eef1f3" } }, axisLabel: { color: "#6b7a87" }, name: unitShort, nameTextStyle: { color: "#6b7a87" } },
      dataZoom: allYears.length > 12 ? [{ type: "slider", height: 18, bottom: 8 }] : [],
      series: trendSeries.map((c, i) => ({
        name: nameOf[c], type: "line", connectNulls: false, symbolSize: 5,
        lineStyle: { width: c === NAT ? 3 : 2, type: c === NAT ? "solid" : "solid" },
        itemStyle: { color: c === NAT ? "#13202b" : LINE_COLORS[i % LINE_COLORS.length] },
        data: allYears.map((y) => get(c, y) ?? null),
        ...(i === 0 ? {
          markLine: ind.breaks.length ? {
            symbol: "none", silent: true, lineStyle: { color: "#a15c07", type: "dashed" },
            label: { formatter: (p: { name: string }) => p.name, color: "#a15c07", fontSize: 10, position: "insideEndTop" },
            data: ind.breaks.map((b) => ({ xAxis: String(b.year), name: `${b.year} 口径/来源变化` })),
          } : undefined,
          markArea: missing.length ? {
            silent: true, itemStyle: { color: "rgba(229,231,235,0.6)" },
            label: { color: "#6b7a87", fontSize: 10, formatter: "缺失" },
            data: missing.map((y) => [{ xAxis: String(y - 1 >= years[0] ? y : y) }, { xAxis: String(y) }]),
          } : undefined,
        } : {}),
      })),
    };
  }, [trendSeries, years, ind, nameOf, unitShort]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------- regional groups ----------------
  const groupDefs = groups[groupSet];
  const groupStats = Object.entries(groupDefs).map(([g, codes]) => {
    const vs = codes.map((c) => ({ c, v: get(c, year) })).filter((x) => x.v !== undefined) as { c: string; v: number }[];
    const sorted = vs.map((x) => x.v).sort((a, b) => a - b);
    const median = sorted.length ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) : undefined;
    return { g, vs, median, min: sorted[0], max: sorted[sorted.length - 1], sum: vs.reduce((s, x) => s + x.v, 0), n: vs.length, total: codes.length };
  });
  const groupOption = useMemo(() => ({
    grid: { left: 56, right: 24, top: 16, bottom: 30 },
    tooltip: { trigger: "item", formatter: (p: { data: { name: string; value: [number, string] } }) => `${p.data.name}<br/>${fmt(p.data.value[0], ind.decimals)} ${unitShort}` },
    xAxis: { type: "value", scale: true, splitLine: { lineStyle: { color: "#eef1f3" } }, axisLabel: { color: "#6b7a87" } },
    yAxis: { type: "category", data: groupStats.map((s) => s.g), inverse: true, axisTick: { show: false } },
    series: [
      { type: "scatter", symbolSize: 11, itemStyle: { color: "rgba(63,147,163,0.75)" },
        data: groupStats.flatMap((s) => s.vs.map((x) => ({ name: nameOf[x.c], value: [x.v, s.g], itemStyle: selected.includes(x.c) ? { color: "#c2410c" } : undefined }))) },
      { type: "scatter", symbol: "rect", symbolSize: [4, 22], itemStyle: { color: "#13202b" },
        data: groupStats.filter((s) => s.median !== undefined).map((s) => ({ name: `${s.g} 中位数（未加权）`, value: [s.median, s.g] })) },
    ],
  }), [groupStats, selected, nameOf, ind.decimals, unitShort]);

  function shareLink() {
    const u = new URL(window.location.href);
    u.search = `?year=${year}&regions=${selected.join(",")}`;
    navigator.clipboard?.writeText(u.toString());
    window.history.replaceState(null, "", u.toString());
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-10">
      {/* controls */}
      <div className="card p-3 sm:p-4 flex flex-wrap items-center gap-3 sticky top-[57px] md:top-14 z-20 shadow-sm">
        <label className="text-sm flex items-center gap-2">
          <span className="text-muted">年份</span>
          <select data-testid="year-select" value={year} onChange={(e) => setYear(Number(e.target.value))} className="border border-line rounded-md px-2 py-1 bg-white num">
            {years.slice().reverse().map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <input aria-label="年份滑块" type="range" min={0} max={years.length - 1} value={years.indexOf(year)}
               onChange={(e) => setYear(years[Number(e.target.value)])} className="w-32 sm:w-48 accent-[#1c5f7a]" />
        <span className="text-sm text-ink-2" data-testid="selected-summary">
          已选 {selected.length} 个省份{selected.length ? "：" + selected.map((c) => nameOf[c]).join("、") : ""}
        </span>
        <div className="ml-auto flex gap-2">
          {selected.length > 0 && <button className="btn" onClick={() => setSelected([])}>清空选择</button>}
          <button className="btn" onClick={shareLink} data-testid="share">{copied ? "已复制链接" : "分享当前视图"}</button>
        </div>
      </div>

      {/* B + D: tile grid & ranking */}
      <section aria-labelledby="sec-dist" className="grid lg:grid-cols-2 gap-6">
        <div className="card p-4 sm:p-5">
          <h2 id="sec-dist" className="text-lg font-semibold">地区分布 · {year}</h2>
          <p className="text-xs text-muted mt-1 mb-3">示意方格图：每个方格代表一个省级行政区，位置仅为大致示意，不表示行政边界、面积或精确地理位置。本站暂不提供地理地图（原因见<a className="underline" href="/methodology/#map">方法说明</a>）。</p>
          <TileGrid regions={regions} values={yearVals} decimals={ind.decimals} unit={unitShort} year={year} selected={selected} onToggle={toggle} />
          {missingThisYear.length > 0 && (
            <p className="mt-3 text-xs text-warn" data-testid="missing-note">{year}年缺少 {missingThisYear.length} 个地区的数据：{missingThisYear.map((r) => r.name).join("、")}</p>
          )}
        </div>
        <div className="card p-4 sm:p-5" aria-labelledby="sec-rank">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <h2 id="sec-rank" className="text-lg font-semibold">省级排名 · {year}</h2>
            <label className="text-sm flex items-center gap-1.5">
              <span className="text-muted">筛选</span>
              <select data-testid="rank-filter" value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} className="border border-line rounded-md px-2 py-1 bg-white">
                <option value="全部">全部31个</option>
                {Object.keys(groups[groupSet]).map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
          </div>
          <p className="text-xs text-muted mt-1">按数值从高到低排列，虚线为全国值{ind.no_national ? "（本指标不提供全国值）" : ""}。橙色为已选省份。</p>
          {rankShown.length ? (
            <EChart option={rankOption} height={Math.max(220, rankShown.length * 21 + 40)} ariaLabel={`${ind.name}${year}年省级排名条形图`} exportName={`${ind.id}-ranking-${year}`} />
          ) : <EmptyState year={year} reason={ind.missing_years[String(year)]} />}
        </div>
      </section>

      {/* rank table with change */}
      {rankShown.length > 0 && (
        <section aria-labelledby="sec-ranktable" className="card p-4 sm:p-5">
          <h2 id="sec-ranktable" className="text-lg font-semibold">排名变化</h2>
          <p className="text-xs text-muted mt-1">
            {comparablePrev ? `与${prevYear}年相比的位次变化（▲上升 ▼下降）。` : prevYear ? `${year}年存在口径或来源变化，不计算与上年的位次与数值变化。` : "无上一年数据，不计算变化。"}
          </p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm num" data-testid="rank-table">
              <thead className="text-left text-muted border-b border-line">
                <tr><th className="py-1.5 pr-2">位次</th><th className="pr-2">地区</th><th className="pr-2 text-right">{year}（{unitShort}）</th>
                  {comparablePrev && <><th className="pr-2 text-right">{prevYear}</th><th className="pr-2 text-right">变化</th><th className="text-right">位次变化</th></>}
                </tr>
              </thead>
              <tbody>
                {rankShown.map((x) => {
                  const pv = prevYear !== undefined ? get(x.code, prevYear) : undefined;
                  const dr = prevRank[x.code] ? prevRank[x.code] - x.rank : 0;
                  return (
                    <tr key={x.code} className="border-b border-line/60">
                      <td className="py-1.5 pr-2">{x.rank}</td>
                      <td className="pr-2"><a className="hover:underline" href={`/regions/${slugOf(x.code)}/`}>{x.name}</a></td>
                      <td className="pr-2 text-right">{fmt(x.v, ind.decimals)}</td>
                      {comparablePrev && <>
                        <td className="pr-2 text-right text-ink-2">{fmt(pv, ind.decimals)}</td>
                        <td className="pr-2 text-right text-ink-2">{pv !== undefined ? changeLabel(pv, x.v!, ind.unit) : "—"}</td>
                        <td className={`text-right ${dr > 0 ? "text-green-700" : dr < 0 ? "text-red" : "text-muted"}`}>{dr > 0 ? `▲${dr}` : dr < 0 ? `▼${-dr}` : "—"}</td>
                      </>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* C: trend */}
      <section aria-labelledby="sec-trend" className="card p-4 sm:p-5">
        <h2 id="sec-trend" className="text-lg font-semibold">历史趋势</h2>
        <p className="text-xs text-muted mt-1">{ind.no_national ? "本指标无可比全国值，仅显示所选省份。" : "黑色粗线为全国。"}点击下方地区或上方方格添加对比（最多8个）。断开的线段表示该年无数据（不做插值）；橙色虚线标注口径或来源变化年份。</p>
        <div className="flex flex-wrap gap-1.5 mt-3" role="group" aria-label="选择对比省份">
          {regions.map((r) => (
            <button key={r.code} type="button" className="chip" aria-pressed={selected.includes(r.code)} onClick={() => toggle(r.code)} data-testid={`chip-${r.code}`}>{r.name}</button>
          ))}
        </div>
        <div className="mt-3">
          <EChart option={trendOption} height={380} ariaLabel={`${ind.name}历史趋势折线图`} exportName={`${ind.id}-trend`} />
        </div>
        {ind.breaks.length > 0 && (
          <ul className="mt-2 text-xs text-warn space-y-0.5">
            {ind.breaks.map((b) => <li key={b.year}>⚑ {b.year}：{b.note}</li>)}
          </ul>
        )}
        {Object.keys(ind.missing_years).length > 0 && (
          <ul className="mt-1 text-xs text-muted">{Object.entries(ind.missing_years).map(([y, r]) => <li key={y}>□ {y}年缺失：{r}</li>)}</ul>
        )}
      </section>

      {/* E: regional comparison */}
      <section aria-labelledby="sec-groups" className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="sec-groups" className="text-lg font-semibold">区域比较 · {year}</h2>
          <div className="flex gap-1.5" role="group" aria-label="分组方式">
            <button className="chip" aria-pressed={groupSet === "geo7"} onClick={() => { setGroupSet("geo7"); setFilterGroup("全部"); }}>七大地理分区</button>
            <button className="chip" aria-pressed={groupSet === "nbs4"} onClick={() => { setGroupSet("nbs4"); setFilterGroup("全部"); }}>东中西部和东北</button>
          </div>
        </div>
        <p className="text-xs text-muted mt-1">
          {groupSet === "geo7" ? "七大地理分区为常用地理划分（非国家统计局统计分组）：华北、东北、华东、华中、华南、西南、西北，成员见下表。" : "国家统计局东部、中部、西部和东北地区划分。"}
          每个点为一个省份，黑色竖线为组内省份中位数（未按人口加权，不等于该区域整体水平）。
        </p>
        <EChart option={groupOption} height={groupStats.length * 46 + 50} ariaLabel={`${ind.name}按区域分组的省份分布图`} exportName={`${ind.id}-regions-${year}`} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm num mt-2">
            <thead className="text-left text-muted border-b border-line">
              <tr><th className="py-1.5 pr-2">区域</th><th className="pr-2">成员</th><th className="pr-2 text-right">最低</th><th className="pr-2 text-right">中位数</th><th className="pr-2 text-right">最高</th>{ind.additive && <th className="text-right">合计</th>}</tr>
            </thead>
            <tbody>
              {groupStats.map((s) => (
                <tr key={s.g} className="border-b border-line/60 align-top">
                  <td className="py-1.5 pr-2 font-medium whitespace-nowrap">{s.g}</td>
                  <td className="pr-2 text-ink-2 text-xs">{groupDefs[s.g].map((c) => nameOf[c]).join("、")}{s.n < s.total ? `（${s.total - s.n}个无数据）` : ""}</td>
                  <td className="pr-2 text-right">{fmt(s.min, ind.decimals)}</td>
                  <td className="pr-2 text-right">{fmt(s.median, ind.decimals)}</td>
                  <td className="pr-2 text-right">{fmt(s.max, ind.decimals)}</td>
                  {ind.additive && <td className="text-right">{s.n === s.total ? fmt(s.sum, 0) : "—"}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* F: explorer */}
      <section aria-labelledby="sec-explorer" className="card p-4 sm:p-5">
        <h2 id="sec-explorer" className="text-lg font-semibold">数据浏览与下载</h2>
        <DataExplorer indicator={ind} obs={obs} regions={regions} />
      </section>
    </div>
  );
}

function EmptyState({ year, reason }: { year: number; reason?: string }) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted" data-testid="empty-state">
      <div className="font-medium text-ink-2">{year}年暂无数据</div>
      <div className="mt-1">{reason ?? "官方来源未提供该年度的分地区数据。"}本站不做插补或估算。</div>
    </div>
  );
}

const SLUGS: Record<string, string> = {
  "110000": "beijing", "120000": "tianjin", "130000": "hebei", "140000": "shanxi", "150000": "inner-mongolia",
  "210000": "liaoning", "220000": "jilin", "230000": "heilongjiang", "310000": "shanghai", "320000": "jiangsu",
  "330000": "zhejiang", "340000": "anhui", "350000": "fujian", "360000": "jiangxi", "370000": "shandong",
  "410000": "henan", "420000": "hubei", "430000": "hunan", "440000": "guangdong", "450000": "guangxi",
  "460000": "hainan", "500000": "chongqing", "510000": "sichuan", "520000": "guizhou", "530000": "yunnan",
  "540000": "xizang", "610000": "shaanxi", "620000": "gansu", "630000": "qinghai", "640000": "ningxia", "650000": "xinjiang",
};
export const slugOf = (c: string) => SLUGS[c];
