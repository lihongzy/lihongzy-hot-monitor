import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Item } from '@/components/ui/item'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Keyword } from '@/services/api'
import type { FilterState } from './types'

const sourceOptions = [
  ['bing', 'Bing'],
  ['google', 'Google'],
  ['twitter', 'Twitter'],
  ['bilibili', 'Bilibili'],
  ['weibo', '微博热搜'],
  ['hackernews', 'HackerNews'],
  ['sogou', '搜狗'],
]

type Props = {
  filters: FilterState
  keywords: Keyword[]
  onChange: (filters: FilterState) => void
}

export function HotspotFilters({ filters, keywords, onChange }: Props) {
  const update = (key: keyof FilterState, value: string) => onChange({ ...filters, [key]: value })
  const selectValue = (value: string) => value || 'all'
  const selectChange = (key: keyof FilterState, value: string) =>
    update(key, value === 'all' ? '' : value)

  return (
    <Item variant="outline" size="sm" className="gap-2 bg-muted/20">
      <Select
        value={selectValue(filters.source)}
        onValueChange={(value) => selectChange('source', value)}
      >
        <SelectTrigger className="w-[140px] bg-card">
          <SelectValue placeholder="来源" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部来源</SelectItem>
          {sourceOptions.map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={selectValue(filters.importance)}
        onValueChange={(value) => selectChange('importance', value)}
      >
        <SelectTrigger className="w-[130px] bg-card">
          <SelectValue placeholder="重要程度" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部级别</SelectItem>
          <SelectItem value="urgent">紧急</SelectItem>
          <SelectItem value="high">高</SelectItem>
          <SelectItem value="medium">中</SelectItem>
          <SelectItem value="low">低</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={selectValue(filters.keywordId)}
        onValueChange={(value) => selectChange('keywordId', value)}
      >
        <SelectTrigger className="w-[150px] bg-card">
          <SelectValue placeholder="监控词" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部监控词</SelectItem>
          {keywords
            .filter((keyword) => keyword.isActive)
            .map((keyword) => (
              <SelectItem key={keyword.id} value={keyword.id}>
                {keyword.text}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      <Select
        value={selectValue(filters.timeRange)}
        onValueChange={(value) => selectChange('timeRange', value)}
      >
        <SelectTrigger className="w-[130px] bg-card">
          <SelectValue placeholder="时间范围" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部时间</SelectItem>
          <SelectItem value="1h">最近 1 小时</SelectItem>
          <SelectItem value="today">今天</SelectItem>
          <SelectItem value="7d">最近 7 天</SelectItem>
          <SelectItem value="30d">最近 30 天</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={selectValue(filters.isReal)}
        onValueChange={(value) => selectChange('isReal', value)}
      >
        <SelectTrigger className="w-[130px] bg-card">
          <SelectValue placeholder="真实性" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部内容</SelectItem>
          <SelectItem value="true">可信内容</SelectItem>
          <SelectItem value="false">可疑内容</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.sortBy} onValueChange={(value) => update('sortBy', value)}>
        <SelectTrigger className="w-[140px] bg-card">
          <SelectValue placeholder="排序" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt">最新抓取</SelectItem>
          <SelectItem value="publishedAt">最新发布</SelectItem>
          <SelectItem value="hot">热度最高</SelectItem>
          <SelectItem value="relevance">相关性最高</SelectItem>
          <SelectItem value="importance">重要程度</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          onChange({
            ...filters,
            ...{
              source: '',
              importance: '',
              keywordId: '',
              timeRange: '',
              isReal: '',
              sortBy: 'createdAt',
              sortOrder: 'desc',
            },
          })
        }
      >
        <X />
        重置
      </Button>
    </Item>
  )
}
