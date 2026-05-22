import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_ENV_PATH = path.resolve('../server/.env');

type HotspotSample = {
  title: string;
  content: string;
  url: string;
  source: string;
  expectPass?: boolean;
};

type EvaluatedItem = {
  item: HotspotSample;
  analysis: {
    isReal: boolean;
    relevance: number;
    relevanceReason: string;
    keywordMentioned: boolean;
    importance: 'low' | 'medium' | 'high' | 'urgent';
    summary: string;
  };
  preMatched: boolean;
  passed: boolean;
  reason: 'kept' | 'fake_or_spam' | 'low_relevance' | 'keyword_not_mentioned';
};

function parseArgs(): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (!arg.startsWith('--')) continue;

    const key = arg.slice(2);
    const next = process.argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

async function loadEnv(filePath: string): Promise<void> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index === -1) continue;

      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // OPENROUTER_API_KEY can also be provided by the current shell.
  }
}

function usage(): never {
  console.log(`Usage:
  node metric-runner.mjs --keyword "Claude Sonnet 4.6"
  node metric-runner.mjs --keyword "Claude Sonnet 4.6" --input sample-hotspots.json
  node metric-runner.mjs --keyword "Claude Sonnet 4.6" --output report.md

Options:
  --keyword   Required. Monitored keyword.
  --input     Optional. Default: sample-hotspots.json.
  --output    Optional. Write a Markdown metric report.
  --json      Optional. Print JSON only.
  --env       Optional. Default: ../server/.env.
`);
  process.exit(1);
}

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

function normalizeUrl(url: string): string {
  return String(url || '')
    .trim()
    .replace(/\/$/, '')
    .replace(/^https?:\/\/www\./i, 'https://')
    .toLowerCase();
}

function tokenSet(text: string): Set<string> {
  return new Set(
    String(text || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}.]+/gu, ' ')
      .split(/\s+/)
      .filter(Boolean)
  );
}

function jaccard(leftText: string, rightText: string): number {
  const left = tokenSet(leftText);
  const right = tokenSet(rightText);
  if (left.size === 0 && right.size === 0) return 1;

  let intersection = 0;
  for (const item of left) {
    if (right.has(item)) intersection++;
  }
  return intersection / (left.size + right.size - intersection);
}

function deduplicateSimilar(items: HotspotSample[]): { kept: HotspotSample[]; duplicates: HotspotSample[] } {
  const kept: HotspotSample[] = [];
  const duplicates: HotspotSample[] = [];
  const seenUrls = new Set<string>();

  for (const item of items) {
    const normalizedUrl = normalizeUrl(item.url);
    const text = `${item.title}\n${item.content}`;
    const similarItem = kept.find(existing => {
      const existingText = `${existing.title}\n${existing.content}`;
      return jaccard(text, existingText) >= 0.82;
    });

    if (seenUrls.has(normalizedUrl) || similarItem) {
      duplicates.push(item);
      continue;
    }

    seenUrls.add(normalizedUrl);
    kept.push(item);
  }

  return { kept, duplicates };
}

function decidePass(analysis: EvaluatedItem['analysis']): Pick<EvaluatedItem, 'passed' | 'reason'> {
  if (!analysis.isReal) return { passed: false, reason: 'fake_or_spam' };
  if (analysis.relevance < 50) return { passed: false, reason: 'low_relevance' };
  if (!analysis.keywordMentioned && analysis.relevance < 65) {
    return { passed: false, reason: 'keyword_not_mentioned' };
  }
  return { passed: true, reason: 'kept' };
}

function sourceBreakdown(items: HotspotSample[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item.source || 'unknown'] = (acc[item.source || 'unknown'] ?? 0) + 1;
    return acc;
  }, {});
}

