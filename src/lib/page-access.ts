import { cache } from "react";
import type { PageObjectResponse } from "@notionhq/client";
import { createNotionClient, titleFromPage } from "@/lib/notion";
import { isNotionConfigured } from "@/lib/env";

function normalizeId(id: string): string {
  return id.replace(/-/g, "").toLowerCase();
}

export function parentMatchesDatabase(
  parent: PageObjectResponse["parent"],
  databaseId: string,
): boolean {
  const want = normalizeId(databaseId);
  if (parent.type === "database_id") {
    return normalizeId(parent.database_id) === want;
  }
  if (parent.type === "data_source_id") {
    return normalizeId(parent.database_id) === want;
  }
  return false;
}

export type VerifiedArticle = {
  title: string;
  lastEdited: string;
  markdown: string;
  truncated: boolean;
};

type NotionBlock = {
  type: string;
  has_children?: boolean;
  [key: string]: unknown;
};

type NotionProp = {
  type: string;
  [key: string]: unknown;
};

function richTextToPlain(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) =>
      typeof item === "object" && item !== null && "plain_text" in item
        ? String((item as { plain_text: unknown }).plain_text ?? "")
        : "",
    )
    .join("")
    .trim();
}

function blockToMarkdownLine(block: NotionBlock): string {
  const payload =
    typeof block[block.type] === "object" && block[block.type] !== null
      ? (block[block.type] as Record<string, unknown>)
      : null;
  const text = payload ? richTextToPlain(payload.rich_text) : "";

  switch (block.type) {
    case "heading_1":
      return text ? `# ${text}` : "";
    case "heading_2":
      return text ? `## ${text}` : "";
    case "heading_3":
      return text ? `### ${text}` : "";
    case "bulleted_list_item":
      return text ? `- ${text}` : "";
    case "numbered_list_item":
      return text ? `1. ${text}` : "";
    case "to_do": {
      const checked = payload?.checked === true ? "x" : " ";
      return text ? `- [${checked}] ${text}` : "";
    }
    case "quote":
      return text ? `> ${text}` : "";
    case "code":
      return text ? `\`\`\`\n${text}\n\`\`\`` : "";
    case "callout":
      return text ? `> ${text}` : "";
    case "paragraph":
      return text;
    case "divider":
      return "---";
    default:
      return text;
  }
}

async function buildMarkdownFromBlocks(pageId: string): Promise<string> {
  const notion = createNotionClient();
  const lines: string[] = [];
  let cursor: string | undefined;
  let guard = 0;

  while (guard < 20) {
    const res = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const b of res.results) {
      if (!("type" in b) || typeof b.type !== "string") continue;
      const line = blockToMarkdownLine(b as NotionBlock);
      if (line) lines.push(line);
    }

    if (!res.has_more || !res.next_cursor) break;
    cursor = res.next_cursor;
    guard += 1;
  }

  return lines.join("\n\n").trim();
}

function propText(prop: NotionProp): string {
  switch (prop.type) {
    case "rich_text":
      return richTextToPlain(prop.rich_text);
    case "select":
      return typeof prop.select === "object" && prop.select && "name" in prop.select
        ? String((prop.select as { name?: unknown }).name ?? "")
        : "";
    case "multi_select":
      return Array.isArray(prop.multi_select)
        ? prop.multi_select
            .map((it) =>
              typeof it === "object" && it && "name" in it
                ? String((it as { name?: unknown }).name ?? "")
                : "",
            )
            .filter(Boolean)
            .join(" / ")
        : "";
    case "status":
      return typeof prop.status === "object" && prop.status && "name" in prop.status
        ? String((prop.status as { name?: unknown }).name ?? "")
        : "";
    case "url":
      return typeof prop.url === "string" ? prop.url : "";
    case "email":
      return typeof prop.email === "string" ? prop.email : "";
    case "phone_number":
      return typeof prop.phone_number === "string" ? prop.phone_number : "";
    case "number":
      return typeof prop.number === "number" ? String(prop.number) : "";
    case "date": {
      if (typeof prop.date !== "object" || !prop.date) return "";
      const start = "start" in prop.date ? String((prop.date as { start?: unknown }).start ?? "") : "";
      const end = "end" in prop.date ? String((prop.date as { end?: unknown }).end ?? "") : "";
      return [start, end].filter(Boolean).join(" ~ ");
    }
    case "checkbox":
      return prop.checkbox === true ? "是" : prop.checkbox === false ? "否" : "";
    default:
      return "";
  }
}

function buildMarkdownFromProperties(page: PageObjectResponse): string {
  const lines: string[] = [];
  const preferredKeys = ["厂商", "摘要", "链接", "优惠结束时间"] as const;

  for (const key of preferredKeys) {
    const raw = page.properties[key];
    if (!raw) continue;
    const prop = raw as NotionProp;
    const text = propText(prop).trim();
    if (!text) continue;
    lines.push(`### ${key}\n\n${text}`);
  }
  return lines.join("\n\n").trim();
}

/** 仅允许「当前配置的 Notion 数据库」中的条目在站内展示，避免任意 UUID 枚举 */
export const loadArticleIfAllowed = cache(
  async (pageId: string): Promise<VerifiedArticle | null> => {
    if (!isNotionConfigured()) return null;

    const databaseId = process.env.NOTION_DATABASE_ID!.trim();

    try {
      const notion = createNotionClient();
      const page = await notion.pages.retrieve({ page_id: pageId });

      if (!("parent" in page) || !("properties" in page)) {
        return null;
      }

      if (!parentMatchesDatabase(page.parent, databaseId)) {
        return null;
      }

      const mdRes = await notion.pages.retrieveMarkdown({ page_id: pageId });
      let markdown = mdRes.markdown.trim();
      let truncated = mdRes.truncated;

      // 某些数据库条目会返回空 markdown，这里回退到 blocks API 保障详情可见。
      if (!markdown) {
        markdown = await buildMarkdownFromBlocks(pageId);
        truncated = false;
      }

      // 如果正文区块也为空，则展示数据库字段内容，避免详情页空白。
      if (!markdown) {
        markdown = buildMarkdownFromProperties(page);
      }

      return {
        title: titleFromPage(page),
        lastEdited: page.last_edited_time,
        markdown,
        truncated,
      };
    } catch {
      return null;
    }
  },
);
