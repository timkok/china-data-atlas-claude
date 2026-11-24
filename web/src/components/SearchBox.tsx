"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchItem } from "@/lib/search";

export default function SearchBox({ index, compact = false }: { index: SearchItem[]; compact?: boolean }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return index.filter((i) => i.kw.includes(s) || i.label.includes(q.trim())).slice(0, 8);
  }, [q, index]);

  function go(item?: SearchItem) {
    const it = item ?? results[active];
    if (it) { router.push(it.href); setOpen(false); setQ(""); ref.current?.blur(); }
  }

  return (
    <div className="relative" role="combobox" aria-expanded={open && results.length > 0} aria-haspopup="listbox">
      <label className="sr-only" htmlFor={compact ? "q-compact" : "q-main"}>搜索指标或地区</label>
      <input
        ref={ref}
        id={compact ? "q-compact" : "q-main"}
        type="search"
        value={q}
        placeholder={compact ? "搜索指标/地区" : "搜索指标或地区，例如：人口、GDP、广东、浙江…"}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === "Enter") { e.preventDefault(); go(); }
          if (e.key === "Escape") setOpen(false);
        }}
        aria-controls="search-results"
        className={`w-full rounded-lg border border-line bg-white ${compact ? "px-3 py-1.5 text-sm" : "px-4 py-3 text-base shadow-sm"} focus:border-accent-2 outline-none`}
      />
      {open && results.length > 0 && (
        <ul id="search-results" role="listbox" className="absolute z-40 mt-1 w-full min-w-64 right-0 card shadow-lg overflow-hidden">
          {results.map((r, i) => (
            <li key={r.href} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); go(r); }}
                className={`w-full text-left px-3 py-2 text-sm ${i === active ? "bg-accent-soft" : ""}`}
              >
                <div className="font-medium">{r.label}</div>
                <div className="text-xs text-muted">{r.sub}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && q.trim() && results.length === 0 && (
        <div className="absolute z-40 mt-1 w-full card p-3 text-sm text-muted">没有找到匹配的指标或地区。本站目前收录12个指标、31个省级行政区。</div>
      )}
    </div>
  );
}
