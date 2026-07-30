import { Activity, AlertTriangle, RefreshCw, Target, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import type { Hotspot, Keyword, Stats } from '@/services/api'
import { HotspotFilters } from './HotspotFilters'
import { HotspotList } from './HotspotList'
import type { FilterState } from './types'

type Props = {
  stats: Stats | null
  keywords: Keyword[]
  hotspots: Hotspot[]
  filters: FilterState
  isLoading: boolean
  currentPage: number
  totalPages: number
  onFiltersChange: (filters: FilterState) => void
  onRefresh: () => void
  onPageChange: (page: number) => void
}

function pageItems(current: number, total: number): Array<number | 'left' | 'right'> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, 'right', total]
  if (current >= total - 3) return [1, 'left', total - 4, total - 3, total - 2, total - 1, total]
  return [1, 'left', current - 1, current, current + 1, 'right', total]
}

export function DashboardPage({
  stats,
  keywords,
  hotspots,
  filters,
  isLoading,
  currentPage,
  totalPages,
  onFiltersChange,
  onRefresh,
  onPageChange,
}: Props) {
  const cards = [
    { label: '热点总数', value: stats?.total ?? 0, icon: Activity },
    { label: '今日新增', value: stats?.today ?? 0, icon: TrendingUp },
    { label: '紧急热点', value: stats?.urgent ?? 0, icon: AlertTriangle },
    {
      label: '活跃监控词',
      value: keywords.filter((keyword) => keyword.isActive).length,
      icon: Target,
    },
  ]

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center justify-between">
                  {label}
                  <Icon className="size-4" />
                </CardDescription>
                <CardTitle className="text-3xl">{value}</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={label === '紧急热点' ? Math.min(100, value * 10) : 70} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>最新热点</CardTitle>
              <CardDescription>多源采集、AI 分析后的热点内容</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={isLoading ? 'animate-spin' : ''} />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <HotspotFilters filters={filters} keywords={keywords} onChange={onFiltersChange} />
          <HotspotList
            items={hotspots}
            isLoading={isLoading}
            emptyText="调整筛选条件或等待新的热点采集。"
          />
          {totalPages > 1 && (
            <Pagination className="pt-2">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#pagination"
                    text="上一页"
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    onClick={(event) => {
                      event.preventDefault()
                      if (currentPage > 1) onPageChange(currentPage - 1)
                    }}
                  />
                </PaginationItem>
                {pageItems(currentPage, totalPages).map((item, index) => (
                  <PaginationItem key={`${item}-${index}`}>
                    {typeof item === 'string' ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href="#pagination"
                        isActive={item === currentPage}
                        onClick={(event) => {
                          event.preventDefault()
                          onPageChange(item)
                        }}
                      >
                        {item}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#pagination"
                    text="下一页"
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    onClick={(event) => {
                      event.preventDefault()
                      if (currentPage < totalPages) onPageChange(currentPage + 1)
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
