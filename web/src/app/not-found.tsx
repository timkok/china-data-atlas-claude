import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold">页面不存在</h1>
      <p className="mt-3 text-ink-2">你访问的指标或页面不存在。本站目前收录 12 个指标和 31 个省级行政区。</p>
      <Link href="/indicators/" className="btn btn-primary mt-6">查看全部指标</Link>
    </div>
  );
}
