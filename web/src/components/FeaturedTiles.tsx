"use client";
import { useState } from "react";
import Link from "next/link";
import TileGrid from "./TileGrid";
import { fmt } from "@/lib/format";

type Item = { id: string; name: string; unit: string; decimals: number; year: number; values: Record<string, number>; national?: number };

/** Homepage feature: switchable tile grid for a few headline indicators. */
export default function FeaturedTiles({ items, regions }: { items: Item[]; regions: { code: string; name: string }[] }) {
  const [i, setI] = useState(0);
  const [sel, setSel] = useState<string[]>([]);
  const it = items[i];
  return (
    <div className="grid md:grid-cols-[1fr_1.1fr] gap-6 items-center">
      <div>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="选择指标">
          {items.map((x, k) => (
            <button key={x.id} role="tab" aria-selected={k === i} className="chip" aria-pressed={k === i} onClick={() => { setI(k); setSel([]); }}>{x.name}</button>
          ))}
        </div>
        <h3 className="mt-5 text-2xl font-semibold">{it.name}<span className="text-muted text-base font-normal"> · {it.year}年</span></h3>
        {it.national !== undefined && <p className="mt-1 text-ink-2">全国：<span className="num font-semibold">{fmt(it.national, it.decimals)}</span> {it.unit}</p>}
        <p className="mt-3 text-sm text-ink-2 leading-relaxed">颜色越深数值越高（五分位分级）。悬停查看各省数值，点击可选中比较。</p>
        {sel.length > 0 && (
          <ul className="mt-3 text-sm space-y-1">
            {sel.map((c) => <li key={c} className="num">{regions.find((r) => r.code === c)?.name}：{fmt(it.values[c], it.decimals)} {it.unit}</li>)}
          </ul>
        )}
        <Link href={`/indicators/${it.id}/`} className="btn btn-primary mt-5">查看{it.name}完整数据 →</Link>
      </div>
      <TileGrid regions={regions} values={it.values} decimals={it.decimals} unit={it.unit} year={it.year} selected={sel}
                onToggle={(c) => setSel((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c].slice(-4)))} />
    </div>
  );
}
