"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Bell, Search, HelpCircle, CheckCheck, ExternalLink, Info, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { useSSENotifications } from "@/hooks/use-sse"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { trpc } from "@/lib/trpc"
import { CitySelector } from "@/lib/city-context"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

interface TopNavProps {
  className?: string
}

// 通知类型图标映射
function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "project":
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
      )
    case "report":
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
      )
    case "warning":
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        </div>
      )
    default:
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <Bell className="h-4 w-4 text-muted-foreground" />
        </div>
      )
  }
}

function formatTime(date: Date | string | null | undefined) {
  if (!date) return ""
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN })
  } catch {
    return ""
  }
}

export function TopNav({ className }: TopNavProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  // 从数据库获取真实通知数据，每 30 秒轮询一次
  const { data: unreadData, refetch: refetchCount } = trpc.notifications.unreadCount.useQuery(
    undefined,
    { refetchInterval: 30000 }
  )
  const { data: notifData, refetch: refetchList } = trpc.notifications.list.useQuery(
    { page: 1, pageSize: 10 },
    { enabled: open }
  )

  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      refetchCount()
      refetchList()
    },
  })

  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      refetchCount()
      refetchList()
    },
  })

  const unreadCount = unreadData?.count ?? 0
  const notifications = notifData?.items ?? []

  // SSE 实时通知：收到推送时自动刷新未读数
  useSSENotifications(React.useCallback(() => {
    refetchCount()
  }, [refetchCount]))

  const handleMarkRead = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    markReadMutation.mutate({ id })
  }

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    markAllReadMutation.mutate()
  }

  const handleViewAll = () => {
    setOpen(false)
    router.push("/dashboard/admin/notifications")
  }

  return (
    <header
      className={cn(
        "flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6",
        className
      )}
    >
      {/* 侧边栏触发器 */}
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* 搜索框 - 移动端隐藏文本框 */}
      <div className="flex-1 flex items-center gap-4">
        <div className="relative hidden sm:block w-full max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索项目、报告、客户..."
            className="w-full pl-9 bg-muted/50"
          />
        </div>
        {/* 移动端搜索图标 */}
        <Button variant="ghost" size="icon" className="sm:hidden h-9 w-9">
          <Search className="h-[18px] w-[18px]" />
          <span className="sr-only">搜索</span>
        </Button>
      </div>

      {/* 右侧工具栏 */}
      <div className="flex items-center gap-1">
        {/* 帮助 */}
        <Button variant="ghost" size="icon" className="hidden sm:flex h-9 w-9">
          <HelpCircle className="h-[18px] w-[18px]" />
          <span className="sr-only">帮助中心</span>
        </Button>

        {/* 通知弹窗 - 使用 Popover 替代 DropdownMenu，样式更美观 */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
              <span className="sr-only">通知</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-[380px] p-0 shadow-xl border-border/60"
          >
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-foreground/70" />
                <h3 className="text-sm font-semibold">通知中心</h3>
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="h-5 px-1.5 text-[11px] font-medium"
                  >
                    {unreadCount} 未读
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleMarkAllRead}
                  disabled={markAllReadMutation.isPending}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  全部已读
                </Button>
              )}
            </div>

            {/* 通知列表 */}
            <ScrollArea className="max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">暂无通知</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">新通知将在这里显示</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "group relative flex gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60 cursor-pointer",
                        !notification.isRead && "bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-50/80 dark:hover:bg-blue-950/30"
                      )}
                      onClick={(e) => {
                        if (!notification.isRead) {
                          handleMarkRead(notification.id, e)
                        }
                      }}
                    >
                      {/* 通知类型图标 */}
                      <NotificationIcon type={notification.type ?? "system"} />

                      {/* 通知内容 */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-sm leading-snug truncate",
                            !notification.isRead
                              ? "font-semibold text-foreground"
                              : "font-medium text-foreground/75"
                          )}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                          )}
                        </div>
                        {notification.content && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {notification.content}
                          </p>
                        )}
                        <div className="flex items-center gap-1 pt-0.5 text-[11px] text-muted-foreground/60">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(notification.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* 弹窗底部 */}
            <div className="border-t bg-muted/20 p-2">
              <Button
                variant="ghost"
                className="w-full h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60"
                onClick={handleViewAll}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                查看全部通知
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* 城市切换器 */}
        <CitySelector className="hidden sm:block" />

        {/* 主题切换 */}
        <ThemeToggle />
      </div>
    </header>
  )
}
