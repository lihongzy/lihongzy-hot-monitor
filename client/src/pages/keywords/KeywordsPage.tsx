import { Plus, Target, Trash2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Keyword } from '@/services/api'

type Props = {
  keywords: Keyword[]
  newKeyword: string
  onNewKeywordChange: (value: string) => void
  onAdd: (event: React.FormEvent<HTMLFormElement>) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function KeywordsPage({
  keywords,
  newKeyword,
  onNewKeywordChange,
  onAdd,
  onToggle,
  onDelete,
}: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>添加监控词</CardTitle>
          <CardDescription>添加后将持续订阅相关热点和通知。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onAdd} className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={newKeyword}
              onChange={(event) => onNewKeywordChange(event.target.value)}
              placeholder="例如：GPT-5、AI 编程、Cursor"
            />
            <Button type="submit">
              <Plus />
              添加关键词
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>监控词列表</CardTitle>
          <CardDescription>启用或停用关键词，不会删除历史热点。</CardDescription>
        </CardHeader>
        <CardContent>
          <ItemGroup className="gap-2">
            {keywords.length === 0 ? (
              <Alert>
                <Target />
                <AlertTitle>还没有监控词</AlertTitle>
                <AlertDescription>先添加一个关键词开始监控。</AlertDescription>
              </Alert>
            ) : (
              keywords.map((keyword) => (
                <Item key={keyword.id} variant="outline" size="sm">
                  <ItemMedia variant="icon">
                    <Badge variant={keyword.isActive ? 'default' : 'secondary'}>
                      {keyword.isActive ? '监控中' : '已暂停'}
                    </Badge>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{keyword.text}</ItemTitle>
                    <ItemDescription>{keyword._count?.hotspots ?? 0} 条相关热点</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      variant={keyword.isActive ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => onToggle(keyword.id)}
                    >
                      {keyword.isActive ? '暂停' : '启用'}
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(keyword.id)}
                          aria-label={`删除 ${keyword.text}`}
                        >
                          <Trash2 />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>删除监控词</TooltipContent>
                    </Tooltip>
                  </ItemActions>
                </Item>
              ))
            )}
          </ItemGroup>
        </CardContent>
      </Card>
    </div>
  )
}
