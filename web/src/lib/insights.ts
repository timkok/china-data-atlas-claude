// Factual, rule-based summary statements computed from the validated data.
// No model-generated text: every sentence is a direct readout of the numbers.
import { getIndicator, value, ranking, NATIONAL, latestYear, regionName, Indicator } from "./data";
import { fmt, changeLabel } from "./format";

export function summary(id: string) {
  const ind = getIndicator(id)!;
  const y = latestYear(id);
  const prev = ind.years.includes(y - 1) ? y - 1 : undefined;
  const nat = ind.no_national ? undefined : value(id, NATIONAL.code, y);
  const natPrev = prev !== undefined && !ind.no_national ? value(id, NATIONAL.code, prev) : undefined;
  const comparable = prev !== undefined && !ind.breaks.some((b) => b.year === y);
  const rk = ranking(id, y);
  const top = rk[0], bottom = rk[rk.length - 1];
  const above = nat !== undefined ? rk.filter((r) => r.value > nat).length : undefined;
  const ratio = top && bottom && bottom.value > 0 ? top.value / bottom.value : undefined;
  return { ind, y, prev, nat, natPrev, comparable, rk, top, bottom, above, ratio };
}

/** First year from which the national series is continuous without a caliber break. */
function comparableStart(ind: Indicator, end: number) {
  const bs = ind.breaks.map((b) => b.year).filter((b) => b <= end);
  const start = Math.max(ind.years[0], ...bs);
  // need consecutive years from start..end
  let s = start;
  for (let yy = end; yy >= start; yy--) { if (!ind.years.includes(yy)) { s = yy + 1; break; } }
  return s;
}

export function findings(id: string): string[] {
  const s = summary(id);
  const { ind, y, nat, top, bottom, above, ratio } = s;
  const d = ind.decimals, u = ind.unit;
  const out: string[] = [];
  if (top && bottom) out.push(`${y}年，${regionName(top.region)}最高（${fmt(top.value, d)} ${u}），${regionName(bottom.region)}最低（${fmt(bottom.value, d)} ${u}）${ratio && u !== "‰" && u !== "%" ? `，前者约为后者的 ${ratio.toFixed(1)} 倍` : u === "%" || u === "‰" ? `，相差 ${fmt(top.value - bottom.value, 2)} 个${u === "%" ? "百分点" : "千分点"}` : ""}。`);
  if (nat !== undefined && above !== undefined) out.push(`全国值为 ${fmt(nat, d)} ${u}，31个省级行政区中有 ${above} 个高于全国值。`);
  if (!ind.no_national) {
    const start = comparableStart(ind, y);
    const a = value(id, NATIONAL.code, start), b = value(id, NATIONAL.code, y);
    if (a !== undefined && b !== undefined && start < y) out.push(`${start}–${y}年（口径可比区间），全国值由 ${fmt(a, d)} 变为 ${fmt(b, d)} ${u}（${changeLabel(a, b, u)}）。`);
  } else {
    const start = comparableStart(ind, y);
    const r0 = ranking(id, start), r1 = ranking(id, y);
    if (r0.length && r1.length && start < y) {
      const moved = r1.map((r) => ({ c: r.region, d: (r0.find((x) => x.region === r.region)?.rank ?? r.rank) - r.rank }))
        .sort((a, b) => b.d - a.d);
      if (moved[0].d > 0) out.push(`与${start}年相比，${regionName(moved[0].c)}排名上升最多（${moved[0].d}位）；${regionName(moved[moved.length - 1].c)}下降最多（${-moved[moved.length - 1].d}位）。`);
    }
  }
  if (ind.id === "natural-growth-rate") {
    const neg = s.rk.filter((r) => r.value < 0).length;
    out.push(`${y}年有 ${neg} 个省级行政区人口自然增长率为负（死亡人数多于出生人数）。`);
  }
  return out;
}
