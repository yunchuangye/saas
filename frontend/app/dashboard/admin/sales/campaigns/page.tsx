"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Megaphone, Plus, Search, Users, TrendingUp, Eye, Edit, Trash2 } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  ended: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  draft: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
}
const statusLabels: Record<string, string> = {
  active: "进行中", paused: "已暂停", ended: "已结束", draft: "草稿",
}

export default function AdminCampaignsPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", targetRole: "all", discountType: "percent", discountValue: "", startDate: "", endDate: "" })

  const { data, isLoading, refetch } = trpc.sales.listCampaigns.useQuery({ page: 1, pageSize: 20 })
  const createMutation = trpc.sales.createCampaign.useMutation({
    onSuccess: () => { toast({ title: "活动已创建" }); setOpen(false); refetch() },
    onError: (err) => toast({ title: "创建失败", description: err.message, variant: "destructive" }),
  })

  const campaigns = data?.items ?? []
  const filtered = campaigns.filter(c => c.title?.toLowerCase().includes(search.toLowerCase()))

  const handleCreate = () => {
    if (!form.title) return
    createMutation.mutate({
      title: form.title,
      description: form.description,
      targetRole: form.targetRole as any,
      discountType: form.discountType as any,
      discountValue: Number(form.discountValue) || 0,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">推广活动</h1>
          <p className="text-muted-foreground">管理平台促销活动和折扣方案</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />新建活动</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>新建推广活动</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>活动名称</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="例：新用户首单8折" />
              </div>
              <div className="space-y-2">
                <Label>活动描述</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="活动详情说明..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>目标用户</Label>
                  <Select value={form.targetRole} onValueChange={v => setForm(f => ({ ...f, targetRole: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部用户</SelectItem>
                      <SelectItem value="customer">个人客户</SelectItem>
                      <SelectItem value="bank">银行机构</SelectItem>
                      <SelectItem value="investor">投资机构</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>折扣类型</Label>
                  <Select value={form.discountType} onValueChange={v => setForm(f => ({ ...f, discountType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">百分比折扣</SelectItem>
                      <SelectItem value="fixed">固定减免</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>折扣值 {form.discountType === "percent" ? "（%）" : "（元）"}</Label>
                <Input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} placeholder={form.discountType === "percent" ? "20" : "100"} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>开始日期</Label>
                  <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>结束日期</Label>
                  <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={createMutation.isPending || !form.title}>
                {createMutation.isPending ? "创建中..." : "创建活动"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Megaphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{campaigns.filter(c => c.status === "active").length}</p>
                <p className="text-sm text-muted-foreground">进行中活动</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{campaigns.reduce((sum, c) => sum + (c.usedCount ?? 0), 0)}</p>
                <p className="text-sm text-muted-foreground">总参与人次</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{campaigns.length}</p>
                <p className="text-sm text-muted-foreground">活动总数</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索活动名称..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>活动名称</TableHead>
                <TableHead>目标用户</TableHead>
                <TableHead>折扣</TableHead>
                <TableHead>参与人次</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>有效期</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">暂无推广活动</TableCell></TableRow>
              ) : filtered.map(campaign => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.title}</TableCell>
                  <TableCell>{campaign.targetRole === "all" ? "全部" : campaign.targetRole}</TableCell>
                  <TableCell>
                    {campaign.discountType === "percent" ? `${campaign.discountValue}% 折扣` : `减 ¥${campaign.discountValue}`}
                  </TableCell>
                  <TableCell>{campaign.usedCount ?? 0}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[campaign.status ?? "draft"] ?? ""}`}>
                      {statusLabels[campaign.status ?? "draft"] ?? campaign.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString("zh-CN") : "-"}
                    {" ~ "}
                    {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString("zh-CN") : "长期"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
