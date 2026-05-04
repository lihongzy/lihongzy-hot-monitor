import type { SearchResult } from '../types.js';
export declare function searchBing(query: string): Promise<SearchResult[]>;
export declare function searchGoogle(query: string): Promise<SearchResult[]>;
export declare function searchDuckDuckGo(query: string): Promise<SearchResult[]>;
export declare function searchHackerNews(query: string): Promise<SearchResult[]>;
export declare function deduplicateResults(allResults: SearchResult[]): SearchResult[];
export declare function searchAll(query: string): Promise<SearchResult[]>;
//# sourceMappingURL=search.d.ts.map