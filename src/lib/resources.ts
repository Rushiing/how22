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

function selectOrStatusName(prop: unknown): string {
  if (!prop || typeof prop !== "object" || !("type" in prop)) return "";
  const p = prop as { type: string; select?: { name?: string } | null; status?: { name?: string } | null };
  if (p.type === "select") return p.select?.name?.trim() ?? "";
  if (p.type === "status") return p.status?.name?.trim() ?? "";
  return "";
}

function normalizeRecommendType(value: string): string {
  const v = value.trim().toLowerCase().replace(/[_-]/g, " ");
  if (!v) return "";
  if (v === "coding plan" || v === "codingplan" || v === "plan") return "Coding Plan";
  if (v === "tokens" || v === "token" || v === "credits") return "Tokens";
  return value.trim();
}

function normalizeSection(value: string): string {
  const v = value.trim().toLowerCase().replace(/\s+/g, "");
  if (!v) return "";
  if (v === "agi大神推荐" || v === "agi推荐" || v === "agi") return "AGI大神推荐";
  if (v === "最新优惠信息" || v === "优惠信息" || v === "优惠" || v === "deals") {
    return "最新优惠信息";
  }
  return value.trim();
}

function checkboxValue(prop: unknown): boolean {
  if (!prop || typeof prop !== "object" || !("type" in prop)) return true;
  const p = prop as { type: string; checkbox?: boolean };
  return p.type === "checkbox" ? Boolean(p.checkbox) : true;
}

function numberValue(prop: unknown): number {
  if (!prop || typeof prop !== "object" || !("type" in prop)) return 0;
  const p = prop as { type: string; number?: number | null };
  return p.type === "number" && typeof p.number === "number" ? p.number : 0;
}

function dateStart(prop: unknown): string {
  if (!prop || typeof prop !== "object" || !("type" in prop)) return "";
  const p = prop as { type: string; date?: { start?: string } | null };
  return p.type === "date" ? p.date?.start?.trim() ?? "" : "";
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
      const section = normalizeSection(selectOrStatusName(page.properties["分区"]));
      const recommendType = normalizeRecommendType(
        selectOrStatusName(page.properties["推荐类型"]),
      );
      const visible = checkboxValue(page.properties["是否展示"]);
      const pinWeight = numberValue(page.properties["置顶权重"]);
      const promoEndAt = dateStart(page.properties["优惠结束时间"]);

      return {
        id: page.id,
        title: preview.title,
        excerpt: preview.excerpt,
        searchText: preview.searchText,
        notionUrl: page.url,
        lastEdited: page.last_edited_time,
        section,
        recommendType,
        visible,
        pinWeight,
        promoEndAt,
      };
    });

    return { status: "ok", items };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "从 Notion 拉取数据时发生未知错误";
    return { status: "error", items: [], message };
  }
}
