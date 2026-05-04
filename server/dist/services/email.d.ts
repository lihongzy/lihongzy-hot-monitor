interface Hotspot {
    id: string;
    title: string;
    content: string;
    url: string;
    source: string;
    importance: string;
    relevance: number;
    summary: string | null;
    createdAt: Date;
}
export declare function sendHotspotEmail(hotspot: Hotspot & {
    keyword?: {
        text: string;
    } | null;
}): Promise<boolean>;
export declare function sendDigestEmail(hotspots: Hotspot[]): Promise<boolean>;
export {};
//# sourceMappingURL=email.d.ts.map