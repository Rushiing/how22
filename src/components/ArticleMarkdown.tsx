import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  markdown: string;
};

export function ArticleMarkdown({ markdown }: Props) {
  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-headings:font-medium prose-a:underline-offset-4 prose-a:text-zinc-800 dark:prose-a:text-zinc-200">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
