# OpenRouter 热点内容量化评估

本目录只用于量化测试，不修改 `server`、`client` 和业务代码。

## 1. 要量化什么

原句：

> 多源热点内容重复、噪声信息较多，因此接入 OpenRouter 完成热点摘要、关键词扩展、重要程度识别和相似内容过滤，提升热点内容可读性和筛选效率。

可量化为这些指标：

| 能力 | 指标 |
| --- | --- |
| 多源内容重复 | 重复内容数、重复过滤率 |
| 噪声信息较多 | AI 噪声过滤数、AI 噪声过滤率 |
| 关键词扩展 | 扩展关键词数量、关键词提及率 |
| 热点摘要 | 摘要压缩率 |
| 重要程度识别 | high/urgent 热点数量 |
| 相似内容过滤 | URL 去重 + 文本相似度去重 |
| 筛选效率 | 最终保留率、平均相关性、保留内容平均相关性 |
| 过滤准确性 | Accuracy、Precision、Recall、F1 |

## 2. 运行方式

进入本目录：

```powershell
cd C:\project\lihongzy-hot-monitor\test-metric
```

先从真实服务采集样本：

```powershell
node collect-real-samples.mjs --keyword "Claude Sonnet 4.6" --output sample-hotspots.json
```

只采集指定平台：

```powershell
node collect-real-samples.mjs --keyword "Claude Sonnet 4.6" --sources bing,hackernews,sogou,bilibili,weibo --output sample-hotspots.json
```

采集脚本会复用服务端已有搜索服务：

```text
server/src/services/search.ts
server/src/services/chinaSearch.ts
server/src/services/twitter.ts
```

它会保存真实采集结果，不会伪造样本。采集完成后，建议人工给每条样本补充：

```json
"expectPass": true
```

或：

```json
"expectPass": false
```

然后运行量化评估：

运行样本评估：

```powershell
node metric-runner.mjs --keyword "Claude Sonnet 4.6"
```

生成 Markdown 报告：

```powershell
node metric-runner.mjs --keyword "Claude Sonnet 4.6" --output report.md
```

指定输入文件：

```powershell
node metric-runner.mjs --keyword "Claude Sonnet 4.6" --input sample-hotspots.json --output report.md
```

脚本默认读取：

```text
..\server\.env
```

里面需要有：

```env
OPENROUTER_API_KEY=你的 OpenRouter Key
```

## 3. 免费模型限制

脚本会先读取 `..\server\.env`，然后复用 `server/src/services/ai.ts` 中的 `expandKeyword`、`preMatchKeyword` 和 `analyzeContent`。因此 AI 服务的模型、Prompt、JSON 解析和失败处理都跟服务端保持一致。

如果使用 SiliconFlow，在 `server/.env` 中配置：

```env
AI_PROVIDER=siliconflow
SILICONFLOW_API_KEY=你的 SiliconFlow Key
SILICONFLOW_MODEL=tencent/Hunyuan-MT-7B
```

SiliconFlow 接口使用 OpenAI 兼容格式：

```text
POST https://api.siliconflow.cn/v1/chat/completions
Authorization: Bearer SILICONFLOW_API_KEY
```

如果 `server/.env` 里面配置了 `OPENROUTER_MODEL`，服务端 AI 逻辑会使用这个模型；否则按 `server/src/services/ai.ts` 中的逻辑执行。

如果只使用免费模型，可以在 `server/.env` 中配置：

```text
openrouter/free
```

也可以配置其他免费模型，但模型名应是：

```text
xxx:free
```

量化脚本本身不再实现 OpenRouter 请求，也不再提供 `--model` 参数；模型配置统一放在 `server/.env`，避免和服务端真实行为不一致。

## 4. 样本格式

`sample-hotspots.json` 的格式：

```json
{
  "items": [
    {
      "title": "标题",
      "content": "正文或摘要",
      "url": "原文链接",
      "source": "bing",
      "expectPass": true
    }
  ]
}
```

`expectPass` 是人工标注：

- `true`：这条内容应该保留
- `false`：这条内容应该过滤

有人工标注时，脚本会额外计算 Accuracy、Precision、Recall 和 F1。

## 5. 指标公式

```text
重复过滤率 = duplicateCount / rawCount
AI 噪声过滤率 = rejectedCount / analyzedCount
最终保留率 = keptCount / rawCount
关键词提及率 = keywordMentionedCount / analyzedCount
摘要压缩率 = (原文长度 - 摘要长度) / 原文长度
Accuracy = (TP + TN) / 标注样本总数
Precision = TP / (TP + FP)
Recall = TP / (TP + FN)
F1 = 2 * Precision * Recall / (Precision + Recall)
```

## 6. 可以写进文档的话

可以这样表述：

```text
为量化 OpenRouter 接入效果，构建人工标注评估集，对多源采集内容进行 URL 去重和文本相似度去重，并调用 OpenRouter 免费模型完成关键词扩展、热点摘要、相关性评分和重要程度识别。实验统计原始内容数、去重后内容数、AI 过滤数和最终保留数，并计算重复过滤率、AI 噪声过滤率、最终保留率、平均相关性、摘要压缩率、Accuracy、Precision、Recall 和 F1 值。上述指标用于衡量系统在降低重复内容、过滤低价值噪声、提升热点可读性和提高筛选效率方面的效果。
```

OpenRouter 免费模型依据：官方文档说明 `openrouter/free` 会从当前可用免费模型中自动选择，且 `:free` 变体用于访问免费模型。
