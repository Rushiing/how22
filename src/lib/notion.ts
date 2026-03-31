import { Client } from "@notionhq/client";
import type {
  DataSourceObjectResponse,
  PageObjectResponse,
  PartialDataSourceObjectResponse,
  PartialPageObjectResponse,
} from "@notionhq/client";

export function createNotionClient(): Client {
  const token = process.env.NOTION_TOKEN;
  if (!token?.trim()) {
    throw new Error("NOTION_TOKEN is not set");
  }
  return new Client({ auth: token });
}

function isFullPage(
  page: PageObjectResponse | PartialPageObjectResponse,
): page is PageObjectResponse {
  return "properties" in page;
}

/** 从数据库条目中取第一个「标题」类型属性的纯文本 */
export function titleFromPage(page: PageObjectResponse): string {
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "title" && prop.title?.length) {
      return prop.title.map((t) => t.plain_text).join("");
    }
  }
  return "未命名";
}

export type DataSourceQueryResult =
  | PageObjectResponse
  | PartialPageObjectResponse
  | PartialDataSourceObjectResponse
  | DataSourceObjectResponse;

/** 数据源查询结果中只保留完整 Page（含 properties） */
export function filterFullPagesFromDataSourceQuery(
  results: DataSourceQueryResult[],
): PageObjectResponse[] {
  return results
    .filter((r): r is PageObjectResponse | PartialPageObjectResponse => r.object === "page")
    .filter(isFullPage);
}
