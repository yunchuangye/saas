"use client"
import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Plus, Clock, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  scheduled: { label: "待带看", color: "bg-blue-100 text-blue-700" },
  completed: { label: "已完成", color: "bg-green-100 text-green-700" },
  cancelled: { label: "已取消", color: "bg-gray-100 text-gray-500" },
  no_show: { label: "未到场", color: "bg-red-100 text-red-700" },
}

export default function BrokerViewingsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState("all")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    listingId: "", clientId: "", scheduledAt: "", notes: "",
  })

  const { data, isLoading, refetch } = trpc.broker.listViewings.useQuery({
    page, pageSize: 15, status: status as any,
  })
  const { data: listings } = trpc.broker.listListings.useQuery({ page: 1, pageSize: 100, status: "active" })
  const { data: clients } = trpc.broker.listClients.useQuery({ page: 1, pageSize: 100 })

  const createMutation = trpc.broker.createViewing.useMutation({
    onSuccess: () => { toast.success("带看预约创建成功"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  })
  const updateMutation = trpc.broker.updateViewing.useMutation({
    onSuccess: () => { toast.success("更新成功"); refetch(); },
    onError: (e) => toast.error(e.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">带看管理</h1>
          <p className="text-sm text-gray-500 mt-1">安排带看预约，记录客户反馈</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" />新建预约</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>新建带看预约</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>选择房源 *</Label>
                <Select value={form.listingId} onValueChange={v => setForm(f => ({ ...f, listingId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="选择房源" /></SelectTrigger>
                  <SelectContent>
                    {(listings?.items as any[])?.map((l: any) => (
                      <SelectItem key={l.id} value={String(l.id)}>{l.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>选择客户 *</Label>
                <Select value={form.clientId} onValueChange={v => setForm(f => ({ ...f, clientId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="选择客户" /></SelectTrigger>
                  <SelectContent>
                    {(clients?.items as any[])?.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name} - {c.phone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>预约时间 *</Label>
                <Input className="mt-1" type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
              </div>
              <div>
                <Label>备注</Label>
                <Textarea className="mt-1" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={() => createMutation.mutate({
                listingId: Number(form.listingId), clientId: Number(form.clientId),
                scheduledAt: form.scheduledAt, notes: form.notes || undefined,
              })} disabled={createMutation.isPending}>
                {createMutation.isPending ? "创建中..." : "确认预约"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 状态筛选 */}
      <div className="flex gap-2">
        {[{ key: "all", label: "全部" }, ...Object.entries(STATUS_MAP).map(([k, v]) => ({ key: k, label: v.label }))].map(s => (
          <Button key={s.key} size="sm" variant={status === s.key ? "default" : "outline"} onClick={() => setStatus(s.key)}>
            {s.label}
          </Button>
        ))}
      </div>

      {/* 带看列表 */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <div className="space-y-3">
          {(data?.items as any[])?.map((v: any) => (
            <Card key={v.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{v.listing_title || "房源"}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_MAP[v.status]?.color}`}>
                          {STATUS_MAP[v.status]?.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">客户：{v.client_name} ({v.client_phone})</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{v.scheduled_at ? new Date(v.scheduled_at).toLocaleString("zh-CN") : "时间待定"}</span>
                      </div>
                      {v.feedback && <p className="text-xs text-gray-500 mt-1 bg-gray-50 px-2 py-1 rounded">反馈：{v.feedback}</p>}
                    </div>
                  </div>
                  {v.status === "scheduled" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-green-600" onClick={() => updateMutation.mutate({ id: v.id, status: "completed" })}>
                        <CheckCircle className="w-3 h-3 mr-1" />完成
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-500" onClick={() => updateMutation.mutate({ id: v.id, status: "cancelled" })}>
                        <XCircle className="w-3 h-3 mr-1" />取消
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {(!data?.items || data.items.length === 0) && (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无带看预约</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
