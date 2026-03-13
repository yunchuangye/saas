"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Bell, FileText, TrendingUp, CheckCircle, AlertCircle, Check } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

const typeIconMap: Record<string, any> = {
  bidding: TrendingUp, review: CheckCircle, deadline: AlertCircle, project: FileText, system: Bell,
}
const typeColorMap: Record<string, string> = {
  bidding: "text-info", review: "text-success", deadline: "text-warning", project: "text-primary", system: "text-muted-foreground",
}

export default function NotificationsPage() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = trpc.notifications.list.useQuery({ page: 1, pageSize: 50 })
  const { data: unreadData } = trpc.notifications.unreadCount.useQuery()
  const markReadMutation = trpc.notifications.markRead.useMutation({ onSuccess: () => refetch() })
  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => { toast({ title: "已全部标记为已读" }); refetch() }
  })
  const notifications = data?.items ?? []
  const unreadCount = unreadData?.count ?? 0

  function formatTime(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    if (diff < 60000) return "刚刚"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return `${Math.floor(diff / 86400000)}天前`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">通知消息</h1>
          <p className="text-muted-foreground">查看系统通知和业务提醒</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && <Badge variant="destructive">{unreadCount} 条未读</Badge>}
          <Button variant="outline" size="sm" onClick={() => markAllReadMutation.mutate()} disabled={unreadCount === 0}>
            <Check className="mr-1 h-4 w-4" />全部已读
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>全部通知</CardTitle>
          <CardDescription>共 {notifications.length} 条通知</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-30" /><p>暂无通知</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n: any) => {
                const Icon = typeIconMap[n.type] ?? Bell
                const iconColor = typeColorMap[n.type] ?? "text-muted-foreground"
                return (
                  <div key={n.id}
                    className={`flex items-start gap-4 rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors ${!n.isRead ? "bg-primary/5 border-primary/20" : ""}`}
                    onClick={() => { if (!n.isRead) markReadMutation.mutate({ id: n.id }) }}>
                    <div className={`mt-0.5 ${iconColor}`}><Icon className="h-5 w-5" /></div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{n.title}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{formatTime(n.createdAt)}</span>
                          {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary inline-block" />}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{n.content}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
