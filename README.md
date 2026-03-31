# 薅秃秃（资源聚合）

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

### 前置条件

- 代码已在 **GitHub** 并可被 Vercel 读取（仓库需已 `git push`）。
- Notion 集成与数据库已按上文配置好；记下 **`NOTION_TOKEN`**、**`NOTION_DATABASE_ID`**（不要提交到仓库）。

### 接入步骤

1. 打开 [Vercel Dashboard](https://vercel.com/dashboard) → **Add New…** → **Project**。
2. **Import** 你的 GitHub 仓库；若首次使用需授权 Vercel 访问 GitHub。
3. **Framework Preset** 保持 **Next.js**（会自动识别）；**Root Directory** 选仓库根目录（默认 `./`）。
4. **Environment Variables** 在部署前或部署后均可配置，至少添加：

   | Name | Value |
   |------|--------|
   | `NOTION_TOKEN` | Notion 集成的 Internal Integration Secret |
   | `NOTION_DATABASE_ID` | 数据库 ID（32 位，可带连字符） |

   建议 **Production**、**Preview**、**Development** 都勾选同一组变量，这样预览链接也能拉 Notion 数据。
5. 点击 **Deploy**。首次构建完成后会得到 `*.vercel.app` 线上地址。

### 部署后

- 改代码并 `git push` 到默认分支，Vercel 会**自动重新部署**。
- **Pull Request** 会生成独立 **Preview** URL，便于自测。
- 自定义域名：**Project → Settings → Domains** 按提示添加 DNS。

### 构建说明

- **Build Command**：`npm run build`（默认即可）  
- **Output**：Next.js 由 Vercel 托管，无需手动填 Output Directory。  
- 本地可先执行 `npm run build` 确认能通过再推送。

### 常见问题

- **线上列表为空 / 报错**：多半是环境变量未配置或 Notion 数据库未连接该集成；在 Vercel 里核对变量名、值是否与本地 `.env.local` 一致，保存后 **Redeploy** 一次。
- **敏感信息**：勿把 Token 写进代码；仅在 Vercel **Environment Variables** 与本地 `.env.local` 中配置。

## 技术栈

- Next.js 16（App Router）+ TypeScript + Tailwind CSS  
- `@notionhq/client`：通过 `databases.retrieve` + `dataSources.query` 读取数据库行（适配 Notion API 新版本）

后续可逐步增加：字段映射、标签筛选、站内详情页、ISR 缓存等。
