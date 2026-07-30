import { useState } from 'react'
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Clock3,
  Eye,
  ExternalLink,
  FileText,
  Globe2,
  MessageCircle,
  Repeat2,
  Search,
  Shield,
  ShieldAlert,
  Target,
  ThermometerSun,
  Twitter,
  User,
  Zap,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Item, ItemContent } from '@/components/ui/item'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Hotspot } from '@/services/api'
import { relativeTime } from '@/utils/relativeTime'

function heatScore(hotspot: Hotspot) {
  const raw =
    (hotspot.likeCount ?? 0) * 2 +
    (hotspot.retweetCount ?? 0) * 3 +
    (hotspot.replyCount ?? 0) * 1.5 +
    (hotspot.commentCount ?? 0) * 1.5 +
    (hotspot.quoteCount ?? 0) * 2 +
    (hotspot.viewCount ?? 0) / 100
  return raw <= 0 ? 0 : Math.min(100, Math.round(Math.log10(raw + 1) * 25))
}

function heatLabel(score: number) {
  return score >= 80 ? '爆' : score >= 60 ? '热' : score >= 40 ? '温' : score >= 20 ? '凉' : '冷'
}
function sourceIcon(source: string) {
  if (source === 'twitter') return <Twitter className="size-3.5" />
  if (source === 'bilibili' || source === 'weibo') return <Eye className="size-3.5" />
  if (source === 'hackernews') return <Zap className="size-3.5" />
  if (source === 'sogou') return <Search className="size-3.5" />
  return <Globe2 className="size-3.5" />
}
function sourceLabel(source: string) {
  return (
    (
      {
        twitter: 'Twitter',
        bing: 'Bing',
        google: 'Google',
        sogou: '搜狗',
        bilibili: 'Bilibili',
        weibo: '微博热搜',
        hackernews: 'HackerNews',
        duckduckgo: 'DuckDuckGo',
      } as Record<string, string>
    )[source] ?? source
  )
}
function importanceClass(importance: string) {
  return importance === 'urgent'
    ? 'border-red-500/40 bg-red-500/10 text-red-300'
    : importance === 'high'
      ? 'border-orange-500/40 bg-orange-500/10 text-orange-300'
      : importance === 'medium'
        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
        : 'border-muted-foreground/30 bg-muted text-muted-foreground'
}
function importanceLabel(importance: string) {
  return (
    ({ urgent: '紧急', high: '高', medium: '中', low: '低' } as Record<string, string>)[
      importance
    ] ?? importance
  )
}

type Props = { items: Hotspot[]; isLoading: boolean; emptyText: string }