function buildReport(params: {
  keyword: string;
  variants: string[];
  rawItems: HotspotSample[];
  deduped: { kept: HotspotSample[]; duplicates: HotspotSample[] };
  evaluated: EvaluatedItem[];
}) {
  const { keyword, variants, rawItems, deduped, evaluated } = params;
  const kept = evaluated.filter(row => row.passed);
  const rejected = evaluated.filter(row => !row.passed);
  const labeled = evaluated.filter(row => typeof row.item.expectPass === 'boolean');
  const tp = labeled.filter(row => row.passed && row.item.expectPass).length;
  const tn = labeled.filter(row => !row.passed && !row.item.expectPass).length;
  const fp = labeled.filter(row => row.passed && !row.item.expectPass).length;
  const fn = labeled.filter(row => !row.passed && row.item.expectPass).length;
  const precision = pct(tp, tp + fp);
  const recall = pct(tp, tp + fn);
  const summaryCompressionRates = kept.map(row => {
    const originalLength = `${row.item.title}\n${row.item.content}`.length;
    return pct(Math.max(0, originalLength - row.analysis.summary.length), originalLength);
  });

  return {
    keyword,
    model: process.env.OPENROUTER_MODEL || '(server default)',
    generatedAt: new Date().toISOString(),
    sourceCoverage: sourceBreakdown(rawItems),
    keywordExpansion: {
      count: variants.length,
      variants
    },
    rawCount: rawItems.length,
    uniqueCount: deduped.kept.length,
    duplicateCount: deduped.duplicates.length,
    duplicateReductionRate: pct(deduped.duplicates.length, rawItems.length),
    analyzedCount: evaluated.length,
    keptCount: kept.length,
    rejectedCount: rejected.length,
    aiNoiseFilterRate: pct(rejected.length, evaluated.length),
    finalRetentionRate: pct(kept.length, rawItems.length),
    averageRelevance: avg(evaluated.map(row => row.analysis.relevance)),
    keptAverageRelevance: avg(kept.map(row => row.analysis.relevance)),
    keywordMentionRate: pct(evaluated.filter(row => row.analysis.keywordMentioned).length, evaluated.length),
    preMatchRate: pct(evaluated.filter(row => row.preMatched).length, evaluated.length),
    highImportanceCount: kept.filter(row => ['high', 'urgent'].includes(row.analysis.importance)).length,
    summaryCompressionRate: avg(summaryCompressionRates),
    rejectionBreakdown: {
      fakeOrSpam: rejected.filter(row => row.reason === 'fake_or_spam').length,
      lowRelevance: rejected.filter(row => row.reason === 'low_relevance').length,
      keywordNotMentioned: rejected.filter(row => row.reason === 'keyword_not_mentioned').length
    },
    labeledEvaluation: labeled.length ? {
      sampleCount: labeled.length,
      accuracy: pct(tp + tn, labeled.length),
      precision,
      recall,
      f1: precision + recall === 0 ? 0 : Number((2 * precision * recall / (precision + recall)).toFixed(2)),
      truePositive: tp,
      trueNegative: tn,
      falsePositive: fp,
      falseNegative: fn
    } : null,
    keptItems: kept.map(row => ({
      title: row.item.title,
      source: row.item.source,
      relevance: row.analysis.relevance,
      importance: row.analysis.importance,
      summary: row.analysis.summary,
      url: row.item.url
    }))
  };
}

function toMarkdown(report: ReturnType<typeof buildReport>): string {
  const labeled = report.labeledEvaluation;
  return `# 热点内容 OpenRouter 量化评估报告

生成时间：${report.generatedAt}

## 基本配置

- 关键词：${report.keyword}
- 模型：${report.model}
- 来源分布：${JSON.stringify(report.sourceCoverage)}
- 关键词扩展数量：${report.keywordExpansion.count}
- 关键词扩展结果：${report.keywordExpansion.variants.join('、')}

## 核心指标

| 指标 | 数值 |
| --- | ---: |
| 原始内容数 Raw | ${report.rawCount} |
| 去重后内容数 Unique | ${report.uniqueCount} |
| 重复内容数 | ${report.duplicateCount} |
| 重复过滤率 | ${report.duplicateReductionRate}% |
| OpenRouter 分析数 | ${report.analyzedCount} |
| 最终保留数 | ${report.keptCount} |
| 噪声过滤数 | ${report.rejectedCount} |
| AI 噪声过滤率 | ${report.aiNoiseFilterRate}% |
| 最终保留率 | ${report.finalRetentionRate}% |
| 平均相关性 | ${report.averageRelevance} |
| 保留内容平均相关性 | ${report.keptAverageRelevance} |
| 关键词提及率 | ${report.keywordMentionRate}% |
| 预匹配命中率 | ${report.preMatchRate}% |
| 高重要热点数 | ${report.highImportanceCount} |
| 摘要压缩率 | ${report.summaryCompressionRate}% |

## 人工标注评估

${labeled ? `| 指标 | 数值 |
| --- | ---: |
| 标注样本数 | ${labeled.sampleCount} |
| Accuracy | ${labeled.accuracy}% |
| Precision | ${labeled.precision}% |
| Recall | ${labeled.recall}% |
| F1 | ${labeled.f1}% |
| TP | ${labeled.truePositive} |
| TN | ${labeled.trueNegative} |
| FP | ${labeled.falsePositive} |
| FN | ${labeled.falseNegative} |` : '样本未提供 expectPass，无法计算人工标注评估指标。'}

## 结论写法

本次评估复用服务端 \`server/src/services/ai.ts\` 中的关键词扩展、预匹配和内容分析逻辑。系统共采集 ${report.rawCount} 条原始内容，去重后剩余 ${report.uniqueCount} 条，重复过滤率为 ${report.duplicateReductionRate}%；经 OpenRouter 分析后保留 ${report.keptCount} 条，AI 噪声过滤率为 ${report.aiNoiseFilterRate}%，最终保留率为 ${report.finalRetentionRate}%。保留内容平均相关性为 ${report.keptAverageRelevance}，高重要热点数为 ${report.highImportanceCount}，说明该流程能够减少重复和低相关信息，提高热点内容筛选效率与可读性。
`;
}

