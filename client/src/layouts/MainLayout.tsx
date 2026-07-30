import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { AppHeader } from '@/components/AppHeader'
import type { Notification } from '@/services/api'

type Props = {
  children: ReactNode
  notifications: Notification[]
  unreadCount: number
  isChecking: boolean
  onCheck: () => void
  onMarkAllRead: () => void
  onThemeToggle: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export function MainLayout({ children, ...headerProps }: Props) {
  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader {...headerProps} />
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </>
  )
}
