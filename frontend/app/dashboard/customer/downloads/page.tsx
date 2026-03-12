"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download, FileText, CheckCircle2 } from "lucide-react"

const downloadHistory = [
  {
    id: "RPT-2024-002",
    name: "海淀区中关村XX大厦评估报告",
    type: "商业评估",
    downloadDate: "2024-03-09 14:30",
    fileSize: "3.2 MB",
    status: "已下载",
  },
  {
    id: "RPT-2024-001",
    name: "朝阳区XX小区评估报告",
    type: "住宅评估",
    downloadDate: "2024-03-01 10:15",
    fileSize: "2.1 MB",
    status: "已下载",
  },
]

const availableDownloads = [
  {
    id: "RPT-2024-002",
    name: "海淀区中关村XX大厦评估报告",
    type: "商业评估",
    completedDate: "2024-03-08",
    fileSize: "3.2 MB",
    format: "PDF",
  },
  {
    id: "RPT-2024-001",
    name: "朝阳区XX小区评估报告",
    type: "住宅评估",
    completedDate: "2024-02-28",
    fileSize: "2.1 MB",
    format: "PDF",
  },
]

export default function CustomerDownloadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">报告下载</h1>
        <p className="text-muted-foreground">下载已完成的评估报告</p>
      </div>

      {/* 可下载报告 */}
      <Card>
        <CardHeader>
          <CardTitle>可下载报告</CardTitle>
          <CardDescription>您可以下载以下评估报告</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {availableDownloads.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-10 w-10 text-primary" />
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {report.type} | {report.fileSize} | {report.format}
                    </p>
                  </div>
                </div>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  下载
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 下载历史 */}
      <Card>
        <CardHeader>
          <CardTitle>下载历史</CardTitle>
          <CardDescription>查看您的报告下载记录</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>报告编号</TableHead>
                <TableHead>报告名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>下载时间</TableHead>
                <TableHead>文件大小</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {downloadHistory.map((record) => (
                <TableRow key={`${record.id}-${record.downloadDate}`}>
                  <TableCell className="font-mono text-sm">{record.id}</TableCell>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell>{record.type}</TableCell>
                  <TableCell>{record.downloadDate}</TableCell>
                  <TableCell>{record.fileSize}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
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
