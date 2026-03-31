"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ResourceItem } from "@/types/resource";

type Props = {
  items: ResourceItem[];
};

export function ResourceExplorer({ items }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.searchText.includes(q));
  }, [items, query]);

  return (
    <div className="w-full">
      <div className="mb-10 sm:mb-14">
        <label htmlFor="site-search" className="sr-only">
          搜索全站内容
        </label>
        <input
          id="site-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索…"
          autoComplete="off"
          className="w-full border-0 border-b border-zinc-300 bg-transparent py-2.5 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-0 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-zinc-300"
        />
        {query.trim() && (
          <p className="mt-2 text-xs text-zinc-500">
            {filtered.length === 0
              ? "无匹配内容"
              : `共 ${filtered.length} 条`}
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">暂无文章，请在 Notion 数据库中添加条目。</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">没有符合「{query.trim()}」的文章。</p>
      ) : (
        <ul className="grid list-none grid-cols-1 items-start gap-4 md:grid-cols-3">
          {filtered.map((item) => (
            <li key={item.id} className="min-w-0">
              <Link
                href={`/p/${item.id}`}
                className="block rounded-lg border border-zinc-200/90 bg-zinc-50/50 p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/60"
              >
                <h2 className="text-[15px] font-medium leading-snug tracking-tight text-zinc-900 dark:text-zinc-100">
                  {item.title}
                </h2>
                {item.excerpt ? (
                  <p className="mt-2 break-words text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {item.excerpt}
                  </p>
                ) : null}
                <time
                  dateTime={item.lastEdited}
                  className="mt-3 block text-[11px] tabular-nums tracking-wide text-zinc-400"
                >
                  {item.lastEdited.slice(0, 10)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
