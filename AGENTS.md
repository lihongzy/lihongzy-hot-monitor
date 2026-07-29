# AGENTS.md

## 项目概览

这是一个热点监控工具，包含 React/Vite 前端、Node.js/Express 后端、Prisma 数据库层，以及用于热点分析和量化评估的 Agent Skills 与脚本。

## 目录职责

- `client/`：React + TypeScript + Vite 前端。页面、组件、客户端 API 和样式都放在这里。
- `server/`：Node.js + TypeScript + Express 后端，包含 API、热点搜索、AI 分析、通知、定时任务和 Prisma 数据库代码。
- `server/prisma/`：Prisma schema、迁移和数据库相关文件。
- `docs/`：项目需求、API 和功能说明文档。
- `skills/hot-monitor/`：Agent Skill 定义、参考资料和搜索/报告脚本。
- `test-metric/`：独立的热点内容量化评估工具，不应修改业务代码来适配测试。

## 开发环境

- Node.js、npm
- 前端和后端分别安装依赖：

  ```powershell
  cd server
  npm install
  cd ..\client
  npm install
  ```

- 后端环境变量使用 `server/.env.example` 作为模板，实际密钥只放在本地 `server/.env`，不要提交到 Git。
- AI 提供商、模型和数据源配置应优先复用后端现有配置与服务实现，不要在测试脚本中复制一套请求逻辑。

## 常用命令

后端：

```powershell
cd server
npm run dev          # 开发模式
npm run build        # TypeScript 构建
npm test             # Vitest 测试
npm run db:generate  # 生成 Prisma Client
npm run db:migrate   # 创建/执行开发迁移
npm run db:push      # 同步 schema（谨慎使用）
```

前端：

```powershell
cd client
npm run dev
npm run build
npm run lint
```

量化评估：

```powershell
cd test-metric
node collect-real-samples.mjs --keyword "关键词" --output sample-hotspots.json
node metric-runner.mjs --keyword "关键词" --input sample-hotspots.json --output report.md
```

## 修改规范

- 修改前先阅读相关模块和对应文档，保持现有 TypeScript、ESM、Express、React 和 Prisma 写法。
- 业务逻辑放在后端 service 或 job 中；路由只负责参数校验、调用服务和返回响应。
- 前端 API 调用集中复用已有 service 和类型定义，避免在组件中散落请求细节。
- 涉及数据库 schema 的改动必须同步检查 Prisma 迁移、生成 Client 和相关服务调用。
- 新增或修改行为时补充对应测试；至少运行受影响目录的 build、lint 或 test。
- 保持改动范围聚焦，不提交构建产物、临时样本、量化报告或本地数据库文件，除非任务明确要求。
- 不要提交 API keys、SMTP 密码、数据库凭据或包含敏感信息的日志。

## 验证要求

提交前至少执行与改动相关的检查。前后端同时变更时，建议执行：

```powershell
cd server; npm run build; npm test
cd ..\client; npm run lint; npm run build
```

若外部 API、爬虫或 SMTP 未配置，验证时应说明该限制，不要用真实密钥写入仓库或测试代码。

## Git 注意事项

- 保留用户已有修改，不使用 `git reset --hard` 或 `git checkout --` 覆盖文件。
- 提交信息简洁明确，说明实际变更内容。
- 修改完成后检查 `git status` 和差异，确认没有意外的锁文件、密钥或生成文件。
