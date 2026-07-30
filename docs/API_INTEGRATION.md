# API 与集成文档

本文档按当前代码整理，后端入口为 `server/src/app.ts` 和 `server/src/routes/index.ts`。

## 服务基础信息

- 默认后端地址：`http://localhost:3001`
- REST API 前缀：`/api`
- 健康检查：`GET /api/health`
- 前端默认通过 Vite 代理或 `VITE_API_BASE_URL` 访问 API。
- Socket.io 默认挂载在同一后端服务，前端通过 `window.location.origin` 连接。

## REST API

### 健康检查

```http
GET /api/health
```

响应：

```json
{
  "status": "ok",
  "timestamp": "2026-07-30T00:00:00.000Z"
}
```

### 关键词

```http
GET /api/keywords
GET /api/keywords/:id
POST /api/keywords
PUT /api/keywords/:id
PATCH /api/keywords/:id/toggle
DELETE /api/keywords/:id
```

创建关键词请求：

```json
{
  "text": "Claude Code",
  "category": "AI 编程"
}
```

说明：

- `GET /api/keywords` 按 `createdAt desc` 返回关键词，并包含 `_count.hotspots`。
- `POST /api/keywords` 要求 `text` 为非空字符串。
- 重复关键词返回 `409`。
- `PATCH /api/keywords/:id/toggle` 会反转 `isActive`。

### 热点

```http
GET /api/hotspots
GET /api/hotspots/stats
GET /api/hotspots/:id
POST /api/hotspots/search
DELETE /api/hotspots/:id
```

`GET /api/hotspots` 查询参数：

| 参数 | 说明 |
|------|------|
| `page` | 页码，默认 `1` |
| `limit` | 每页数量，默认 `20` |
| `source` | 来源过滤，如 `twitter`、`bing`、`hackernews`、`sogou`、`bilibili`、`weibo` |
| `importance` | `low`、`medium`、`high`、`urgent` |
| `keywordId` | 关键词 ID |
| `isReal` | `true` 或 `false` |
| `timeRange` | `1h`、`today`、`7d`、`30d` |
| `timeFrom` | 自定义开始时间 |
| `timeTo` | 自定义结束时间 |
| `sortBy` | `createdAt`、`publishedAt`、`relevance`、`importance`、`hot` |
| `sortOrder` | `asc` 或 `desc` |

列表响应：

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

统计响应：

```json
{
  "total": 0,
  "today": 0,
  "urgent": 0,
  "bySource": {}
}
```

手动搜索请求：

```json
{
  "query": "Claude Code",
  "sources": ["twitter", "bing"]
}
```

说明：

- 当前 `POST /api/hotspots/search` 默认只调用 `twitter` 和 `bing`。
- 定时热点检查会调用更多来源，包括 Hacker News、搜狗、B 站、微博。

### 手动热点检查

```http
POST /api/check-hotspots
```

响应：

```json
{
  "message": "Hotspot check completed"
}
```

该接口会执行与定时任务相同的热点检查逻辑，并通过 Socket.io 推送新热点。

### 通知

```http
GET /api/notifications
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
DELETE /api/notifications/:id
DELETE /api/notifications
```

`GET /api/notifications` 查询参数：

| 参数 | 说明 |
|------|------|
| `page` | 页码，默认 `1` |
| `limit` | 每页数量，默认 `50` |
| `unreadOnly` | `true` 时只返回未读通知 |

响应：

```json
{
  "data": [],
  "unreadCount": 0,
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 0,
    "totalPages": 0
  }
}
```

### 设置

```http
GET /api/settings
GET /api/settings/:key
PUT /api/settings
PUT /api/settings/:key
```

批量更新请求：

```json
{
  "notifyEmail": "user@example.com",
  "monitorEnabled": "true"
}
```

设置值会按字符串保存到 `Setting.value`。

## WebSocket

客户端连接逻辑在 `client/src/services/socket.ts`。

客户端发送：

```text
subscribe      # 参数：关键词字符串数组
unsubscribe    # 参数：关键词字符串数组
```

服务端发送：

```text
hotspot:new    # 新热点，负载为 Hotspot + keyword
notification   # 通知消息
```

`subscribe` 会加入 `keyword:${keyword}` 房间；新热点创建后会同时发送到关键词房间和全局通知事件。

## Prisma 数据模型

实际 schema 位于 `server/prisma/schema.prisma`。

核心模型：

- `Keyword`：监控关键词，包含 `text`、`category`、`isActive`。
- `Hotspot`：热点内容，包含来源、互动指标、作者信息、AI 分析字段和关键词关联。
- `Notification`：通知记录，包含已读状态和可选 `hotspotId`。
- `Setting`：键值配置，`key` 唯一，`value` 为字符串。

重要约束：

- `Keyword.text` 唯一。
- `Hotspot` 通过 `@@unique([url, source])` 去重。
- 删除关键词时，热点的 `keywordId` 会被置空。

## AI 集成

AI 逻辑在 `server/src/services/ai.ts`。

支持的 Provider：

- `AI_PROVIDER=siliconflow`
- `AI_PROVIDER=openrouter`

默认模型：

- SiliconFlow：`tencent/Hunyuan-MT-7B`
- OpenRouter：`tencent/hy3-preview:free`

分析输出会归一化为：

```json
{
  "isReal": true,
  "relevance": 85,
  "relevanceReason": "内容直接讨论该关键词的版本更新",
  "keywordMentioned": true,
  "importance": "high",
  "summary": "此内容与关键词的关联说明"
}
```

如果未配置 AI Key，代码会使用降级分析结果，不会阻塞本地基础流程。

## 数据源集成

热点检查逻辑在 `server/src/jobs/hotspotChecker.ts`。

当前定时检查会并行调用：

- Twitter/X：`server/src/services/twitter.ts`
- Bing：`server/src/services/search.ts`
- Hacker News：`server/src/services/search.ts`
- 搜狗、B 站、微博、账号检测：`server/src/services/chinaSearch.ts`

处理流程：

1. 读取所有 `isActive=true` 的关键词。
2. 检测关键词是否像平台账号，并尝试拉取账号内容。
3. 对关键词做 AI 查询扩展。
4. 并行搜索多个来源。
5. URL 去重、新鲜度过滤、来源优先级排序。
6. 对候选内容做关键词预匹配和 AI 分析。
7. 过滤不真实、低相关或未直接提及且分数不足的内容。
8. 保存热点、创建通知、发送 Socket.io 事件。
9. 对 `high` 和 `urgent` 热点尝试发送邮件。

定时调度在 `server/src/jobs/scheduler.ts`，cron 表达式为：

```text
*/30 * * * *
```
