export interface Keyword {
  id: string
  text: string
  category: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: { hotspots: number }
}

export interface Hotspot {
  id: string
  title: string
  content: string
  url: string
  source: string
  sourceId: string | null
  isReal: boolean
  relevance: number
  relevanceReason: string | null
  keywordMentioned: boolean | null
  importance: 'low' | 'medium' | 'high' | 'urgent'
  summary: string | null
  viewCount: number | null
  likeCount: number | null
  retweetCount: number | null
  replyCount: number | null
  commentCount: number | null
  quoteCount: number | null
  danmakuCount: number | null
  authorName: string | null
  authorUsername: string | null
  authorAvatar: string | null
  authorFollowers: number | null
  authorVerified: boolean | null
  publishedAt: string | null
  createdAt: string
  keyword: { id: string; text: string; category: string | null } | null
}

export interface Notification {
  id: string
  type: string
  title: string
  content: string
  isRead: boolean
  hotspotId: string | null
  createdAt: string
}

export interface Stats {
  total: number
  today: number
  urgent: number
  bySource: Record<string, number>
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface HotspotQuery {
  page?: number
  limit?: number
  source?: string
  importance?: string
  keywordId?: string
  isReal?: string
  timeRange?: string
  timeFrom?: string
  timeTo?: string
  sortBy?: string
  sortOrder?: string
}