async function main(): Promise<void> {
  const args = parseArgs();
  const keyword = typeof args.keyword === 'string' ? args.keyword : '';
  const input = typeof args.input === 'string' ? args.input : 'sample-hotspots.json';
  const output = typeof args.output === 'string' ? args.output : '';
  const envPath = typeof args.env === 'string' ? args.env : DEFAULT_ENV_PATH;
  const jsonOnly = Boolean(args.json);

  if (!keyword) usage();
  await loadEnv(envPath);

  const ai = await import('../server/src/services/ai.ts');

  const raw = JSON.parse(await fs.readFile(input, 'utf8'));
  const rawItems = Array.isArray(raw) ? raw : raw.items;
  if (!Array.isArray(rawItems)) {
    throw new Error('Input must be a JSON array or { "items": [...] }.');
  }

  const variants = await ai.expandKeyword(keyword);
  const deduped = deduplicateSimilar(rawItems);
  const evaluated: EvaluatedItem[] = [];

  for (const item of deduped.kept) {
    const fullText = `${item.title}\n${item.content}`;
    const preMatch = ai.preMatchKeyword(fullText, variants);
    const analysis = await ai.analyzeContent(fullText, keyword, preMatch);
    const decision = decidePass(analysis);
    evaluated.push({
      item,
      analysis,
      preMatched: preMatch.matched,
      ...decision
    });
  }

  const report = buildReport({ keyword, variants, rawItems, deduped, evaluated });

  if (output) {
    await fs.writeFile(output, toMarkdown(report), 'utf8');
  }

  if (jsonOnly) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log('\n=== Hotspot Metric Report ===');
  console.log(`Keyword: ${report.keyword}`);
  console.log(`Model: ${report.model}`);
  console.log(`Raw: ${report.rawCount}`);
  console.log(`Unique: ${report.uniqueCount}`);
  console.log(`Duplicate reduction: ${report.duplicateReductionRate}%`);
  console.log(`Analyzed: ${report.analyzedCount}`);
  console.log(`Kept: ${report.keptCount}`);
  console.log(`Rejected: ${report.rejectedCount}`);
  console.log(`AI noise filter rate: ${report.aiNoiseFilterRate}%`);
  console.log(`Final retention: ${report.finalRetentionRate}%`);
  console.log(`Average relevance: ${report.averageRelevance}`);
  console.log(`Kept average relevance: ${report.keptAverageRelevance}`);
  console.log(`Keyword mention rate: ${report.keywordMentionRate}%`);
  console.log(`Pre-match rate: ${report.preMatchRate}%`);
  console.log(`High/urgent kept: ${report.highImportanceCount}`);
  console.log(`Summary compression: ${report.summaryCompressionRate}%`);
  if (report.labeledEvaluation) {
    console.log(`Accuracy: ${report.labeledEvaluation.accuracy}%`);
    console.log(`Precision / Recall / F1: ${report.labeledEvaluation.precision}% / ${report.labeledEvaluation.recall}% / ${report.labeledEvaluation.f1}%`);
  }
  if (output) console.log(`Markdown report: ${output}`);
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
