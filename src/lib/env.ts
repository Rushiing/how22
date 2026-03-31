export function isNotionConfigured(): boolean {
  const token = process.env.NOTION_TOKEN?.trim();
  const databaseId = process.env.NOTION_DATABASE_ID?.trim();
  return Boolean(token && databaseId);
}
