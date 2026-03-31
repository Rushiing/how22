# How22 资源聚合

Next.js 站点 + Notion 数据库作为内容源，适合部署到 **Vercel**，代码托管在 **GitHub**。

## 本地开发

```bash
npm install
cp .env.example .env.local
# 填写 NOTION_TOKEN、NOTION_DATABASE_ID 后：
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

## Notion 配置概要

1. 在 [My integrations](https://www.notion.so/my-integrations) 创建内部集成，复制 **Internal Integration Secret** → `NOTION_TOKEN`。
2. 打开你的**数据库**页面 → **⋯** → **Connections** → 连接该集成（否则 API 无权访问）。
3. 数据库页面 **⋯** → **Copy link**，链接中的 32 位 ID（可带连字符）→ `NOTION_DATABASE_ID`。

## 部署到 Vercel

1. 把本仓库推送到 GitHub。
2. 在 [Vercel](https://vercel.com) 导入该仓库，框架选 Next.js（默认即可）。
3. 在 Project → **Settings** → **Environment Variables** 中填入与 `.env.local` 相同的 `NOTION_TOKEN`、`NOTION_DATABASE_ID`（建议 Production / Preview 都加）。
4. 重新部署。

## 技术栈

- Next.js 16（App Router）+ TypeScript + Tailwind CSS  
- `@notionhq/client`：通过 `databases.retrieve` + `dataSources.query` 读取数据库行（适配 Notion API 新版本）

后续可逐步增加：字段映射、标签筛选、站内详情页、ISR 缓存等。
