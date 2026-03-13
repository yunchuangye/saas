"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Briefcase } from "lucide-react"
import { trpc } from "@/lib/trpc"

export default function CompletedProjectsPage() {
  const { data, isLoading } = trpc.projects.listCompleted.useQuery({ page: 1, pageSize: 20 })
  const projects = data?.items ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">已完成项目</h1>
        <p className="text-muted-foreground">已完成的评估项目归档</p>
      </div>
      <Card>
        <CardHeader><CardTitle>已完成 ({projects.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Briefcase className="h-12 w-12 mb-4 opacity-30" /><p>暂无已完成项目</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>项目编号</TableHead>
                  <TableHead>项目名称</TableHead>
                  <TableHead>物业类型</TableHead>
                  <TableHead>完成时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.projectNo}</TableCell>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>{p.propertyType ?? "-"}</TableCell>
                    <TableCell>{new Date(p.updatedAt).toLocaleDateString()}</TableCell>
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
