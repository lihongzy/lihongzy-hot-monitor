# 热点监控工具 (Hot Monitor)

一个用于监控关键词热点、聚合多数据源、用 AI 评估相关性并推送通知的本地 Web 工具。

## 项目概述

- 维护一组监控关键词，并可启用或停用关键词。
- 每 30 分钟自动检查热点，也支持从前端手动触发检查。
- 从 Twitter/X、Bing、Hacker News、搜狗、B 站、微博等来源采集内容。
- 使用 AI 对内容真实性、关键词相关性、重要程度和摘要进行分析。
- 通过 Socket.io 向浏览器实时推送新热点和通知。
- 对高重要级别热点尝试发送邮件通知。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19、TypeScript、Vite 7、React Router、Tailwind CSS 4、Radix UI、lucide-react、Socket.io Client |
| 后端 | Node.js、TypeScript、Express 5、Socket.io、node-cron |
| 数据库 | SQLite、Prisma |
| AI 服务 | SiliconFlow 或 OpenRouter |
| 数据源 | twitterapi.io、Bing、Hacker News、搜狗、B 站、微博 |
| 通知 | Socket.io、Nodemailer |
| 测试 | Vitest |

## 当前项目结构

```text
lihongzy-hot-monitor/
├── client/
│   ├── src/
│   │   ├── app/                 # 前端应用入口和路由
│   │   ├── components/          # 页面组件和通用 UI 组件
│   │   ├── layouts/             # 页面布局
│   │   ├── pages/               # dashboard、keywords、search 页面
│   │   ├── services/            # API、HTTP 客户端、Socket 客户端和类型
│   │   └── utils/               # 前端工具函数
│   └── package.json
├── server/
│   ├── prisma/
│   │   ├── schema.prisma        # Prisma 数据模型
│   │   └── migrations/          # 数据库迁移
│   ├── src/
│   │   ├── config/              # 环境配置
│   │   ├── jobs/                # 定时任务和热点检查
│   │   ├── middleware/          # Express 中间件
│   │   ├── realtime/            # Socket.io 服务
│   │   ├── routes/              # REST API 路由
│   │   ├── services/            # AI、搜索、Twitter、邮件等服务
│   │   ├── utils/               # 后端工具函数
│   │   ├── app.ts               # Express app 创建
│   │   ├── server.ts            # HTTP/Socket 服务启动
│   │   └── index.ts             # 后端入口
│   └── package.json
├── docs/                        # 项目文档
├── skills/hot-monitor/          # Agent Skill
└── test-metric/                 # 独立热点量化评估工具
```

## 环境变量

后端使用 `server/.env`，模板见 `server/.env.example`。

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

`server/prisma/dev.db` 是本地 SQLite 数据库文件，应由 `.gitignore` 排除，不应提交到 Git。

## 快速开始

```powershell
cd server
npm install
Copy-Item .env.example .env
npm run db:generate
npm run db:migrate
npm run dev
```

另开一个终端：

```powershell
cd client
npm install
npm run dev
```

默认访问地址：

- 前端：http://localhost:5173
- 后端健康检查：http://localhost:3001/api/health
- Prisma Studio：在 `server/` 下执行 `npm run db:studio`

## 常用命令

后端：

```powershell
cd server
npm run dev
npm run build
npm test
npm run db:generate
npm run db:migrate
npm run db:studio
```

前端：

```powershell
cd client
npm run dev
npm run lint
npm run build
npm run format:check
```

## 主要功能页面

- `/`：热点雷达，展示统计、热点列表、筛选、排序、分页和手动刷新。
- `/keywords`：监控词管理，支持新增、启停和删除关键词。
- `/search`：手动搜索指定关键词，并在前端对搜索结果做筛选和排序。
