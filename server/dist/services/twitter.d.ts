import type { SearchResult, TwitterFilterConfig } from '../types.js';
export declare const TWITTER_FILTER_CONFIG: TwitterFilterConfig;
export declare function searchTwitter(query: string): Promise<SearchResult[]>;
export declare function getTrends(woeid?: number): Promise<any[]>;
export declare function getUserTweets(username: string): Promise<SearchResult[]>;
//# sourceMappingURL=twitter.d.ts.map