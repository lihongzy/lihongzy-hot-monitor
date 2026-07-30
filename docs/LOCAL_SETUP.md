# 本地运行指南

本文档按当前仓库代码整理。

## 前置要求

| 工具 | 建议版本 | 检查命令 |
|------|----------|----------|
| Node.js | 18 或更高，推荐 20 LTS | `node -v` |
| npm | 随 Node.js 安装 | `npm -v` |
| Git | 任意较新版本 | `git --version` |

## 安装依赖

以下命令默认从项目根目录执行。前后端需要分别安装依赖：

```powershell
cd server
npm install

cd ../client
npm install
```

## 配置后端环境变量

复制模板：

```powershell
cd server
Copy-Item .env.example .env
```

编辑 `server/.env`：

```env
DATABASE_URL="file:./dev.db"

PORT=3001
CLIENT_URL=http://localhost:5173

AI_PROVIDER=siliconflow
SILICONFLOW_API_KEY=
SILICONFLOW_MODEL=tencent/Hunyuan-MT-7B

# 或使用 OpenRouter
# AI_PROVIDER=openrouter
# OPENROUTER_API_KEY=
# OPENROUTER_MODEL=tencent/hy3-preview:free

TWITTER_API_KEY=

SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
NOTIFY_EMAIL=
```

说明：

- `server/.env` 不应提交到 Git。
- `server/prisma/dev.db` 是本地 SQLite 数据库文件，也不应提交到 Git。
- 不配置 Twitter API Key 时，Twitter 来源会返回空结果，但其他来源仍可运行。
- 不配置邮件时，不会发送邮件，但浏览器实时通知仍可使用。
- 不配置 AI Key 时，后端会使用降级分析结果，便于本地流程跑通。

## 初始化数据库

推荐使用已有迁移初始化：

```powershell
cd server
npm run db:generate
npm run db:migrate
```

如果只是快速同步 schema，也可以使用：

```powershell
npm run db:push
```

## 启动后端

```powershell
cd server
npm run dev
```

启动成功后，后端会监听：

```text
http://localhost:3001
```

健康检查：

```text
http://localhost:3001/api/health
```

## 启动前端

另开一个终端：

```powershell
cd client
npm run dev
```

默认访问：

```text
http://localhost:5173
```

## 可用页面

- `/`：热点雷达，查看统计、热点列表、筛选、排序和分页。
- `/keywords`：监控词管理，新增、启停、删除关键词。
- `/search`：手动搜索热点。

## 常用验证命令

后端：

```powershell
cd server
npm run build
npm test
```

前端：

```powershell
cd client
npm run lint
npm run build
```

## 常见问题

### `server/prisma/dev.db` 为什么不提交？

这是本地 SQLite 数据库，会随着本地运行不断变化。仓库只应提交 `schema.prisma` 和迁移文件，不应提交本地数据库文件。

如果该文件已经被 Git 追踪过，使用：

```powershell
git rm --cached server/prisma/dev.db
git add .gitignore
git commit -m "chore: stop tracking local database file"
```

`--cached` 只会从 Git 索引中移除文件，不会删除本地 `dev.db`。

### 前端接口请求失败

检查后端是否已启动，并确认：

- 后端端口是 `3001`
- `server/.env` 中 `CLIENT_URL=http://localhost:5173`
- 前端开发服务器运行在 `http://localhost:5173`

### Prisma Client 报错

重新生成 Prisma Client：

```powershell
cd server
npm run db:generate
```

### 查看数据库

```powershell
cd server
npm run db:studio
```
