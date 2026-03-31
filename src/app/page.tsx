import { ResourceExplorer } from "@/components/ResourceExplorer";
import { getResources } from "@/lib/resources";

/** 运行时从 Notion 拉取，避免构建时写死空状态 */
export const dynamic = "force-dynamic";

export default async function Home() {
  const result = await getResources();

  return (
    <div className="flex min-h-full flex-col">
      <header className="shrink-0">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-2 sm:px-6 sm:pt-14">
          <span className="text-[13px] font-medium tracking-tight text-zinc-800 dark:text-zinc-200">
            How22
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        {result.status === "not_configured" && (
          <p className="mb-10 max-w-md text-sm leading-relaxed text-zinc-500">
            配置{" "}
            <code className="rounded bg-zinc-100 px-1 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              .env.local
            </code>{" "}
            中的 <span className="font-mono text-xs">NOTION_TOKEN</span> 与{" "}
            <span className="font-mono text-xs">NOTION_DATABASE_ID</span>
            ，并将数据库连接至集成。
          </p>
        )}

        {result.status === "error" && (
          <p className="mb-10 text-sm text-red-600 dark:text-red-400">
            {result.message}
          </p>
        )}

        {result.status === "ok" && <ResourceExplorer items={result.items} />}
      </main>
    </div>
  );
}
