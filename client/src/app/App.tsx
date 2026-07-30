import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, Search, Target } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MainLayout } from '@/layouts/MainLayout'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { defaultFilterState, type FilterState } from '@/pages/dashboard/types'
import { KeywordsPage } from '@/pages/keywords/KeywordsPage'
import { SearchPage } from '@/pages/search/SearchPage'
import {
  hotspotsApi,
  keywordsApi,
  notificationsApi,
  triggerHotspotCheck,
  type Hotspot,
  type Keyword,
  type Notification,
  type Stats,
} from '@/services/api'
import { onNewHotspot, onNotification, subscribeToKeywords } from '@/services/socket'
import { toast } from 'sonner'
import { sortHotspots } from '@/utils/sortHotspots'

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '请求失败，请稍后重试'
}

export default function App() {
  const { resolvedTheme, setTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [searchResults, setSearchResults] = useState<Hotspot[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [newKeyword, setNewKeyword] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [dashboardFilters, setDashboardFilters] = useState<FilterState>(defaultFilterState)
  const [searchFilters, setSearchFilters] = useState<FilterState>(defaultFilterState)

  const activeTab = location.pathname.startsWith('/keywords')
    ? 'keywords'
    : location.pathname.startsWith('/search')
      ? 'search'
      : 'dashboard'

  const notify = useCallback((message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message)
    } else {
      toast.error(message)
    }
  }, [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: Parameters<typeof hotspotsApi.getAll>[0] = {
        limit: 20,
        page: currentPage,
        source: dashboardFilters.source || undefined,
        importance: dashboardFilters.importance || undefined,
        keywordId: dashboardFilters.keywordId || undefined,
        timeRange: dashboardFilters.timeRange || undefined,
        isReal: dashboardFilters.isReal || undefined,
        sortBy: dashboardFilters.sortBy || undefined,
        sortOrder: dashboardFilters.sortOrder || undefined,
      }
      const [keywordData, hotspotData, statsData, notificationData] = await Promise.all([
        keywordsApi.getAll(),
        hotspotsApi.getAll(params),
        hotspotsApi.getStats(),
        notificationsApi.getAll({ limit: 20 }),
      ])
      setKeywords(keywordData)
      setHotspots(hotspotData.data)
      setTotalPages(hotspotData.pagination.totalPages)
      setStats(statsData)
      setNotifications(notificationData.data)
      setUnreadCount(notificationData.unreadCount)
      const activeKeywords = keywordData
        .filter((keyword) => keyword.isActive)
        .map((keyword) => keyword.text)
      if (activeKeywords.length) subscribeToKeywords(activeKeywords)
    } catch (error) {
      notify(getErrorMessage(error), 'error')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, dashboardFilters, notify])

  useEffect(() => {
    setCurrentPage(1)
  }, [dashboardFilters])
  useEffect(() => {
    void loadData()
  }, [loadData])
  useEffect(() => {
    const removeHotspotListener = onNewHotspot((hotspot) => {
      setHotspots((previous) => [hotspot as Hotspot, ...previous.slice(0, 19)])
      notify(`发现新热点：${hotspot.title.slice(0, 30)}`, 'success')
      void loadData()
    })
    const removeNotificationListener = onNotification(() => setUnreadCount((count) => count + 1))
    return () => {
      removeHotspotListener()
      removeNotificationListener()
    }
  }, [loadData, notify])

  const addKeyword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = newKeyword.trim()
    if (!text) return
    try {
      const keyword = await keywordsApi.create({ text })
      setKeywords((previous) => [keyword, ...previous])
      setNewKeyword('')
      subscribeToKeywords([keyword.text])
      notify('关键词添加成功', 'success')
    } catch (error) {
      notify(getErrorMessage(error), 'error')
    }
  }
  const deleteKeyword = async (id: string) => {
    try {
      await keywordsApi.delete(id)
      setKeywords((previous) => previous.filter((keyword) => keyword.id !== id))
      notify('关键词已删除', 'success')
    } catch (error) {
      notify(getErrorMessage(error), 'error')
    }
  }
  const toggleKeyword = async (id: string) => {
    try {
      const updated = await keywordsApi.toggle(id)
      setKeywords((previous) => previous.map((keyword) => (keyword.id === id ? updated : keyword)))
    } catch (error) {
      notify(getErrorMessage(error), 'error')
    }
  }
  const search = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!searchQuery.trim()) return
    setIsLoading(true)
    try {
      const result = await hotspotsApi.search(searchQuery.trim())
      setSearchResults(result.results)
      notify(`找到 ${result.results.length} 条结果`, 'success')
    } catch (error) {
      notify(getErrorMessage(error), 'error')
    } finally {
      setIsLoading(false)
    }
  }
  const manualCheck = async () => {
    setIsChecking(true)
    try {
      await triggerHotspotCheck()
      notify('热点检查已触发', 'success')
      window.setTimeout(() => void loadData(), 5000)
    } catch (error) {
      notify(getErrorMessage(error), 'error')
    } finally {
      setIsChecking(false)
    }
  }
  const markAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setUnreadCount(0)
      setNotifications((previous) =>
        previous.map((notification) => ({ ...notification, isRead: true })),
      )
      notify('通知已全部标记为已读', 'success')
    } catch (error) {
      notify(getErrorMessage(error), 'error')
    }
  }

  const filteredSearchResults = useMemo(() => {
    let results = [...searchResults]
    if (searchFilters.source)
      results = results.filter((hotspot) => hotspot.source === searchFilters.source)
    if (searchFilters.importance)
      results = results.filter((hotspot) => hotspot.importance === searchFilters.importance)
    if (searchFilters.isReal === 'true') results = results.filter((hotspot) => hotspot.isReal)
    if (searchFilters.isReal === 'false') results = results.filter((hotspot) => !hotspot.isReal)
    if (searchFilters.keywordId)
      results = results.filter((hotspot) => hotspot.keyword?.id === searchFilters.keywordId)
    if (searchFilters.timeRange) {
      const now = Date.now()
      const from =
        searchFilters.timeRange === 'today'
          ? new Date(new Date().setHours(0, 0, 0, 0)).getTime()
          : now -
            ({ '1h': 3600000, '7d': 604800000, '30d': 2592000000 }[searchFilters.timeRange] ?? 0)
      results = results.filter((hotspot) => new Date(hotspot.createdAt).getTime() >= from)
    }
    return sortHotspots(results, searchFilters.sortBy, searchFilters.sortOrder)
  }, [searchFilters, searchResults])

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    const transitionDocument = document as ViewTransitionDocument
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTheme(nextTheme)
      return
    }
    if (!transitionDocument.startViewTransition) {
      setTheme(nextTheme)
      return
    }
    document.documentElement.style.setProperty('--theme-x', `${event.clientX}px`)
    document.documentElement.style.setProperty('--theme-y', `${event.clientY}px`)
    const radius = Math.hypot(
      Math.max(event.clientX, window.innerWidth - event.clientX),
      Math.max(event.clientY, window.innerHeight - event.clientY),
    )
    document.documentElement.style.setProperty('--theme-radius', `${radius * 1.2}px`)
    transitionDocument.startViewTransition(() => setTheme(nextTheme))
  }

  return (
    <MainLayout
      notifications={notifications}
      unreadCount={unreadCount}
      isChecking={isChecking}
      onCheck={() => void manualCheck()}
      onMarkAllRead={() => void markAllRead()}
      onThemeToggle={toggleTheme}
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => navigate(value === 'dashboard' ? '/' : `/${value}`)}
      >
        <TabsList className="w-full justify-start sm:w-fit">
          <TabsTrigger value="dashboard">
            <Activity />
            热点雷达
          </TabsTrigger>
          <TabsTrigger value="keywords">
            <Target />
            监控词
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search />
            搜索
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              stats={stats}
              keywords={keywords}
              hotspots={hotspots}
              filters={dashboardFilters}
              isLoading={isLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              onFiltersChange={setDashboardFilters}
              onRefresh={() => void loadData()}
              onPageChange={setCurrentPage}
            />
          }
        />
        <Route
          path="/keywords"
          element={
            <KeywordsPage
              keywords={keywords}
              newKeyword={newKeyword}
              onNewKeywordChange={setNewKeyword}
              onAdd={addKeyword}
              onToggle={toggleKeyword}
              onDelete={deleteKeyword}
            />
          }
        />
        <Route
          path="/search"
          element={
            <SearchPage
              query={searchQuery}
              results={filteredSearchResults}
              filters={searchFilters}
              keywords={keywords}
              isLoading={isLoading}
              onQueryChange={setSearchQuery}
              onSearch={search}
              onFiltersChange={setSearchFilters}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  )
}
