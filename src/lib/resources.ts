import type { DatabaseObjectResponse } from "@notionhq/client";
import type { ResourcesResult, ResourceItem } from "@/types/resource";
import {
  createNotionClient,
  filterFullPagesFromDataSourceQuery,
} from "@/lib/notion";
import { buildArticlePreview } from "@/lib/article-preview";
import { isNotionConfigured } from "@/lib/env";

function isFullDatabase(db: unknown): db is DatabaseObjectResponse {
  return (
    typeof db === "object" &&
    db !== null &&
    "data_sources" in db &&
    Array.isArray((db as DatabaseObjectResponse).data_sources) &&
    (db as DatabaseObjectResponse).data_sources.length > 0
  );
}

export async function getResources(): Promise<ResourcesResult> {
  if (!isNotionConfigured()) {
    return { status: "not_configured", items: [] };
  }

  const databaseId = process.env.NOTION_DATABASE_ID!.trim();

  try {
    const notion = createNotionClient();

    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });

    if (!isFullDatabase(database)) {
      return {
        status: "error",
        items: [],
        message:
          "无法读取数据库的数据源信息。请确认 NOTION_DATABASE_ID 为数据库 ID，且集成已被邀请访问该库。",
      };
    }

    const dataSourceId = database.data_sources[0].id;

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 50,
      result_type: "page",
    });

    const pages = filterFullPagesFromDataSourceQuery(response.results);
    const items: ResourceItem[] = pages.map((page) => {
      const preview = buildArticlePreview(page);
      return {
        id: page.id,
        title: preview.title,
        excerpt: preview.excerpt,
        searchText: preview.searchText,
        notionUrl: page.url,
        lastEdited: page.last_edited_time,
      };
    });

    return { status: "ok", items };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "从 Notion 拉取数据时发生未知错误";
    return { status: "error", items: [], message };
  }
}
