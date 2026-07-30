import { Bell, Flame, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Notification } from '@/services/api'
import { ThemeToggle } from './ThemeToggle'

type Props = {
  notifications: Notification[]
  unreadCount: number
  isChecking: boolean
  onCheck: () => void
  onMarkAllRead: () => void
  onThemeToggle: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export function AppHeader({
  notifications,
  unreadCount,
  isChecking,
  onCheck,
  onMarkAllRead,
  onThemeToggle,
}: Props) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Flame className="size-5" />
          </div>
          <div>
            <h1 className="font-semibold tracking-tight">HotPulse</h1>
            <p className="text-xs text-muted-foreground">AI 热点雷达</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onCheck} disabled={isChecking}>
            <RefreshCw className={isChecking ? 'animate-spin' : ''} />
            {isChecking ? '扫描中' : '立即扫描'}
          </Button>
          <ThemeToggle onToggle={onThemeToggle} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative" aria-label="打开通知">
                <Bell />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                通知
                {unreadCount > 0 && (
                  <Button variant="link" size="sm" className="h-auto p-0" onClick={onMarkAllRead}>
                    全部已读
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="max-h-80">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">暂无通知</div>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={notification.isRead ? 'opacity-50' : 'items-start'}
                    >
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {notification.content}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
