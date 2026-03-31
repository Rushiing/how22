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

      return {
        title: titleFromPage(page),
        lastEdited: page.last_edited_time,
        markdown: mdRes.markdown,
        truncated: mdRes.truncated,
      };
    } catch {
      return null;
    }
  },
);
