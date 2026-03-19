"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Phone, Clock, TrendingUp, Search, Filter } from "lucide-react"
import { trpc } from "@/lib/trpc"

const sourceMap: Record<string, string> = {
  microsite: "微站", poster: "海报", referral: "转介绍", direct: "直接访问", campaign: "营销活动",
}
const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: "新线索", variant: "default" },
  contacted: { label: "已联系", variant: "secondary" },
  converted: { label: "已转化", variant: "outline" },
  lost: { label: "已流失", variant: "destructive" },
}

export default function AppraiserLeadsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { data, isLoading } = trpc.sales.appraiser_getLeads.useQuery()
  const leads = (data as any)?.leads ?? []

  const filtered = leads.filter((lead: any) => {
    const matchSearch = !search || lead.name?.includes(search) || lead.phone?.includes(search)
    const matchStatus = statusFilter === "all" || lead.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    total: leads.length,
    new: leads.filter((l: any) => l.status === "new").length,
    contacted: leads.filter((l: any) => l.status === "contacted").length,
    converted: leads.filter((l: any) => l.status === "converted").length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">线索管理</h1>
        <p className="text-muted-foreground">管理来自微站、海报、转介绍等渠道的潜在客户</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "总线索", value: stats.total, icon: Users, color: "text-blue-600" },
          { label: "新线索", value: stats.new, icon: TrendingUp, color: "text-green-600" },
          { label: "已联系", value: stats.contacted, icon: Phone, color: "text-orange-600" },
          { label: "已转化", value: stats.converted, icon: Clock, color: "text-purple-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`rounded-full bg-muted p-2 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="搜索姓名或电话..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="new">新线索</SelectItem>
              <SelectItem value="contacted">已联系</SelectItem>
              <SelectItem value="converted">已转化</SelectItem>
              <SelectItem value="lost">已流失</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 线索列表 */}
      <Card>
        <CardHeader>
          <CardTitle>线索列表</CardTitle>
          <CardDescription>共 {filtered.length} 条线索</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-30" />
              <p>{leads.length === 0 ? "暂无线索，分享微站或海报来获取潜在客户" : "没有符合条件的线索"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead>来源渠道</TableHead>
                  <TableHead>需求</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead: any) => {
                  const status = statusMap[lead.status] ?? { label: lead.status, variant: "secondary" as const }
                  return (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name || "匿名用户"}</TableCell>
                      <TableCell>
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                            <Phone className="h-3 w-3" />{lead.phone}
                          </a>
                        ) : <span className="text-muted-foreground">未留联系方式</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sourceMap[lead.source] ?? lead.source ?? "未知"}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {lead.requirement || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
