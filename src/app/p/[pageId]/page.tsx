import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleMarkdown } from "@/components/ArticleMarkdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import { loadArticleIfAllowed } from "@/lib/page-access";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pageId: string }>;
}): Promise<Metadata> {
  const { pageId } = await params;
  const article = await loadArticleIfAllowed(pageId);
  if (!article) return { title: "未找到" };
  return { title: `${article.title} · 薅秃秃` };
}

function mergeTitleIntoMarkdown(title: string, markdown: string): string {
  const t = markdown.trimStart();
  if (/^#\s+/m.test(t)) return markdown;
  return `# ${title}\n\n${markdown}`;
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  const article = await loadArticleIfAllowed(pageId);
  if (!article) notFound();

  const body = mergeTitleIntoMarkdown(article.title, article.markdown);

  return (
    <div className="flex min-h-full flex-col">
      <header className="shrink-0 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="shrink-0 text-[13px] text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-300"
          >
            ← 返回
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight text-zinc-800 sm:text-2xl dark:text-zinc-100"
            >
              薅秃秃
            </Link>
          </div>
        </div>
      </header>

      <article className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <time
          className="mb-8 block text-xs tabular-nums text-zinc-400"
          dateTime={article.lastEdited}
        >
          {article.lastEdited.slice(0, 10)}
        </time>

        {article.truncated ? (
          <p className="mb-6 text-sm text-amber-800 dark:text-amber-200/90">
            正文较长，以下可能仅为片段（受 Notion API 限制）。
          </p>
        ) : null}

        <ArticleMarkdown markdown={body} />
      </article>
    </div>
  );
}
