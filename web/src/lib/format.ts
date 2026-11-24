// Number formatting helpers shared by server and client components.

export function fmt(v: number | undefined | null, decimals = 0): string {
  if (v === undefined || v === null || Number.isNaN(v)) return "—";
  return v.toLocaleString("zh-CN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Human-friendly value with unit, e.g. 12780 万人 → "1.28 亿人" when large. */
export function fmtUnit(v: number | undefined | null, unit: string, decimals = 0): string {
  if (v === undefined || v === null || Number.isNaN(v)) return "—";
  if (unit === "万人" && Math.abs(v) >= 10000) return `${fmt(v / 10000, 2)} 亿人`;
  if (unit === "亿元" && Math.abs(v) >= 10000) return `${fmt(v / 10000, 2)} 万亿元`;
  if (unit === "人" && Math.abs(v) >= 10000) return `${fmt(v / 10000, 1)} 万人`;
  const u = unit === "%" || unit === "‰" ? unit : ` ${unit}`;
  return `${fmt(v, decimals)}${u}`;
}

export function pctChange(a: number, b: number): number {
  return ((b - a) / Math.abs(a)) * 100;
}

/** Change label: percentage points for rates, % for levels. */
export function changeLabel(prev: number, cur: number, unit: string): string {
  if (unit === "%" ) {
    const d = cur - prev;
    return `${d >= 0 ? "+" : ""}${d.toFixed(2)} 个百分点`;
  }
  if (unit === "‰") {
    const d = cur - prev;
    return `${d >= 0 ? "+" : ""}${d.toFixed(2)} 个千分点`;
  }
  const p = pctChange(prev, cur);
  return `${p >= 0 ? "+" : ""}${p.toFixed(1)}%`;
}

// Sequential palette (light → dark teal-blue), colour-blind safe, 5 classes.
export const SEQ = ["#e6f2f1", "#b7dbd8", "#7cbcc0", "#3f93a3", "#1c5f7a"];
export const NA_COLOR = "#e5e7eb";

/** Quantile breaks for n classes. Returns thresholds (length n-1). */
export function quantileBreaks(values: number[], n = 5): number[] {
  const s = values.slice().sort((a, b) => a - b);
  const out: number[] = [];
  for (let i = 1; i < n; i++) {
    const pos = (s.length - 1) * (i / n);
    const lo = Math.floor(pos), hi = Math.ceil(pos);
    out.push(s[lo] + (s[hi] - s[lo]) * (pos - lo));
  }
  return out;
}
export function classOf(v: number, breaks: number[]): number {
  let i = 0;
  while (i < breaks.length && v > breaks[i]) i++;
  return i;
}
