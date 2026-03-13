"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText } from "lucide-react"
import { trpc } from "@/lib/trpc"

const statusMap: Record<string, string> = {
  draft: "草稿", submitted: "已提交", reviewing: "审核中", approved: "已通过", rejected: "已驳回",
}

export default function ReportsPage() {
  const { data, isLoading } = trpc.reports.list.useQuery({ page: 1, pageSize: 20, status: "submitted" })
  const reports = data?.items ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">报告审核</h1>
        <p className="text-muted-foreground">待审核的评估报告</p>
      </div>
      <Card>
        <CardHeader><CardTitle>{reports.length} 份报告</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-30" /><p>暂无报告数据</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>报告编号</TableHead>
                  <TableHead>报告标题</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.reportNo}</TableCell>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell><Badge variant="outline">{statusMap[r.status] ?? r.status}</Badge></TableCell>
                    <TableCell>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : new Date(r.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
