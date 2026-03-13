"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileText } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

export default function CustomerDownloadsPage() {
  const { toast } = useToast()
  const { data, isLoading } = trpc.reports.list.useQuery({ page: 1, pageSize: 20, status: "approved" })
  const reports = data?.items ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">报告下载</h1>
        <p className="text-muted-foreground">下载已完成的评估报告</p>
      </div>
      <Card>
        <CardHeader><CardTitle>可下载报告 ({reports.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-30" /><p>暂无可下载报告</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>报告编号</TableHead>
                  <TableHead>报告名称</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>完成时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.reportNo}</TableCell>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell><Badge variant="outline">已通过</Badge></TableCell>
                    <TableCell>{new Date(r.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => toast({ title: "下载功能", description: "PDF下载功能即将上线" })}>
                        <Download className="mr-1 h-4 w-4" />下载
                      </Button>
                    </TableCell>
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