export function HotspotList({ items, isLoading, emptyText }: Props) {
  const [expandedReasons, setExpandedReasons] = useState<Set<string>>(new Set())
  const [expandedContents, setExpandedContents] = useState<Set<string>>(new Set())
  if (items.length === 0 && !isLoading)
    return (
      <Alert>
        <Activity />
        <AlertTitle>暂无热点</AlertTitle>
        <AlertDescription>{emptyText}</AlertDescription>
      </Alert>
    )

  return (
    <div className="space-y-3">
      {items.map((hotspot) => {
        const score = heatScore(hotspot)
        const reasonExpanded = expandedReasons.has(hotspot.id)
        const contentExpanded = expandedContents.has(hotspot.id)
        const toggle = (setter: typeof setExpandedReasons) =>
          setter((previous) => {
            const next = new Set(previous)
            if (next.has(hotspot.id)) next.delete(hotspot.id)
            else next.add(hotspot.id)
            return next
          })
        return (
          <Item
            key={hotspot.id}
            variant="outline"
            className="bg-card/80 transition-colors hover:border-primary/40"
          >
            <ItemContent className="w-full p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      {sourceIcon(hotspot.source)}
                      {sourceLabel(hotspot.source)}
                    </Badge>
                    <Badge variant="outline" className={importanceClass(hotspot.importance)}>
                      {importanceLabel(hotspot.importance)}
                    </Badge>
                    {hotspot.keyword && <Badge variant="secondary">{hotspot.keyword.text}</Badge>}
                    <Badge
                      variant="outline"
                      className={hotspot.isReal ? 'text-emerald-300' : 'text-red-300'}
                    >
                      {hotspot.isReal ? <Shield /> : <ShieldAlert />}
                      {hotspot.isReal ? '可信' : '可疑'}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <ThermometerSun />
                      {heatLabel(score)} {score}
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold leading-6 text-foreground">
                    {hotspot.title}
                  </h3>
                  {hotspot.summary && (
                    <p className="text-sm text-muted-foreground">
                      <span className="mr-2 font-medium text-primary">AI 摘要</span>
                      {hotspot.summary}
                    </p>
                  )}
                  {hotspot.authorName && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Avatar size="sm">
                        {hotspot.authorAvatar && (
                          <AvatarImage src={hotspot.authorAvatar} alt={hotspot.authorName} />
                        )}
                        <AvatarFallback>
                          <User className="size-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span>{hotspot.authorName}</span>
                      {hotspot.authorUsername && (
                        <span className="text-muted-foreground/60">@{hotspot.authorUsername}</span>
                      )}
                      {hotspot.authorVerified && <Badge variant="secondary">认证</Badge>}
                      {hotspot.authorFollowers ? (
                        <span>{hotspot.authorFollowers.toLocaleString()} 粉丝</span>
                      ) : null}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Target />
                      相关性 {hotspot.relevance}%
                    </span>
                    {hotspot.likeCount ? (
                      <span className="inline-flex items-center gap-1">
                        <Zap />
                        {hotspot.likeCount.toLocaleString()}
                      </span>
                    ) : null}
                    {hotspot.retweetCount ? (
                      <span className="inline-flex items-center gap-1">
                        <Repeat2 />
                        {hotspot.retweetCount.toLocaleString()}
                      </span>
                    ) : null}
                    {hotspot.replyCount ? (
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle />
                        {hotspot.replyCount.toLocaleString()}
                      </span>
                    ) : null}
                    {hotspot.viewCount ? (
                      <span className="inline-flex items-center gap-1">
                        <Eye />
                        {hotspot.viewCount.toLocaleString()}
                      </span>
                    ) : null}
                    {hotspot.publishedAt && (
                      <span className="inline-flex items-center gap-1">
                        <Clock3 />
                        发布于 {relativeTime(hotspot.publishedAt)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Activity />
                      抓取于 {relativeTime(hotspot.createdAt)}
                    </span>
                  </div>
                  {hotspot.relevanceReason && (
                    <div>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto px-0 text-xs"
                        onClick={() => toggle(setExpandedReasons)}
                      >
                        {reasonExpanded ? <ChevronUp /> : <ChevronDown />}AI 分析理由
                      </Button>
                      {reasonExpanded && (
                        <p className="border-l-2 border-primary/40 pl-3 text-xs text-muted-foreground">
                          {hotspot.relevanceReason}
                        </p>
                      )}
                    </div>
                  )}
                  {hotspot.content && hotspot.content !== hotspot.summary && (
                    <div>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto px-0 text-xs text-muted-foreground"
                        onClick={() => toggle(setExpandedContents)}
                      >
                        {contentExpanded ? <ChevronUp /> : <ChevronDown />}
                        <FileText />
                        原始内容
                      </Button>
                      {contentExpanded && (
                        <p className="max-h-40 overflow-y-auto whitespace-pre-wrap border-l-2 border-border pl-3 text-xs text-muted-foreground">
                          {hotspot.content}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={hotspot.url} target="_blank" rel="noreferrer">
                        <ExternalLink />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>打开原文</TooltipContent>
                </Tooltip>
              </div>
            </ItemContent>
          </Item>
        )
      })}
    </div>
  )
}
