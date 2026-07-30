import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import type { Hotspot, Keyword } from '@/services/api'
import { HotspotFilters } from '@/pages/dashboard/HotspotFilters'
import { HotspotList } from '@/pages/dashboard/HotspotList'
import type { FilterState } from '@/pages/dashboard/types'

type Props = {
  query: string
  results: Hotspot[]
  filters: FilterState
  keywords: Keyword[]
  isLoading: boolean
  onQueryChange: (value: string) => void
  onSearch: (event: React.FormEvent<HTMLFormElement>) => void
  onFiltersChange: (filters: FilterState) => void
}

export function SearchPage({
  query,
  results,
  filters,
  keywords,
  isLoading,
  onQueryChange,
  onSearch,
  onFiltersChange,
}: Props) {
  const hasSearched = query.trim().length > 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>搜索热点</CardTitle>
          <CardDescription>从已配置的数据源中实时搜索关键词相关内容。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="输入要搜索的主题"
            />
            <Button type="submit" disabled={isLoading}>
              <Search />
              搜索
            </Button>
          </form>
        </CardContent>
      </Card>
      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle>搜索结果</CardTitle>
            <CardDescription>共 {results.length} 条匹配结果</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <HotspotFilters filters={filters} keywords={keywords} onChange={onFiltersChange} />
            <HotspotList
              items={results}
              isLoading={isLoading}
              emptyText="没有找到相关热点，请尝试更换关键词或调整筛选条件。"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
