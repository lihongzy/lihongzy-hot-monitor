import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_ENV_PATH = path.resolve('../server/.env');
const DEFAULT_OUTPUT = 'sample-hotspots.json';

type SourceName = 'account' | 'twitter' | 'bing' | 'hackernews' | 'sogou' | 'bilibili' | 'weibo';

type SearchResultLike = {
  title: string;
  content: string;
  url: string;
  source: string;
  sourceId?: string;
  publishedAt?: Date | string;
  viewCount?: number;
  likeCount?: number;
  retweetCount?: number;
  replyCount?: number;
  quoteCount?: number;
  score?: number;
  commentCount?: number;
  danmakuCount?: number;
  author?: {
    name: string;
    username?: string;
    followers?: number;
    verified?: boolean;
  };
};

type SampleItem = {
  title: string;
  content: string;
  url: string;
  source: string;
  sourceId?: string;
  publishedAt?: string;
  viewCount?: number;
  likeCount?: number;
  retweetCount?: number;
  replyCount?: number;
  quoteCount?: number;
  score?: number;
  commentCount?: number;
  danmakuCount?: number;
  authorName?: string;
  authorUsername?: string;
  authorFollowers?: number;
  authorVerified?: boolean;
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
      if (key) process.env[key] = value;
    }
  } catch {
    // Optional. Some public sources do not need API keys.
  }
}

function usage(): never {
  console.log(`Usage:
  node collect-real-samples.mjs --keyword "Claude Sonnet 4.6"
  node collect-real-samples.mjs --keyword "Claude Sonnet 4.6" --output sample-hotspots.json
  node collect-real-samples.mjs --keyword "Claude Sonnet 4.6" --sources bing,hackernews,sogou,bilibili,weibo

Options:
  --keyword         Required. Keyword to collect from real services.
  --output          Optional. Default: sample-hotspots.json.
  --env             Optional. Default: ../server/.env.
  --sources         Optional comma list. Default: account,twitter,bing,hackernews,sogou,bilibili,weibo.
  --limit-per-source Optional. Default: 20.
`);
  process.exit(1);
}

function parseSources(value: string | boolean | undefined): SourceName[] {
  const defaultSources: SourceName[] = ['account', 'twitter', 'bing', 'hackernews', 'sogou', 'bilibili', 'weibo'];
  if (typeof value !== 'string' || !value.trim()) return defaultSources;

  const allowed = new Set(defaultSources);
  const parsed = value
    .split(',')
    .map(source => source.trim().toLowerCase())
    .filter(Boolean);

  const invalid = parsed.filter(source => !allowed.has(source as SourceName));
  if (invalid.length > 0) {
    throw new Error(`Unknown sources: ${invalid.join(', ')}. Allowed: ${defaultSources.join(', ')}`);
  }

  return parsed as SourceName[];
}

function toSampleItem(result: SearchResultLike): SampleItem {
  return {
    title: result.title,
    content: result.content,
    url: result.url,
    source: result.source,
    sourceId: result.sourceId,
    publishedAt: result.publishedAt ? new Date(result.publishedAt).toISOString() : undefined,
    viewCount: result.viewCount,
    likeCount: result.likeCount,
    retweetCount: result.retweetCount,
    replyCount: result.replyCount,
    quoteCount: result.quoteCount,
    score: result.score,
    commentCount: result.commentCount,
    danmakuCount: result.danmakuCount,
    authorName: result.author?.name,
    authorUsername: result.author?.username,
    authorFollowers: result.author?.followers,
    authorVerified: result.author?.verified
  };
}

async function collectSource(
  source: SourceName,
  keyword: string,
  services: {
    detectAndFetchAccount: (keyword: string) => Promise<{ results: SearchResultLike[] }>;
    searchTwitter: (keyword: string) => Promise<SearchResultLike[]>;
    searchBing: (keyword: string) => Promise<SearchResultLike[]>;
    searchHackerNews: (keyword: string) => Promise<SearchResultLike[]>;
    searchSogou: (keyword: string) => Promise<SearchResultLike[]>;
    searchBilibili: (keyword: string) => Promise<SearchResultLike[]>;
    searchWeibo: (keyword: string) => Promise<SearchResultLike[]>;
  }
): Promise<SearchResultLike[]> {
  switch (source) {
    case 'account':
      return (await services.detectAndFetchAccount(keyword)).results;
    case 'twitter':
      return services.searchTwitter(keyword);
    case 'bing':
      return services.searchBing(keyword);
    case 'hackernews':
      return services.searchHackerNews(keyword);
    case 'sogou':
      return services.searchSogou(keyword);
    case 'bilibili':
      return services.searchBilibili(keyword);
    case 'weibo':
      return services.searchWeibo(keyword);
  }
}

async function main(): Promise<void> {
  const args = parseArgs();
  const keyword = typeof args.keyword === 'string' ? args.keyword : '';
  const output = typeof args.output === 'string' ? args.output : DEFAULT_OUTPUT;
  const envPath = typeof args.env === 'string' ? args.env : DEFAULT_ENV_PATH;
  const sources = parseSources(args.sources);
  const limitPerSource = typeof args['limit-per-source'] === 'string'
    ? Number(args['limit-per-source'])
    : 20;

  if (!keyword) usage();
  await loadEnv(envPath);

  const search = await import('../server/src/services/search.ts');
  const chinaSearch = await import('../server/src/services/chinaSearch.ts');
  const twitter = await import('../server/src/services/twitter.ts');

  const services = {
    detectAndFetchAccount: chinaSearch.detectAndFetchAccount,
    searchTwitter: twitter.searchTwitter,
    searchBing: search.searchBing,
    searchHackerNews: search.searchHackerNews,
    searchSogou: chinaSearch.searchSogou,
    searchBilibili: chinaSearch.searchBilibili,
    searchWeibo: chinaSearch.searchWeibo
  };

  const sourceStats: Record<string, { status: 'fulfilled' | 'rejected'; count: number; error?: string }> = {};
  const allResults: SearchResultLike[] = [];

  for (const source of sources) {
    try {
      const results = await collectSource(source, keyword, services);
      const limited = results.slice(0, Number.isFinite(limitPerSource) && limitPerSource > 0 ? limitPerSource : 20);
      sourceStats[source] = { status: 'fulfilled', count: limited.length };
      allResults.push(...limited);
      console.log(`${source}: ${limited.length} results`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sourceStats[source] = { status: 'rejected', count: 0, error: message };
      console.warn(`${source}: failed - ${message}`);
    }
  }

  const payload = {
    keyword,
    generatedAt: new Date().toISOString(),
    generatedBy: 'test-metric/collect-real-samples.ts',
    note: 'Raw real-service samples. Add expectPass manually before calculating labeled accuracy.',
    sources: sourceStats,
    items: allResults.map(toSampleItem)
  };

  await fs.writeFile(output, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`\nSaved ${payload.items.length} real samples to ${output}`);
  console.log('Next step: manually add expectPass=true/false to sampled items before running metric-runner.');
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
