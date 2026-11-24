export const SITE = {
  name: "中国数据地图",
  name_en: "China Data Atlas",
  // Overridden at build time on Vercel with the deployment URL.
  url: process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  description:
    "中国数据地图（China Data Atlas）：把国家统计局《中国统计年鉴》中的分省统计数据整理为可查询、可比较、可视化、可引用和可下载的数据产品。人口、经济、教育、医疗等指标，每个数值都可追溯到官方原表。",
};
