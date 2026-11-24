import type { Metadata } from "next";
import { QUALITY, INDICATORS } from "@/lib/data";

export const metadata: Metadata = {
  title: "数据质量报告",
  description: "中国数据地图数据质量门禁结果：硬性检查、软性检查、取数方法分布。",
  alternates: { canonical: "/quality/" },
};

const SOFT: Record<string, string> = {
  yoy_jump: "同比异常波动（已逐项人工核对原表，均为真实数据，如普查/经济普查调整、疫情影响）",
  single_reading_ocr: "仅有单一图像来源的单元格（双重OCR一致，但无其他版本可交叉核验；受恒等式等检查约束）",
  revised_vs_earlier_edition: "最新版本数值与较早版本不同（官方修订，已保留旧值）",
  gdp_components_unverified: "地区生产总值行中三次产业读数存在不一致，未能做“三产之和”校验的行（GDP本身经人均GDP一致性检查）",
  age_groups_unverified: "年龄组读数存在不一致，未能做“年龄组之和”校验的行",
  urban_rural_share_sum: "城镇+乡村比重之和偏离100超过0.015（原表四舍五入所致，仅为校验辅助字段）",
};

export default function Quality() {
  const methods: Record<string, number> = {};
  INDICATORS.forEach((i) => Object.entries(i.methods).forEach(([k, v]) => (methods[k] = (methods[k] ?? 0) + v)));
  const total = Object.values(methods).reduce((a, b) => a + b, 0);
  const label: Record<string, string> = { xls: "官方Excel直读", ocr_consensus: "双重OCR一致", ocr_crossref: "OCR + 跨版本核验", manual_review: "人工对照原图核对" };
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold">数据质量报告</h1>
      <p className="mt-2 text-ink-2">质量门禁状态：<span className={`font-semibold ${QUALITY.passed ? "text-green-700" : "text-red"}`} data-testid="gate-status">{QUALITY.passed ? "通过" : "未通过"}</span> · 检查单元格 {QUALITY.cells.toLocaleString()} 个（含校验辅助字段）</p>
      <section className="mt-8 card p-5">
        <h2 className="text-lg font-semibold">硬性检查（全部通过才允许发布）</h2>
        <ul className="mt-3 grid sm:grid-cols-2 gap-1.5 text-sm">{QUALITY.hard_checks.map((c) => <li key={c}>✅ {c}</li>)}</ul>
      </section>
      <section className="mt-6 card p-5">
        <h2 className="text-lg font-semibold">已发布观测值的取数方法</h2>
        <table className="w-full text-sm mt-3 num">
          <tbody>{Object.entries(methods).map(([k, v]) => (
            <tr key={k} className="border-b border-line/60"><td className="py-1.5">{label[k] ?? k}</td><td className="text-right">{v}</td><td className="text-right text-muted">{((v / total) * 100).toFixed(1)}%</td></tr>
          ))}</tbody>
        </table>
      </section>
      <section className="mt-6 card p-5">
        <h2 className="text-lg font-semibold">软性检查（供审阅，不阻止发布）</h2>
        <table className="w-full text-sm mt-3">
          <tbody>{Object.entries(QUALITY.soft_counts).map(([k, v]) => (
            <tr key={k} className="border-b border-line/60 align-top"><td className="py-1.5 pr-3">{SOFT[k] ?? k}</td><td className="text-right num">{v}</td></tr>
          ))}</tbody>
        </table>
        <p className="text-xs text-muted mt-3">完整明细：<a className="underline" href="/data/quality_report.json">quality_report.json</a>。</p>
      </section>
    </div>
  );
}
