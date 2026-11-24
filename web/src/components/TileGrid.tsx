"use client";
import { useMemo, useState } from "react";
import { SEQ, NA_COLOR, quantileBreaks, classOf, fmt } from "@/lib/format";

// Schematic tile positions [col,row]. NOT a map: tiles do not represent boundaries,
// area or exact location (see methodology: map compliance).
export const TILE_POS: Record<string, [number, number]> = {
  "230000": [7, 0], "220000": [7, 1], "150000": [3, 2], "110000": [4, 2], "120000": [5, 2], "210000": [6, 2],
  "650000": [0, 3], "620000": [1, 3], "640000": [2, 3], "140000": [3, 3], "130000": [4, 3], "370000": [5, 3],
  "540000": [0, 4], "630000": [1, 4], "610000": [2, 4], "410000": [3, 4], "320000": [4, 4], "310000": [5, 4],
  "510000": [1, 5], "500000": [2, 5], "420000": [3, 5], "340000": [4, 5], "330000": [5, 5],
  "530000": [1, 6], "520000": [2, 6], "430000": [3, 6], "360000": [4, 6], "350000": [5, 6],
  "450000": [2, 7], "440000": [3, 7], "460000": [3, 8],
};

type Props = {
  regions: { code: string; name: string }[];
  values: Record<string, number | undefined>;
  decimals: number; unit: string; year: number;
  selected: string[]; onToggle: (code: string) => void;
};

export default function TileGrid({ regions, values, decimals, unit, year, selected, onToggle }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const vals = Object.values(values).filter((v): v is number => v !== undefined);
  const breaks = useMemo(() => (vals.length ? quantileBreaks(vals, 5) : []), [vals]);
  const min = Math.min(...vals), max = Math.max(...vals);
  const S = 54, G = 4;
  const W = 8 * (S + G), H = 9 * (S + G);
  const h = hover ? regions.find((r) => r.code === hover) : null;

  return (
    <div>
      <div className="relative">
        <div aria-live="polite" className="text-sm rounded-lg bg-paper border border-line px-3 py-1.5 mb-2 min-h-[2.6rem] flex flex-wrap items-baseline gap-x-3">
          {h ? (
            <>
              <span className="font-semibold">{h.name} · {year}</span>
              <span className="num">{values[h.code] === undefined ? "无数据" : `${fmt(values[h.code], decimals)} ${unit}`}</span>
              <span className="text-xs text-muted">点击方格加入/移出对比</span>
            </>
          ) : (
            <span className="text-xs text-muted self-center">悬停或聚焦方格查看数值，点击选择省份进行对比</span>
          )}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[460px] mx-auto block" role="group" aria-label={`${year}年各省级行政区数值方格图`}>
          {regions.map((r) => {
            const [c, row] = TILE_POS[r.code];
            const v = values[r.code];
            const fill = v === undefined ? NA_COLOR : SEQ[classOf(v, breaks)];
            const dark = v !== undefined && classOf(v, breaks) >= 3;
            const sel = selected.includes(r.code);
            return (
              <g key={r.code} transform={`translate(${c * (S + G)},${row * (S + G)})`}
                 role="button" tabIndex={0}
                 aria-label={`${r.name}：${v === undefined ? "无数据" : fmt(v, decimals) + unit}${sel ? "（已选中）" : ""}`}
                 aria-pressed={sel}
                 onClick={() => onToggle(r.code)}
                 onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(r.code); } }}
                 onMouseEnter={() => setHover(r.code)} onMouseLeave={() => setHover(null)}
                 onFocus={() => setHover(r.code)} onBlur={() => setHover(null)}
                 style={{ cursor: "pointer" }} data-testid={`tile-${r.code}`}>
                <rect width={S} height={S} rx={7} fill={fill}
                      stroke={sel ? "#13202b" : hover === r.code ? "#3b4a57" : "#fff"} strokeWidth={sel ? 3 : 1.5} />
                {v === undefined && <rect width={S} height={S} rx={7} fill="url(#hatch)" />}
                <text x={S / 2} y={22} textAnchor="middle" fontSize={13} fontWeight={600} fill={dark ? "#fff" : "#13202b"}>{r.name}</text>
                <text x={S / 2} y={40} textAnchor="middle" fontSize={10.5} fill={dark ? "#e6f2f1" : "#3b4a57"} className="num">
                  {v === undefined ? "无数据" : compact(v, decimals)}
                </text>
              </g>
            );
          })}
          <defs>
            <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#cbd5e1" strokeWidth="2" />
            </pattern>
          </defs>
        </svg>
      </div>
      {vals.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2" aria-label="图例：五分位分级">
          <span className="text-muted">五分位分级（{unit}）</span>
          {SEQ.map((c, i) => {
            const lo = i === 0 ? min : breaks[i - 1];
            const hi = i === SEQ.length - 1 ? max : breaks[i];
            return (
              <span key={c} className="inline-flex items-center gap-1">
                <span className="inline-block w-4 h-3 rounded-sm" style={{ background: c }} />
                <span className="num">{compact(lo, decimals)}–{compact(hi, decimals)}</span>
              </span>
            );
          })}
          <span className="inline-flex items-center gap-1"><span className="inline-block w-4 h-3 rounded-sm hatch" />无数据</span>
        </div>
      )}
    </div>
  );
}

function compact(v: number, d: number) {
  if (Math.abs(v) >= 100000) return `${fmt(v / 10000, 1)}万`;
  return fmt(v, Math.abs(v) >= 1000 ? 0 : d);
}
