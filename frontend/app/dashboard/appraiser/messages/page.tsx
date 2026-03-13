"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, MessageSquare } from "lucide-react"
import { trpc } from "@/lib/trpc"

export default function MessagesPage() {
  const [search, setSearch] = useState("")
  const { data, isLoading } = trpc.messages.list.useQuery({ page: 1, pageSize: 50 })
  const messages = (data?.items ?? []).filter((m: any) =>
    !search || m.content?.includes(search) || m.subject?.includes(search)
  )

  function formatTime(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    if (diff < 86400000) return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    if (diff < 172800000) return "昨天"
    return `${Math.floor(diff / 86400000)}天前`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">消息中心</h1>
        <p className="text-muted-foreground">查看收到的消息</p>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="搜索消息..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <Card>
        <CardHeader><CardTitle>收件箱 ({messages.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-30" /><p>暂无消息</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg: any) => (
                <div key={msg.id} className="flex items-start gap-4 rounded-lg border p-4 hover:bg-accent transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{msg.fromUserId ? "用" : "系"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{msg.subject ?? "消息"}</p>
                      <span className="text-xs text-muted-foreground">{formatTime(msg.createdAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
