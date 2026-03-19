"use client"
import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Users, Plus, Phone, Search, Star, Calendar } from "lucide-react"
import { toast } from "sonner"

const INTENTION_MAP: Record<string, { label: string; color: string; stars: number }> = {
  high: { label: "高意向", color: "bg-red-100 text-red-700", stars: 3 },
  medium: { label: "中意向", color: "bg-yellow-100 text-yellow-700", stars: 2 },
  low: { label: "低意向", color: "bg-gray-100 text-gray-600", stars: 1 },
  deal: { label: "已成交", color: "bg-green-100 text-green-700", stars: 0 },
  lost: { label: "已流失", color: "bg-gray-100 text-gray-400", stars: 0 },
}

export default function BrokerClientsPage() {
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState("")
  const [search, setSearch] = useState("")
  const [intentionFilter, setIntentionFilter] = useState("all")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: "", phone: "", email: "", intentionLevel: "medium",
    budgetMin: "", budgetMax: "", requireArea: "", requireRooms: "",
    requireDistrict: "", notes: "",
  })

  const { data, isLoading, refetch } = trpc.broker.listClients.useQuery({
    page, pageSize: 15, keyword: search || undefined,
    intentionLevel: intentionFilter === "all" ? undefined : intentionFilter as any,
  })

  const createMutation = trpc.broker.createClient.useMutation({
    onSuccess: () => { toast.success("客户添加成功"); setOpen(false); refetch(); setForm({ name: "", phone: "", email: "", intentionLevel: "medium", budgetMin: "", budgetMax: "", requireArea: "", requireRooms: "", requireDistrict: "", notes: "" }) },
    onError: (e) => toast.error(e.message),
  })

  const updateMutation = trpc.broker.updateClient.useMutation({
    onSuccess: () => { toast.success("更新成功"); refetch(); },
    onError: (e) => toast.error(e.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">客源管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理买方客户，跟踪意向等级</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" />添加客户</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>添加新客户</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>姓名 *</Label>
                  <Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <Label>手机号 *</Label>
                  <Input className="mt-1" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>邮箱</Label>
                  <Input className="mt-1" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <Label>意向等级</Label>
                  <Select value={form.intentionLevel} onValueChange={v => setForm(f => ({ ...f, intentionLevel: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">高意向</SelectItem>
                      <SelectItem value="medium">中意向</SelectItem>
                      <SelectItem value="low">低意向</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>预算下限（万元）</Label>
                  <Input className="mt-1" type="number" value={form.budgetMin} onChange={e => setForm(f => ({ ...f, budgetMin: e.target.value }))} />
                </div>
                <div>
                  <Label>预算上限（万元）</Label>
                  <Input className="mt-1" type="number" value={form.budgetMax} onChange={e => setForm(f => ({ ...f, budgetMax: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>意向区域</Label>
                  <Input className="mt-1" placeholder="如：南山区" value={form.requireDistrict} onChange={e => setForm(f => ({ ...f, requireDistrict: e.target.value }))} />
                </div>
                <div>
                  <Label>面积需求(㎡)</Label>
                  <Input className="mt-1" placeholder="90-120" value={form.requireArea} onChange={e => setForm(f => ({ ...f, requireArea: e.target.value }))} />
                </div>
                <div>
                  <Label>户型需求</Label>
                  <Input className="mt-1" placeholder="3室2厅" value={form.requireRooms} onChange={e => setForm(f => ({ ...f, requireRooms: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>备注</Label>
                <Textarea className="mt-1" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={() => createMutation.mutate({ ...form, budgetMin: form.budgetMin ? Number(form.budgetMin) * 10000 : undefined, budgetMax: form.budgetMax ? Number(form.budgetMax) * 10000 : undefined, intentionLevel: form.intentionLevel as any })} disabled={createMutation.isPending}>
                {createMutation.isPending ? "添加中..." : "确认添加"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 筛选 */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="搜索姓名、手机号..." value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => e.key === "Enter" && setSearch(keyword)} />
        </div>
        <Select value={intentionFilter} onValueChange={setIntentionFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="意向等级" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="high">高意向</SelectItem>
            <SelectItem value="medium">中意向</SelectItem>
            <SelectItem value="low">低意向</SelectItem>
            <SelectItem value="deal">已成交</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setSearch(keyword)}>搜索</Button>
      </div>

      {/* 客户列表 */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <div className="space-y-3">
          {(data?.items as any[])?.map((client: any) => (
            <Card key={client.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                      {client.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{client.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${INTENTION_MAP[client.intention_level]?.color}`}>
                          {INTENTION_MAP[client.intention_level]?.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>
                        {client.require_district && <span>意向：{client.require_district}</span>}
                        {client.budget_min && client.budget_max && (
                          <span>预算：{(client.budget_min / 10000).toFixed(0)}-{(client.budget_max / 10000).toFixed(0)}万</span>
                        )}
                      </div>
                      {client.require_rooms && (
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{client.require_rooms}</span>
                          {client.require_area && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{client.require_area}㎡</span>}
                        </div>
                      )}
                      {client.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{client.notes}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={client.intention_level} onValueChange={v => updateMutation.mutate({ id: client.id, intentionLevel: v as any })}>
                      <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">高意向</SelectItem>
                        <SelectItem value="medium">中意向</SelectItem>
                        <SelectItem value="low">低意向</SelectItem>
                        <SelectItem value="deal">已成交</SelectItem>
                        <SelectItem value="lost">已流失</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!data?.items || data.items.length === 0) && (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无客户，点击"添加客户"开始</p>
            </div>
          )}
        </div>
      )}

      {data && data.total > 15 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
          <span className="text-sm text-gray-500 flex items-center">第 {page} 页 / 共 {Math.ceil(data.total / 15)} 页</span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(data.total / 15)} onClick={() => setPage(p => p + 1)}>下一页</Button>
        </div>
      )}
    </div>
  )
}
