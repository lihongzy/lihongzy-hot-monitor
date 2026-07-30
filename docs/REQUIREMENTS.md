# 需求文档 - 热点监控工具

本文档按当前真实代码状态修订，避免与实现脱节。

## 1. 项目目标

- 自动监控用户配置的关键词。
- 定时从多个信息源发现与关键词相关的新内容。
- 使用 AI 评估内容真实性、关键词相关性、重要程度和摘要。
- 保存热点历史，支持筛选、排序、分页查看。
- 通过浏览器实时通知和可选邮件通知提醒用户。

## 2. 已实现功能范围

### 2.1 关键词管理

| 功能 | 状态 | 对应代码 |
|------|------|----------|
| 获取关键词列表 | 已实现 | `server/src/routes/keywords.ts` |
| 获取单个关键词及最近热点 | 已实现 | `server/src/routes/keywords.ts` |
| 新增关键词 | 已实现 | `server/src/routes/keywords.ts` |
| 更新关键词文本、分类、启用状态 | 已实现 | `server/src/routes/keywords.ts` |
| 启停关键词 | 已实现 | `PATCH /api/keywords/:id/toggle` |
| 删除关键词 | 已实现 | `server/src/routes/keywords.ts` |

### 2.2 热点采集与分析

| 功能 | 状态 | 对应代码 |
|------|------|----------|
| 每 30 分钟自动检查 | 已实现 | `server/src/jobs/scheduler.ts` |
| 手动触发热点检查 | 已实现 | `POST /api/check-hotspots` |
| 多来源采集 | 已实现 | `server/src/jobs/hotspotChecker.ts` |
| URL + 来源去重 | 已实现 | `@@unique([url, source])` |
| 新鲜度过滤 | 已实现 | `server/src/jobs/hotspotChecker.ts` |
| 关键词查询扩展 | 已实现 | `server/src/services/ai.ts` |
| 关键词预匹配 | 已实现 | `server/src/services/ai.ts` |
| AI 真假与相关性分析 | 已实现 | `server/src/services/ai.ts` |
| 低相关内容过滤 | 已实现 | `server/src/jobs/hotspotChecker.ts` |
| 热点统计 | 已实现 | `GET /api/hotspots/stats` |

当前定时检查数据源：

- Twitter/X
- Bing
- Hacker News
- 搜狗
- B 站
- 微博
- 平台账号检测和账号内容拉取

### 2.3 通知

| 功能 | 状态 | 对应代码 |
|------|------|----------|
| 新热点 Socket.io 推送 | 已实现 | `server/src/realtime/socket.ts`、`hotspotChecker.ts` |
| 通知 Socket.io 推送 | 已实现 | `hotspotChecker.ts` |
| 通知历史列表 | 已实现 | `server/src/routes/notifications.ts` |
| 标记单条已读 | 已实现 | `PATCH /api/notifications/:id/read` |
| 全部标记已读 | 已实现 | `PATCH /api/notifications/read-all` |
| 删除通知 | 已实现 | `DELETE /api/notifications/:id` |
| 清空通知 | 已实现 | `DELETE /api/notifications` |
| 高重要级别邮件通知 | 已实现 | `server/src/services/email.ts` |

### 2.4 前端页面

| 页面 | 路径 | 功能 |
|------|------|------|
| 热点雷达 | `/` | 统计卡片、热点列表、筛选、排序、分页、手动刷新 |
| 监控词 | `/keywords` | 新增、启停、删除关键词 |
| 搜索 | `/search` | 手动搜索并筛选搜索结果 |

前端 API 调用集中在 `client/src/services/`，页面组件不直接拼接底层 HTTP 逻辑。

## 3. 数据模型

### Keyword

- `id`
- `text`
- `category`
- `isActive`
- `createdAt`
- `updatedAt`

### Hotspot

包含：

- 基础内容：`title`、`content`、`url`、`source`、`sourceId`
- AI 分析：`isReal`、`relevance`、`relevanceReason`、`keywordMentioned`、`importance`、`summary`
- 互动指标：`viewCount`、`likeCount`、`retweetCount`、`replyCount`、`commentCount`、`quoteCount`、`danmakuCount`
- 作者信息：`authorName`、`authorUsername`、`authorAvatar`、`authorFollowers`、`authorVerified`
- 时间：`publishedAt`、`createdAt`
- 关联：`keywordId`

### Notification

- `type`
- `title`
- `content`
- `isRead`
- `hotspotId`
- `createdAt`

### Setting

- `key`
- `value`

## 4. API 设计

### 关键词

```text
GET    /api/keywords
GET    /api/keywords/:id
POST   /api/keywords
PUT    /api/keywords/:id
PATCH  /api/keywords/:id/toggle
DELETE /api/keywords/:id
```

### 热点

```text
GET    /api/hotspots
GET    /api/hotspots/stats
GET    /api/hotspots/:id
POST   /api/hotspots/search
DELETE /api/hotspots/:id
POST   /api/check-hotspots
```

### 通知

```text
GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
DELETE /api/notifications/:id
DELETE /api/notifications
```

### 设置

```text
GET    /api/settings
GET    /api/settings/:key
PUT    /api/settings
PUT    /api/settings/:key
```

### WebSocket

客户端发送：

```text
subscribe
unsubscribe
```

服务端发送：

```text
hotspot:new
notification
```

## 5. 运行与配置要求

- 后端环境变量模板为 `server/.env.example`。
- 本地密钥只放在 `server/.env`。
- SQLite 数据库文件为 `server/prisma/dev.db`，不应提交到 Git。
- Prisma schema 和 migrations 需要提交。
- 构建产物 `server/dist/` 不应作为业务文档或源码依据。

## 6. 验收标准

- 可以新增、启停和删除关键词。
- 可以通过定时任务或手动按钮触发热点检查。
- 热点列表支持来源、重要性、关键词、真假、时间范围筛选。
- 热点列表支持时间、发布时间、相关性、重要性、热度排序。
- 新热点会写入数据库并创建通知记录。
- 浏览器可以接收 `hotspot:new` 和 `notification` 事件。
- 高重要级别热点在 SMTP 配置完整时会发送邮件。
- `server/prisma/dev.db` 不再被 Git 追踪。
