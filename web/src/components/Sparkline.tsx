// Tiny inline SVG trend (server-rendered, no JS). Gaps (missing years) break the line.
export default function Sparkline({ data, w = 120, h = 40 }: { data: [number, number][]; w?: number; h?: number }) {
  if (data.length < 2) return null;
  const xs = data.map((d) => d[0]), ys = data.map((d) => d[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const X = (x: number) => ((x - x0) / (x1 - x0 || 1)) * (w - 4) + 2;
  const Y = (y: number) => h - 2 - ((y - y0) / (y1 - y0 || 1)) * (h - 4);
  const sorted = data.slice().sort((a, b) => a[0] - b[0]);
  let d = "";
  sorted.forEach(([x, y], i) => {
    const gap = i > 0 && x - sorted[i - 1][0] > 1;
    d += `${i === 0 || gap ? "M" : "L"}${X(x).toFixed(1)},${Y(y).toFixed(1)}`;
  });
  const last = sorted[sorted.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="shrink-0">
      <path d={d} fill="none" stroke="#3f93a3" strokeWidth={1.8} />
      <circle cx={X(last[0])} cy={Y(last[1])} r={2.8} fill="#1c5f7a" />
    </svg>
  );
}
