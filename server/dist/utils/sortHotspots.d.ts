/**
 * 热点排序工具函数
 * 供后端路由和前端客户端排序共用
 */
export interface SortableHotspot {
    likeCount: number | null;
    retweetCount: number | null;
    viewCount: number | null;
    importance: string;
    relevance: number;
    publishedAt: Date | string | null;
    createdAt: Date | string;
}
/** 重要程度数值映射，数值越小越重要 */
export declare const IMPORTANCE_ORDER: Record<string, number>;
/**
 * 计算热度综合分数
 *
 * 公式设计说明：
 * - 点赞为主要排序依据，权重最高
 * - 转发权重次之
 * - 浏览量用 log10 对数缩放作为辅助信号
 *
 * 前端以闪电图标 (⚡) 展示 likeCount，用户直觉上以此判断热度，
 * 因此 likeCount 必须是主导因素。
 */
export declare function calcHotScore(item: SortableHotspot): number;
/**
 * 比较两个热点的重要程度
 * 返回负数 = a 更重要，正数 = b 更重要，0 = 相同
 */
export declare function compareImportance(a: SortableHotspot, b: SortableHotspot): number;
/**
 * 通用排序函数
 * @param items - 热点数组（会被复制，不修改原数组）
 * @param sortBy - 排序字段
 * @param sortOrder - 排序方向 'asc' | 'desc'
 * @returns 排序后的新数组
 */
export declare function sortHotspots<T extends SortableHotspot>(items: T[], sortBy: string, sortOrder?: 'asc' | 'desc'): T[];
//# sourceMappingURL=sortHotspots.d.ts.map