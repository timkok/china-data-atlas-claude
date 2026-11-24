import type { Metadata } from "next";
import Link from "next/link";
import { GENERATED } from "@/lib/data";

export const metadata: Metadata = {
  title: "关于",
  description: "关于中国数据地图：定位、原则、路线图与引用方式。",
  alternates: { canonical: "/about/" },
};

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 prose-cn">
      <h1 className="text-3xl font-semibold">关于中国数据地图</h1>
      <p><strong>Make China&apos;s Data Accessible, Understandable, Traceable and Explorable.</strong></p>
      <p>中国数据地图是一个独立的非官方项目，把国家统计局公开发布、但分散在多年统计年鉴中的分省数据，整理成可以查询、比较、可视化、引用和下载的数据产品。</p>
      <h2 className="text-xl font-semibold mt-6">原则</h2>
      <ul>
        <li><strong>只用官方数据</strong>：每个数值都可追溯到具体年鉴版本、表格、原始文件和单元格位置。</li>
        <li><strong>不编造、不插补</strong>：取不到可靠数据就显示缺失并说明原因。</li>
        <li><strong>口径透明</strong>：普查修订、统计范围变化、初步核算等在图表和数据中明确标注。</li>
        <li><strong>描述而非评判</strong>：排名只表示数值大小；本站陈述只描述数据，不做因果推断。</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6">路线图</h2>
      <ul>
        <li><strong>V0.1（当前）</strong>：12个分省指标、指标详情页、排名、趋势、区域比较、数据浏览与CSV下载、方法与质量报告。</li>
        <li><strong>V0.5</strong>：跨指标探索（已提供散点图预览）、增长率计算、更多导出与分享；补充各省统计公报人工导入的指标（社会消费品零售总额等）；卫生健康统计年鉴指标。</li>
        <li><strong>V1.0</strong>：AI 研究助手——只从已校验数据层取数，显示年份与来源，给出派生指标公式，区分事实、计算、相关与推论。需要付费 API，当前未启用。</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6">版权与许可</h2>
      <p>原始统计数据由国家统计局发布，版权归原发布机构所有。本站整理的数据集（CSV）以 CC BY 4.0 提供，使用时请注明原始来源（国家统计局《中国统计年鉴》）及本站。本站与国家统计局无隶属关系。</p>
      <p>数据版本：{GENERATED}。发现错误？请对照 CSV 中的 source_url 与 source_cell 核对原表，并通过项目仓库提交问题。参见 <Link href="/methodology/" className="underline">方法说明</Link>。</p>
    </div>
  );
}
