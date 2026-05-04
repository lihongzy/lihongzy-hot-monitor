import type { AIAnalysis } from '../types.js';
export declare function expandKeyword(keyword: string): Promise<string[]>;
/**
 * 检查文本中是否包含任一扩展关键词（不区分大小写）。
 * 返回是否匹配以及匹配到的词。
 */
export declare function preMatchKeyword(text: string, expandedKeywords: string[]): {
    matched: boolean;
    matchedTerms: string[];
};
export declare function analyzeContent(content: string, keyword: string, preMatchResult?: {
    matched: boolean;
    matchedTerms: string[];
}): Promise<AIAnalysis>;
export declare function batchAnalyze(contents: string[], keyword: string, expandedKeywords?: string[]): Promise<AIAnalysis[]>;
//# sourceMappingURL=ai.d.ts.map