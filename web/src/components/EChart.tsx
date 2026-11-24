"use client";
import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { LineChart, BarChart, ScatterChart } from "echarts/charts";
import {
  GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, MarkAreaComponent, DataZoomComponent, TitleComponent, GraphicComponent,
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import type { EChartsCoreOption } from "echarts/core";

echarts.use([LineChart, BarChart, ScatterChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent,
  MarkAreaComponent, DataZoomComponent, TitleComponent, GraphicComponent, SVGRenderer]);

export const FONT = '"Inter","PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';

/** ECharts wrapper (SVG renderer → crisp, exportable as SVG/PNG). */
export default function EChart({
  option, height = 360, ariaLabel, exportName, onReady,
}: {
  option: EChartsCoreOption; height?: number; ariaLabel: string; exportName?: string;
  onReady?: (c: echarts.ECharts) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!el.current) return;
    const c = echarts.init(el.current, undefined, { renderer: "svg" });
    chart.current = c;
    onReady?.(c);
    const ro = new ResizeObserver(() => c.resize());
    ro.observe(el.current);
    return () => { ro.disconnect(); c.dispose(); chart.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chart.current?.setOption({ textStyle: { fontFamily: FONT }, animationDuration: 300, ...option }, true);
  }, [option]);

  function download(type: "svg" | "png") {
    const c = chart.current;
    if (!c) return;
    const name = `${exportName ?? "chart"}.${type}`;
    if (type === "svg") {
      const url = c.getDataURL({ type: "svg" });
      trigger(url, name);
    } else {
      // rasterise the SVG at 2x for a sharp PNG
      const svgUrl = c.getDataURL({ type: "svg" });
      const img = new Image();
      img.onload = () => {
        const w = el.current!.clientWidth * 2, h = height * 2;
        const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
        const ctx = cv.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        trigger(cv.toDataURL("image/png"), name);
      };
      img.src = svgUrl;
    }
  }

  return (
    <figure className="relative">
      <div ref={el} role="img" aria-label={ariaLabel} style={{ height, width: "100%" }} />
      {exportName && (
        <div className="flex gap-2 justify-end mt-1 text-xs">
          <button type="button" className="btn !text-xs !py-1" onClick={() => download("png")} aria-label="下载PNG图片">PNG</button>
          <button type="button" className="btn !text-xs !py-1" onClick={() => download("svg")} aria-label="下载SVG矢量图">SVG</button>
        </div>
      )}
    </figure>
  );
}

function trigger(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
