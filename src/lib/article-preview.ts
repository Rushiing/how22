import type { PageObjectResponse, RichTextItemResponse } from "@notionhq/client";
import { titleFromPage } from "@/lib/notion";

function plainFromRichText(items: RichTextItemResponse[]): string {
  return items.map((t) => t.plain_text).join("");
}

const EXCERPT_MAX = 120;

/** 汇总属性中的纯文本，用于摘要与站内搜索（不含页面正文块，仅数据库属性） */
export function buildArticlePreview(page: PageObjectResponse): {
  title: string;
  excerpt: string;
  searchText: string;
} {
  const title = titleFromPage(page);
  const chunks: string[] = [title];
  let excerpt = "";

  for (const prop of Object.values(page.properties)) {
    switch (prop.type) {
      case "rich_text": {
        const t = plainFromRichText(prop.rich_text).trim();
        if (t) {
          chunks.push(t);
          if (!excerpt) excerpt = t.length > EXCERPT_MAX ? `${t.slice(0, EXCERPT_MAX)}…` : t;
        }
        break;
      }
      case "select":
        if (prop.select?.name) chunks.push(prop.select.name);
        break;
      case "multi_select":
        chunks.push(prop.multi_select.map((s) => s.name).join(" "));
        break;
      case "url":
        if (prop.url) chunks.push(prop.url);
        break;
      case "email":
        if (prop.email) chunks.push(prop.email);
        break;
      case "phone_number":
        if (prop.phone_number) chunks.push(prop.phone_number);
        break;
      case "number":
        if (prop.number !== null && prop.number !== undefined)
          chunks.push(String(prop.number));
        break;
      case "status":
        if (prop.status?.name) chunks.push(prop.status.name);
        break;
      case "date":
        if (prop.date?.start) chunks.push(prop.date.start);
        if (prop.date?.end) chunks.push(prop.date.end);
        break;
      case "checkbox":
        chunks.push(prop.checkbox ? "是" : "否");
        break;
      default:
        break;
    }
  }

  const searchText = chunks.join(" ").toLowerCase().replace(/\s+/g, " ").trim();
  return { title, excerpt, searchText };
}
