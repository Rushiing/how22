"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ResourceItem } from "@/types/resource";

type Props = {
  items: ResourceItem[];
};

function isEndingSoon(dateStr: string): boolean {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return false;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 7;
}

export function ResourceExplorer({ items }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visibleItems = items.filter((item) => item.visible !== false);
    if (!q) return visibleItems;
    return visibleItems.filter((item) => item.searchText.includes(q));
  }, [items, query]);

  const { codingPlan, tokens, latestDeals } = useMemo(() => {
    const agi = filtered.filter((item) => item.section === "AGI大神推荐");
    const codingPlanItems = agi.filter((item) => item.recommendType === "Coding Plan");
    const tokenItems = agi.filter((item) => item.recommendType === "Tokens");
    // 分区三态：AGI大神推荐 / 最新优惠信息 / 空。空分区归入“最新优惠信息”。
    const latest = filtered.filter((item) => item.section !== "AGI大神推荐");

    const byWeightAndDate = (a: ResourceItem, b: ResourceItem) => {
      const w = b.pinWeight - a.pinWeight;
      if (w !== 0) return w;
      return b.lastEdited.localeCompare(a.lastEdited);
    };

    const byDealDate = (a: ResourceItem, b: ResourceItem) => {
      const ad = a.promoEndAt || a.lastEdited;
      const bd = b.promoEndAt || b.lastEdited;
      return bd.localeCompare(ad);
    };

    return {
      codingPlan: [...codingPlanItems].sort(byWeightAndDate),
      tokens: [...tokenItems].sort(byWeightAndDate),
      latestDeals: [...latest].sort(byDealDate),
    };
  }, [filtered]);

  const renderCards = (list: ResourceItem[]) => (
    <ul className="list-none columns-1 gap-3 md:columns-3">
      {list.map((item) => {
        const showEndingSoon = !item.badgeText && isEndingSoon(item.promoEndAt);
        const hasBadge = Boolean(item.badgeText) || showEndingSoon;
        return (
        <li key={item.id} className="relative mb-3 break-inside-avoid min-w-0">
          {item.badgeText ? (
            <div className="pointer-events-none absolute right-3 top-3 z-20">
              <span className="block rounded-full border border-white/20 bg-gradient-to-r from-slate-600 to-slate-500 px-2.5 py-1 text-[10px] font-semibold leading-none tracking-wide text-white shadow-[0_6px_14px_rgba(15,23,42,0.35)]">
                {item.badgeText}
              </span>
            </div>
          ) : showEndingSoon ? (
            <div className="pointer-events-none absolute right-3 top-3 z-20">
              <span className="block rounded-full border border-amber-200/40 bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 py-1 text-[10px] font-semibold leading-none tracking-wide text-white shadow-[0_6px_14px_rgba(180,83,9,0.3)]">
                即将结束
              </span>
            </div>
          ) : null}
          <Link
            href={`/p/${item.id}`}
            className="relative block overflow-visible rounded-lg border border-zinc-200/90 bg-zinc-50/50 p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.12),0_10px_28px_rgba(0,0,0,0.10)] transition-colors hover:border-zinc-300 hover:bg-zinc-100/80 hover:shadow-[0_2px_5px_rgba(0,0,0,0.14),0_14px_30px_rgba(0,0,0,0.16)] dark:border-zinc-800 dark:bg-zinc-900/30 dark:shadow-[0_1px_2px_rgba(0,0,0,0.45),0_14px_32px_rgba(0,0,0,0.48)] dark:hover:border-zinc-700 dark:hover:bg-zinc-900/60 dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.5),0_18px_36px_rgba(0,0,0,0.58)]"
          >
            <h2
              className={`text-[15px] font-medium leading-snug tracking-tight text-zinc-900 dark:text-zinc-100 ${
                hasBadge ? "pr-16" : ""
              }`}
            >
              {item.title}
            </h2>
            {item.excerpt ? (
              <p className="mt-1.5 break-words text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                {item.excerpt}
              </p>
            ) : null}
            <time
              dateTime={item.lastEdited}
              className="mt-2 block text-[11px] tabular-nums tracking-wide text-zinc-400"
            >
              {item.lastEdited.slice(0, 10)}
            </time>
          </Link>
        </li>
      )})}
    </ul>
  );

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
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              AGI大神推荐
            </h2>

            <div className="space-y-5">
              <div>
                <h3 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Coding Plan 推荐
                </h3>
                {codingPlan.length ? (
                  renderCards(codingPlan)
                ) : (
                  <p className="text-sm text-zinc-500">暂无 Coding Plan 推荐。</p>
                )}
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Tokens 推荐
                </h3>
                {tokens.length ? (
                  renderCards(tokens)
                ) : (
                  <p className="text-sm text-zinc-500">暂无 Tokens 推荐。</p>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              最新优惠信息
            </h2>
            {latestDeals.length ? (
              renderCards(latestDeals)
            ) : (
              <p className="text-sm text-zinc-500">暂无最新优惠信息。</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
