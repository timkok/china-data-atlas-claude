import type { Metadata } from "next";
import Link from "next/link";
import { INDICATORS, UNAVAILABLE, SOURCE_FILES, QUALITY, GROUPS, regionName } from "@/lib/data";

export const metadata: Metadata = {
  title: "方法说明与数据来源",
  description: "中国数据地图的数据来源、采集与转录方法、质量检查、修订与口径处理、地图合规说明、地区分组定义与引用格式。",
  alternates: { canonical: "/methodology/" },
};

export default function Methodology() {
  const byEd = SOURCE_FILES.reduce<Record<number, number>>((a, f) => ({ ...a, [f.edition]: (a[f.edition] ?? 0) + 1 }), {});
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 prose-cn">
      <h1 className="text-3xl font-semibold">方法说明</h1>
      <p className="text-ink-2">本页说明本站每一个数值从哪里来、如何处理、做过哪些检查，以及已知局限。</p>

      <h2 className="text-xl font-semibold mt-8">1. 数据来源</h2>
      <p>V0.1 的全部统计数值来自<strong>国家统计局编《中国统计年鉴》</strong>（中国统计出版社）2016–2025年版在国家统计局网站公开发布的分地区表格（www.stats.gov.cn/sj/ndsj/）。每个年鉴版本 E 发布 E−1 年的数据；部分“分地区”表为多年度表。</p>
      <ul>
        <li>2021年版：表格提供官方 Excel 文件（.xls），直接读取。</li>
        <li>2016–2020、2022–2025年版：分地区表格仅以图像（.jpg）发布，需要转录（见第2节）。</li>
        <li>国家数据库 data.stats.gov.cn 的查询接口在采集时对自动访问返回 HTTP 403（Web 应用防火墙拦截）。本项目不绕过任何访问控制，因此未使用该接口。</li>
      </ul>
      <p>共使用 {SOURCE_FILES.length} 个原始文件（{Object.entries(byEd).map(([e, n]) => `${e}版 ${n}`).join("，")}），每个文件保存原始字节并记录 SHA-256、URL 和获取日期，清单见下方“来源清单”。</p>

      <h2 className="text-xl font-semibold mt-8">2. 采集与转录</h2>
      <ol className="list-decimal pl-5 space-y-1">
        <li><strong>下载</strong>：顺序、低频请求官方文件，缓存原件，不重复抓取。</li>
        <li><strong>图像表格转录</strong>：对每张表格图像进行两次独立的 OCR（不同缩放与二值化参数），按坐标将数字归入行列；只有两次读数完全一致的单元格才被自动接受。</li>
        <li><strong>跨版本核验</strong>：多年度表在相邻版本年鉴中重复出现，同一单元格的独立读数一致即视为核验通过；不一致时进入人工核对。</li>
        <li><strong>人工核对</strong>：所有不一致或未通过质量检查的单元格，由核对者对照原始图像逐格读取，读数连同原因写入 <code>data/manual/ocr_review.csv</code>（可审计，流水线不会自动覆盖人工核对结果）。</li>
        <li><strong>选取</strong>：同一指标·地区·年度在多个版本中出现时，采用<strong>最新版本</strong>的数值（最新修订），并在数据文件 revision_note 字段中保留较早版本数值；若较早版本精度更高且四舍五入后与最新值一致，保留较高精度。</li>
        <li><strong>派生指标</strong>：仅“65岁及以上人口占比”为本站计算，公式见指标页，分子分母来自同一张表。</li>
      </ol>
      <p>本流程中，OCR 共出现 7→1、5↔6 混淆、小数点或负号丢失等错误类型；这些错误被双重读数比对、跨版本核验或下方恒等式检查捕获并人工更正。详细数字见<Link href="/quality/" className="underline">数据质量报告</Link>。</p>

      <h2 className="text-xl font-semibold mt-8" id="quality">3. 质量门禁</h2>
      <p>发布前自动运行质量检查（{QUALITY.passed ? "当前版本全部通过" : "当前版本未通过"}）。硬性检查（任何一项失败即阻止发布）：</p>
      <ul>{QUALITY.hard_checks.map((c) => <li key={c}>{c}</li>)}</ul>
      <p>“全国合计”与“分省之和”的关系只在指标具有可加性且口径一致时校验（普通本专科在校生数、普通高等学校数）。常住人口的全国数包括现役军人而分省数不包括，GDP 的分省核算与全国核算口径不同，因此这两项不做相等性校验。软性检查（同比异常波动、修订值、单一读数）列入质量报告供审阅。</p>

      <h2 className="text-xl font-semibold mt-8">4. 修订、口径变化与缺失</h2>
      <ul>
        <li><strong>人口普查修订</strong>：第七次全国人口普查后，国家统计局修订了2011–2019年的人口和城镇化率数据。本站2011年起采用修订序列，2010年及以前为修订前版本数值，图表中以“口径/来源变化”标注。</li>
        <li><strong>经济普查修订</strong>：地区生产总值来自次年年鉴的初步核算数，后续经济普查修订未纳入；2019年部分省份数据明显调整。</li>
        <li><strong>统计范围变化</strong>：2021年起高等教育表格包括职业本科。</li>
        <li><strong>缺失</strong>：2021年版年鉴未刊载分地区出生率表，2020年出生率与自然增长率缺失，不插补。所有图表的缺失年份显示为断开的线段或“无数据”。</li>
        <li><strong>行政区划</strong>：2004年以来31个省级行政区未发生调整，地区代码采用 GB/T 2260。</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8" id="map">5. 地图合规说明</h2>
      <p>在中国境内公开展示的中国地图须使用符合国家规定的地图（如自然资源部标准地图服务提供的、带审图号的标准地图），完整、准确表示国界线和领土范围；对标准地图内容进行修改后公开使用的，可能需要重新履行地图审核程序。</p>
      <p>本项目未能确认任何可自由使用的中国省级边界矢量数据既具备审图号、又允许在网页中进行交互式着色而无需重新审核。因此 V0.1 <strong>暂不提供地理地图</strong>，改用：</p>
      <ul>
        <li><strong>示意方格图</strong>：每个省级行政区为一个等大方格，仅示意大致相对位置，不绘制任何边界、海岸线或领土轮廓，不表示面积；</li>
        <li><strong>省级排名条形图</strong>与<strong>区域分组分布图</strong>。</li>
      </ul>
      <p>后续若采用经审核的地图服务或取得审图号的底图，将在本页更新说明。</p>

      <h2 className="text-xl font-semibold mt-8" id="groups">6. 地区分组定义</h2>
      <p><strong>七大地理分区</strong>（常用地理划分，非国家统计局统计分组）：</p>
      <ul>{Object.entries(GROUPS.geo7).map(([g, cs]) => <li key={g}>{g}：{cs.map(regionName).join("、")}</li>)}</ul>
      <p><strong>国家统计局东部、中部、西部和东北地区</strong>：</p>
      <ul>{Object.entries(GROUPS.nbs4).map(([g, cs]) => <li key={g}>{g}：{cs.map(regionName).join("、")}</li>)}</ul>
      <p>区域比较图显示组内各省数值及未加权中位数；中位数不代表区域整体水平。</p>

      <h2 className="text-xl font-semibold mt-8">7. 数据覆盖范围</h2>
      <p>数据覆盖中国大陆31个省级行政区及全国（如原表提供）。香港特别行政区、澳门特别行政区和台湾省的数据不在所用国家统计局分地区表格范围内，因此未予收录；这仅反映数据来源的统计范围，不代表任何地理或归属上的判断。</p>

      <h2 className="text-xl font-semibold mt-8">8. 暂未上线的指标</h2>
      <ul>{UNAVAILABLE.map((u) => <li key={u.name}><strong>{u.name}</strong>：{u.reason}</li>)}</ul>

      <h2 className="text-xl font-semibold mt-8">9. 引用格式</h2>
      <p className="bg-white border border-line rounded p-3 text-sm">国家统计局.《中国统计年鉴》（相应年份版）. 经中国数据地图（China Data Atlas）整理：[指标名称]，分省，[年份范围]. [页面URL]（访问日期）.</p>
      <p>引用具体数值时，建议同时注明 CSV 中的 source_publication 与 source_table 字段。</p>

      <h2 className="text-xl font-semibold mt-8" id="sources">10. 来源清单（{SOURCE_FILES.length} 个文件）</h2>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-xs" data-testid="source-table">
          <thead className="text-left text-muted border-b border-line"><tr><th className="py-1 pr-2">版本</th><th className="pr-2">表格</th><th className="pr-2">文件</th><th className="pr-2">获取日期</th><th>SHA-256（前12位）</th></tr></thead>
          <tbody>
            {SOURCE_FILES.map((f) => (
              <tr key={f.file} className="border-b border-line/60">
                <td className="py-1 pr-2">{f.edition}</td><td className="pr-2">{f.title}</td>
                <td className="pr-2"><a className="underline" href={f.url} target="_blank" rel="noopener noreferrer">{f.file}</a></td>
                <td className="pr-2">{f.retrieved}</td><td className="font-mono">{f.sha256.slice(0, 12)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted mt-4">共 {INDICATORS.length} 个指标使用以上文件。</p>
    </div>
  );
}
