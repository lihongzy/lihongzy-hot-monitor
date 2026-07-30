export type FilterState = {
  source: string
  importance: string
  keywordId: string
  timeRange: string
  isReal: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export const defaultFilterState: FilterState = {
  source: '',
  importance: '',
  keywordId: '',
  timeRange: '',
  isReal: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
}
