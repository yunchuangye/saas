"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Plus, Eye, Edit } from "lucide-react"
import { trpc } from "@/lib/trpc"
import Link from "next/link"

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft:     { label: "草稿",   variant: "secondary" },
  submitted: { label: "已提交", variant: "default" },
  reviewing: { label: "审核中", variant: "outline" },
  approved:  { label: "已通过", variant: "default" },
  rejected:  { label: "已驳回", variant: "destructive" },
}

export default function AppraiserReportsPage() {
  const { data, isLoading } = trpc.reports.list.useQuery({ page: 1, pageSize: 20 })
  const reports = data?.items ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">评估报告</h1>
          <p className="text-muted-foreground">管理您的所有评估报告</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/appraiser/reports/edit">
            <Plus className="h-4 w-4 mr-2" />
            新建报告
          </Link>
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "全部报告", value: data?.total ?? 0, color: "text-blue-600" },
          { label: "草稿", value: reports.filter(r => r.status === "draft").length, color: "text-gray-600" },
          { label: "审核中", value: reports.filter(r => r.status === "reviewing" || r.status === "submitted").length, color: "text-yellow-600" },
          { label: "已通过", value: reports.filter(r => r.status === "approved").length, color: "text-green-600" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-6">
              <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
              <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 报告列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            报告列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">暂无报告</p>
              <p className="text-sm mt-1">点击右上角「新建报告」开始创建</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>报告编号</TableHead>
                  <TableHead>项目名称</TableHead>
                  <TableHead>报告类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report: any) => {
                  const s = statusMap[report.status] ?? { label: report.status, variant: "secondary" as const }
                  return (
                    <TableRow key={report.id}>
                      <TableCell className="font-mono text-sm">{report.reportNo ?? `RPT-${report.id}`}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{report.title ?? "未命名报告"}</TableCell>
                      <TableCell>{report.reportType ?? "住宅评估"}</TableCell>
                      <TableCell>
                        <Badge variant={s.variant}>{s.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {report.createdAt ? new Date(report.createdAt).toLocaleDateString("zh-CN") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/appraiser/reports/review?id=${report.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {(report.status === "draft" || report.status === "rejected") && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/appraiser/reports/edit?id=${report.id}`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
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
