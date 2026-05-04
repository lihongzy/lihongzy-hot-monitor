import type { SearchResult } from '../types.js';
export declare function searchSogou(query: string): Promise<SearchResult[]>;
interface BilibiliUserResult {
    mid: number;
    uname: string;
    usign: string;
    fans: number;
    videos: number;
    upic: string;
    official_verify: {
        type: number;
        desc: string;
    };
}
export declare function searchBilibili(query: string): Promise<SearchResult[]>;
export declare function searchBilibiliUser(keyword: string): Promise<BilibiliUserResult | null>;
export declare function getBilibiliUserVideos(mid: number): Promise<SearchResult[]>;
export declare function searchWeibo(query: string): Promise<SearchResult[]>;
export interface AccountInfo {
    platform: 'bilibili' | 'weibo';
    name: string;
    id: string;
    followers: number;
    verified: boolean;
    description: string;
    avatar?: string;
}
export declare function detectAndFetchAccount(keyword: string): Promise<{
    accounts: AccountInfo[];
    results: SearchResult[];
}>;
export declare function searchAllChina(query: string): Promise<SearchResult[]>;
export {};
//# sourceMappingURL=chinaSearch.d.ts.map