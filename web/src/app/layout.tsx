import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { SITE } from "@/lib/site";
import SearchBox from "@/components/SearchBox";
import { searchIndex } from "@/lib/search";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} | China Data Atlas`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  openGraph: { siteName: SITE.name, locale: "zh_CN", type: "website" },
  alternates: { canonical: "/" },
};
export const viewport: Viewport = { themeColor: "#1c5f7a", width: "device-width", initialScale: 1 };

const NAV = [
  { href: "/indicators/", label: "全部指标" },
  { href: "/regions/", label: "地区" },
  { href: "/explore/", label: "数据浏览" },
  { href: "/methodology/", label: "方法与来源" },
  { href: "/about/", label: "关于" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const idx = searchIndex();
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-2 focus:bg-white">跳到正文</a>
        <header className="border-b border-line bg-white/90 backdrop-blur sticky top-0 z-30">
          <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="中国数据地图 首页">
              <Logo />
              <span className="font-semibold tracking-tight">中国数据地图</span>
              <span className="hidden md:inline text-xs text-muted">China Data Atlas</span>
            </Link>
            <nav aria-label="主导航" className="hidden md:flex items-center gap-1 text-sm ml-2">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="px-2.5 py-1.5 rounded-md text-ink-2 hover:bg-accent-soft hover:text-ink">
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto w-44 sm:w-64"><SearchBox index={idx} compact /></div>
          </div>
          <nav aria-label="主导航（移动端）" className="md:hidden border-t border-line overflow-x-auto">
            <div className="flex gap-1 px-3 py-1.5 text-sm whitespace-nowrap">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="px-2 py-1 rounded text-ink-2">{n.label}</Link>
              ))}
            </div>
          </nav>
        </header>
        <main id="main" className="flex-1">{children}</main>
        <footer className="border-t border-line bg-white mt-16">
          <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 md:grid-cols-4 text-sm text-ink-2">
            <div className="md:col-span-2">
              <div className="font-semibold text-ink flex items-center gap-2"><Logo />中国数据地图 · China Data Atlas</div>
              <p className="mt-2 leading-relaxed">将国家统计局公开发布的统计年鉴数据整理为可查询、可比较、可引用、可下载的数据产品。所有数值均可追溯到官方原始表格。</p>
              <p className="mt-2 text-xs text-muted leading-relaxed">本站为独立的非官方项目，与国家统计局无隶属关系。统计数据版权归原发布机构所有；本站整理的数据以 CC BY 4.0 提供，引用时请同时注明原始来源。数据覆盖中国大陆31个省级行政区；香港特别行政区、澳门特别行政区和台湾省的数据不在所用国家统计局分地区表格范围内，未予收录，这不代表任何地理或归属上的判断。</p>
            </div>
            <div>
              <div className="font-medium text-ink mb-2">浏览</div>
              <ul className="space-y-1.5">
                <li><Link href="/indicators/">全部指标</Link></li>
                <li><Link href="/regions/">31个省级行政区</Link></li>
                <li><Link href="/explore/">数据浏览与下载</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-ink mb-2">可信度</div>
              <ul className="space-y-1.5">
                <li><Link href="/methodology/">方法说明</Link></li>
                <li><Link href="/methodology/#sources">数据来源清单</Link></li>
                <li><Link href="/quality/">数据质量报告</Link></li>
                <li><Link href="/about/">关于与引用</Link></li>
              </ul>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="12" width="4" height="10" rx="1" fill="#7cbcc0" />
      <rect x="8" y="7" width="4" height="15" rx="1" fill="#3f93a3" />
      <rect x="14" y="3" width="4" height="19" rx="1" fill="#1c5f7a" />
      <rect x="20" y="9" width="2" height="13" rx="1" fill="#13202b" />
    </svg>
  );
}
