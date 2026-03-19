"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Users, Phone, Mail, Filter } from "lucide-react"
import { trpc } from "@/lib/trpc"

const stageColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  qualified: "bg-purple-100 text-purple-700",
  converted: "bg-green-100 text-green-700",
  lost: "bg-gray-100 text-gray-600",
}
const stageLabels: Record<string, string> = {
  new: "新线索", contacted: "已联系", qualified: "已确认", converted: "已转化", lost: "已流失",
}

export default function AdminLeadsPage() {
  const [search, setSearch] = useState("")
  const [stage, setStage] = useState("all")
  const { data, isLoading } = trpc.sales.listLeads.useQuery({ page: 1, pageSize: 50 })
  const leads = data?.items ?? []
  const filtered = leads.filter(l => {
    const matchSearch = !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search) || l.email?.toLowerCase().includes(search.toLowerCase())
    const matchStage = stage === "all" || l.stage === stage
    return matchSearch && matchStage
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">线索管理</h1>
        <p className="text-muted-foreground">管理潜在客户线索和跟进状态</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {["new", "contacted", "qualified", "converted"].map(s => (
          <Card key={s}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{leads.filter(l => l.stage === s).length}</p>
                  <p className="text-sm text-muted-foreground">{stageLabels[s]}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${stageColors[s]}`}>
                  {stageLabels[s]}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索姓名、电话或邮箱..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="w-36">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="全部阶段" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部阶段</SelectItem>
                {Object.entries(stageLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>联系方式</TableHead>
                <TableHead>来源</TableHead>
                <TableHead>阶段</TableHead>
                <TableHead>备注</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">暂无线索数据</TableCell></TableRow>
              ) : filtered.map(lead => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      {lead.phone && <div className="flex items-center gap-1 text-sm"><Phone className="h-3 w-3" />{lead.phone}</div>}
                      {lead.email && <div className="flex items-center gap-1 text-sm text-muted-foreground"><Mail className="h-3 w-3" />{lead.email}</div>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.source ?? "-"}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${stageColors[lead.stage ?? "new"] ?? ""}`}>
                      {stageLabels[lead.stage ?? "new"] ?? lead.stage}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{lead.notes ?? "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("zh-CN") : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">跟进</Button>
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
