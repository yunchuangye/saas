"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, FolderOpen } from "lucide-react"
import { trpc } from "@/lib/trpc"

const statusMap: Record<string, { label: string; variant: "default"|"secondary"|"destructive"|"outline" }> = {
  bidding: { label: "竞价中", variant: "secondary" },
  awarded: { label: "已中标", variant: "outline" },
  active: { label: "进行中", variant: "default" },
  surveying: { label: "勘察中", variant: "default" },
  reporting: { label: "报告编制", variant: "default" },
  reviewing: { label: "审核中", variant: "secondary" },
  completed: { label: "已完成", variant: "outline" },
  cancelled: { label: "已取消", variant: "destructive" },
}

export default function AdminProjectsPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const { data, isLoading } = trpc.projects.list.useQuery({ page, pageSize: 20, search: search || undefined })
  const projects = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">项目管理</h1>
          <p className="text-muted-foreground">管理所有评估项目</p>
        </div>
        <Badge variant="secondary">共 {total} 个项目</Badge>
      </div>
      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="搜索项目..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mb-4 opacity-30" /><p>暂无项目数据</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>项目编号</TableHead>
                    <TableHead>项目名称</TableHead>
                    <TableHead>物业类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p: any) => {
                    const s = statusMap[p.status] ?? { label: p.status, variant: "outline" as const }
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.projectNo}</TableCell>
                        <TableCell className="font-medium">{p.title}</TableCell>
                        <TableCell>{p.propertyType ?? "-"}</TableCell>
                        <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                        <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">共 {total} 条记录</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p-1)}>上一页</Button>
                  <Button variant="outline" size="sm" disabled={projects.length < 20} onClick={() => setPage(p => p+1)}>下一页</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
