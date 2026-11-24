"use client";
import { useMemo, useState } from "react";
import { fmt } from "@/lib/format";
import type { Indicator } from "@/lib/data";

type Row = [string, number, number, string];
type SortKey = "region" | "year" | "value";

export default function DataExplorer({ indicator: ind, obs, regions }: {
  indicator: Indicator; obs: Row[]; regions: { code: string; name: string; en: string }[];
}) {
  const nameOf: Record<string, string> = useMemo(() => Object.fromEntries([["100000", "全国"], ...regions.map((r) => [r.code, r.name])]), [regions]);
  const years = ind.years;
  const [q, setQ] = useState("");
  const [y0, setY0] = useState(years[0]);
  const [y1, setY1] = useState(years[years.length - 1]);
  const [sort, setSort] = useState<{ k: SortKey; asc: boolean }>({ k: "year", asc: false });
  const [page, setPage] = useState(0);
  const PER = 25;

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const r = obs.filter(([c, y]) => y >= y0 && y <= y1 &&
      (!s || nameOf[c].includes(q.trim()) || c.includes(s) || (regions.find((x) => x.code === c)?.en.toLowerCase().includes(s) ?? false)));
    const dir = sort.asc ? 1 : -1;
    r.sort((a, b) => {
      if (sort.k === "value") return (a[2] - b[2]) * dir;
      if (sort.k === "region") return a[0].localeCompare(b[0]) * dir || b[1] - a[1];
      return (a[1] - b[1]) * dir || a[0].localeCompare(b[0]);
    });
    return r;
  }, [obs, q, y0, y1, sort, nameOf, regions]);

  // missing-value profile: expected = 31 provinces (+ national if provided) × years in range
  const allYears: number[] = [];
  for (let y = years[0]; y <= years[years.length - 1]; y++) allYears.push(y);
  const expectedRegions = ind.no_national ? 31 : 32;
  const missingByYear = allYears.map((y) => ({ y, n: expectedRegions - obs.filter((o) => o[1] === y).length }));
  const totalMissing = missingByYear.reduce((s, m) => s + m.n, 0);

  function downloadFiltered() {
    const head = ["indicator_id", "indicator_name", "unit", "region_code", "region_name", "year", "value", "status"];
    const lines = [head.join(",")].concat(rows.map(([c, y, v, st]) => [ind.id, ind.name, ind.unit, c, nameOf[c], y, v, st].join(",")));
    const blob = new Blob(["﻿" + lines.join("\n") + `\n# 来源：国家统计局《中国统计年鉴》；完整出处字段见 /data/${ind.id}.csv\n`], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `${ind.id}_${y0}-${y1}${q ? "_filtered" : ""}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }
  const th = (k: SortKey, label: string, right = false) => (
    <th className={`py-2 pr-3 ${right ? "text-right" : ""}`} aria-sort={sort.k === k ? (sort.asc ? "ascending" : "descending") : "none"}>
      <button className="hover:text-ink" onClick={() => { setSort((s) => ({ k, asc: s.k === k ? !s.asc : k !== "value" })); setPage(0); }}>
        {label}{sort.k === k ? (sort.asc ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );
  const pages = Math.max(1, Math.ceil(rows.length / PER));

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block text-xs text-muted mb-1">搜索地区</span>
          <input data-testid="explorer-search" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="如：广东 / Guangdong / 440000"
                 className="border border-line rounded-md px-2.5 py-1.5 w-56" />
        </label>
        <label className="text-sm"><span className="block text-xs text-muted mb-1">起始年</span>
          <select value={y0} onChange={(e) => { setY0(Number(e.target.value)); setPage(0); }} className="border border-line rounded-md px-2 py-1.5 bg-white num">
            {years.map((y) => <option key={y}>{y}</option>)}
          </select></label>
        <label className="text-sm"><span className="block text-xs text-muted mb-1">结束年</span>
          <select value={y1} onChange={(e) => { setY1(Number(e.target.value)); setPage(0); }} className="border border-line rounded-md px-2 py-1.5 bg-white num">
            {years.map((y) => <option key={y}>{y}</option>)}
          </select></label>
        <div className="ml-auto flex flex-wrap gap-2">
          <a className="btn btn-primary" href={`/data/${ind.id}.csv`} download data-testid="csv-full">下载完整CSV（含出处）</a>
          <button className="btn" onClick={downloadFiltered} data-testid="csv-filtered">下载当前筛选（{rows.length}行）</button>
        </div>
      </div>

      <div className="overflow-x-auto mt-3">
        <table className="w-full text-sm num" data-testid="explorer-table">
          <thead className="text-left text-muted border-b border-line">
            <tr>{th("region", "地区")}{th("year", "年份")}{th("value", `数值（${ind.unit}）`, true)}<th className="py-2">状态</th></tr>
          </thead>
          <tbody>
            {rows.slice(page * PER, page * PER + PER).map(([c, y, v, st]) => (
              <tr key={`${c}-${y}`} className="border-b border-line/60">
                <td className="py-1.5 pr-3">{nameOf[c]} <span className="text-xs text-muted">{c}</span></td>
                <td className="pr-3">{y}</td>
                <td className="pr-3 text-right">{fmt(v, ind.decimals)}</td>
                <td><span className={`text-xs px-1.5 py-0.5 rounded ${st === "正式" ? "bg-accent-soft text-accent" : "bg-warn-soft text-warn"}`}>{st}</span></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted" data-testid="explorer-empty">没有符合条件的数据</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-2 text-sm">
        <span className="text-muted">共 {rows.length} 行</span>
        <div className="flex gap-2 items-center">
          <button className="btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>上一页</button>
          <span className="num">{page + 1} / {pages}</span>
          <button className="btn" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>下一页</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div>
          <h3 className="font-medium">数据字典</h3>
          <dl className="mt-2 text-sm grid grid-cols-[7rem_1fr] gap-y-1">
            <dt className="text-muted">indicator_id</dt><dd>{ind.id}</dd>
            <dt className="text-muted">region_code</dt><dd>GB/T 2260 行政区划代码（100000 = 全国）</dd>
            <dt className="text-muted">year</dt><dd>统计年度</dd>
            <dt className="text-muted">value</dt><dd>数值，单位 {ind.unit}（{ind.unit_en}）</dd>
            <dt className="text-muted">status</dt><dd>正式 / 初步（初步核算）/ 修订（新版年鉴修订值）/ 派生（本站计算）</dd>
            <dt className="text-muted">source_*</dt><dd>机构、年鉴版本、表名、原始文件URL、单元格位置</dd>
            <dt className="text-muted">method</dt><dd>取数方法（Excel直读 / 双重OCR / 人工核对）</dd>
          </dl>
        </div>
        <div>
          <h3 className="font-medium">缺失值概况</h3>
          <p className="text-sm text-ink-2 mt-2">{allYears[0]}–{allYears[allYears.length - 1]}年应有 {allYears.length * expectedRegions} 个地区·年份数据点，实有 {obs.length} 个，缺失 {totalMissing} 个。</p>
          <div className="flex flex-wrap gap-1 mt-2" aria-label="各年份缺失数">
            {missingByYear.map((m) => (
              <span key={m.y} title={`${m.y}: 缺失${m.n}`} className={`text-[11px] px-1.5 py-0.5 rounded num ${m.n ? "bg-warn-soft text-warn" : "bg-accent-soft text-accent"}`}>{m.y}{m.n ? ` 缺${m.n}` : " ✓"}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
