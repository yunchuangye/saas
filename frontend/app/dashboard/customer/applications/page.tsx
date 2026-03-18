"use client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FolderOpen, ChevronRight } from "lucide-react"
import { trpc } from "@/lib/trpc"

const statusMap: Record<string, { label: string; variant: "default"|"secondary"|"destructive"|"outline" }> = {
  pending:   { label: "待竞价", variant: "secondary" },
  bidding:   { label: "竞价中", variant: "secondary" },
  awarded:   { label: "已中标", variant: "outline" },
  surveying: { label: "勘察中", variant: "default" },
  reporting: { label: "报告编制", variant: "default" },
  reviewing: { label: "审核中", variant: "secondary" },
  completed: { label: "已完成", variant: "outline" },
  cancelled: { label: "已取消", variant: "destructive" },
}

export default function CustomerApplicationsPage() {
  const router = useRouter()
  const { data, isLoading } = trpc.projects.list.useQuery({ page: 1, pageSize: 50 })
  const projects = data?.items ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">我的申请</h1>
        <p className="text-muted-foreground">查看我提交的评估申请，点击行查看详情</p>
      </div>
      <Card>
        <CardHeader><CardTitle>申请记录（共 {data?.total ?? 0} 条）</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mb-4 opacity-30" />
              <p>暂无申请记录</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>申请编号</TableHead>
                  <TableHead>项目名称</TableHead>
                  <TableHead>物业地址</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>申请时间</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p: any) => {
                  const s = statusMap[p.status] ?? { label: p.status, variant: "outline" as const }
                  return (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/dashboard/customer/applications/${p.id}`)}
                    >
                      <TableCell className="font-mono text-xs">{p.projectNo}</TableCell>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell className="text-muted-foreground">{p.propertyAddress ?? "-"}</TableCell>
                      <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                      <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
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
