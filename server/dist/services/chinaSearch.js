import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
// User Agent 列表
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];
// 频率限制器
class RateLimiter {
    lastRequestTime = 0;
    minInterval;
    constructor(minIntervalMs = 5000) {
        this.minInterval = minIntervalMs;
    }
    async wait() {
        const elapsed = Date.now() - this.lastRequestTime;
        if (elapsed < this.minInterval) {
            await new Promise(resolve => setTimeout(resolve, this.minInterval - elapsed));
        }
        this.lastRequestTime = Date.now();
    }
}
const sogouLimiter = new RateLimiter(3000);
const bilibiliLimiter = new RateLimiter(2000);
const weiboLimiter = new RateLimiter(3000);
function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}
// ============================================================
// 搜狗搜索（替代百度，反爬更宽松，无需 API Key）
// ============================================================
export async function searchSogou(query) {
    await sogouLimiter.wait();
    try {
        const response = await axios.get('https://www.sogou.com/web', {
            params: {
                query,
                ie: 'utf-8'
            },
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
            },
            timeout: 15000,
            maxRedirects: 5
        });
        const $ = cheerio.load(response.data);
        const results = [];
        // 搜狗搜索结果解析
        $('.vrwrap, .rb').each((_, element) => {
            const titleElement = $(element).find('h3 a, .vr-title a, .vrTitle a').first();
            const title = titleElement.text().trim();
            let url = titleElement.attr('href') || '';
            // 搜狗的相对路径转绝对路径
            if (url.startsWith('/link?url=')) {
                url = `https://www.sogou.com${url}`;
            }
            const snippet = $(element).find('.space-txt, .str-text-info, .str_info, .text-layout').text().trim()
                || $(element).find('p').first().text().trim();
            // 排除广告和无关结果
            if (title && url && !title.includes('大家还在搜')) {
                results.push({
                    title,
                    content: snippet || title,
                    url,
                    source: 'sogou'
                });
            }
        });
        console.log(`Sogou search for "${query}": found ${results.length} results`);
        return results;
    }
    catch (error) {
        console.error('Sogou search error:', error instanceof Error ? error.message : error);
        return [];
    }
}
// 搜索 Bilibili 视频
export async function searchBilibili(query) {
    await bilibiliLimiter.wait();
    try {
        // 生成 buvid3 cookie 以避免 412 错误
        const buvid3 = `${crypto.randomUUID()}infoc`;
        const response = await axios.get('https://api.bilibili.com/x/web-interface/search/type', {
            params: {
                keyword: query,
                search_type: 'video',
                order: 'pubdate', // 按发布时间排序，确保获取最新内容
                page: 1,
                pagesize: 20
            },
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Referer': 'https://search.bilibili.com/',
                'Accept': 'application/json',
                'Cookie': `buvid3=${buvid3}`
            },
            timeout: 15000
        });
        if (response.data.code !== 0 || !response.data.data?.result) {
            console.log(`Bilibili search: no results or API error (code: ${response.data.code})`);
            return [];
        }
        const results = response.data.data.result.map(video => ({
            title: video.title.replace(/<\/?em[^>]*>/g, ''), // 去掉高亮标签
            content: video.description || video.title.replace(/<\/?em[^>]*>/g, ''),
            url: `https://www.bilibili.com/video/${video.bvid}`,
            source: 'bilibili',
            sourceId: video.bvid,
            publishedAt: new Date(video.pubdate * 1000),
            viewCount: video.play,
            likeCount: video.like,
            commentCount: video.review,
            danmakuCount: video.danmaku,
            author: {
                name: video.author,
                username: String(video.mid)
            }
        }));
        console.log(`Bilibili search for "${query}": found ${results.length} results`);
        return results;
    }
    catch (error) {
        console.error('Bilibili search error:', error instanceof Error ? error.message : error);
        return [];
    }
}
// 搜索 Bilibili 用户（用于账号检测）
export async function searchBilibiliUser(keyword) {
    await bilibiliLimiter.wait();
    try {
        const response = await axios.get('https://api.bilibili.com/x/web-interface/search/type', {
            params: {
                keyword,
                search_type: 'bili_user',
                page: 1,
                pagesize: 5
            },
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Referer': 'https://search.bilibili.com/',
                'Accept': 'application/json'
            },
            timeout: 15000
        });
        if (response.data.code !== 0 || !response.data.data?.result?.length) {
            return null;
        }
        // 找到名字精确匹配或高度匹配的用户
        const exactMatch = response.data.data.result.find(user => user.uname === keyword || user.uname.toLowerCase() === keyword.toLowerCase());
        if (exactMatch) {
            return exactMatch;
        }
        // 如果第一个结果粉丝数较高且名字包含关键词，也认为是匹配
        const topResult = response.data.data.result[0];
        if (topResult.fans > 1000 && topResult.uname.includes(keyword)) {
            return topResult;
        }
        return null;
    }
    catch (error) {
        console.error('Bilibili user search error:', error instanceof Error ? error.message : error);
        return null;
    }
}
// 获取 B 站用户最新视频
export async function getBilibiliUserVideos(mid) {
    await bilibiliLimiter.wait();
    try {
        const response = await axios.get('https://api.bilibili.com/x/space/arc/search', {
            params: {
                mid,
                pn: 1,
                ps: 10,
                order: 'pubdate' // 按发布时间排序
            },
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Referer': `https://space.bilibili.com/${mid}`,
                'Accept': 'application/json'
            },
            timeout: 15000
        });
        if (response.data.code !== 0 || !response.data.data?.list?.vlist) {
            return [];
        }
        const results = response.data.data.list.vlist.map(video => ({
            title: video.title,
            content: video.description || video.title,
            url: `https://www.bilibili.com/video/${video.bvid}`,
            source: 'bilibili',
            sourceId: video.bvid,
            publishedAt: new Date(video.created * 1000),
            viewCount: video.play,
            commentCount: video.comment || video.review,
            danmakuCount: video.danmaku,
            author: {
                name: video.author,
                username: String(video.mid)
            }
        }));
        console.log(`Bilibili user ${mid} videos: found ${results.length} results`);
        return results;
    }
    catch (error) {
        console.error('Bilibili user videos error:', error instanceof Error ? error.message : error);
        return [];
    }
}
export async function searchWeibo(query) {
    await weiboLimiter.wait();
    try {
        // 使用微博热搜公开 API（无需登录）
        const response = await axios.get('https://weibo.com/ajax/side/hotSearch', {
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Accept': 'application/json',
                'Referer': 'https://weibo.com/'
            },
            timeout: 15000
        });
        if (response.data?.ok !== 1 || !response.data?.data?.realtime) {
            console.log('Weibo hot search: no data or API error');
            return [];
        }
        const hotItems = response.data.data.realtime;
        const results = [];
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
        for (const item of hotItems) {
            const word = (item.note || item.word || '').toLowerCase();
            // 检查关键词是否匹配热搜话题（任一查询词出现在话题中，或话题出现在查询中）
            const isMatch = queryWords.some(qw => word.includes(qw) || qw.includes(word))
                || word.includes(queryLower)
                || queryLower.includes(word);
            if (isMatch) {
                const topicName = item.note || item.word;
                const url = `https://s.weibo.com/weibo?q=${encodeURIComponent('#' + topicName + '#')}`;
                results.push({
                    title: `🔥 微博热搜: ${topicName}`,
                    content: `微博热搜话题「${topicName}」，热度 ${item.num?.toLocaleString() || '未知'}`,
                    url,
                    source: 'weibo',
                    viewCount: item.num || 0
                });
            }
        }
        // 如果没有匹配的热搜，返回所有热搜中的前几条作为参考（对于热点监控有价值）
        if (results.length === 0) {
            console.log(`Weibo hot search: no match for "${query}", returning top trends`);
        }
        else {
            console.log(`Weibo hot search: ${results.length} matches for "${query}"`);
        }
        return results;
    }
    catch (error) {
        console.error('Weibo hot search error:', error instanceof Error ? error.message : error);
        return [];
    }
}
// 检测关键词是否为某平台账号，并获取该账号最新内容
export async function detectAndFetchAccount(keyword) {
    const accounts = [];
    const results = [];
    // 并行检测 Bilibili 用户
    try {
        const biliUser = await searchBilibiliUser(keyword);
        if (biliUser) {
            accounts.push({
                platform: 'bilibili',
                name: biliUser.uname,
                id: String(biliUser.mid),
                followers: biliUser.fans,
                verified: biliUser.official_verify?.type >= 0,
                description: biliUser.usign,
                avatar: biliUser.upic
            });
            console.log(`🎯 Detected Bilibili account: ${biliUser.uname} (${biliUser.fans} fans)`);
            // 获取该用户最新视频
            const userVideos = await getBilibiliUserVideos(biliUser.mid);
            results.push(...userVideos);
        }
    }
    catch (error) {
        console.error('Bilibili account detection error:', error instanceof Error ? error.message : error);
    }
    return { accounts, results };
}
// ============================================================
// 国内聚合搜索
// ============================================================
export async function searchAllChina(query) {
    const results = await Promise.allSettled([
        searchSogou(query),
        searchBilibili(query),
        searchWeibo(query)
    ]);
    const allResults = [];
    const sourceNames = ['Sogou', 'Bilibili', 'Weibo'];
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            allResults.push(...result.value);
            console.log(`  ${sourceNames[index]}: ${result.value.length} results`);
        }
        else {
            console.warn(`  ${sourceNames[index]} search failed:`, result.reason);
        }
    });
    return allResults;
}
//# sourceMappingURL=chinaSearch.js.map