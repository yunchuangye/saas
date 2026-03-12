"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, MapPin, Calendar } from "lucide-react"

const reports = [
  {
    id: "RPT-2024-002",
    address: "北京市海淀区中关村XX大厦",
    type: "商业",
    company: "中房评估",
    completedDate: "2024-03-08",
    value: "¥2,850万",
    fileSize: "3.2 MB",
  },
  {
    id: "RPT-2024-001",
    address: "北京市朝阳区XX小区",
    type: "住宅",
    company: "华信评估",
    completedDate: "2024-02-28",
    value: "¥580万",
    fileSize: "2.1 MB",
  },
]

export default function CustomerReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">我的报告</h1>
        <p className="text-muted-foreground">查看已完成的评估报告</p>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{report.address}</CardTitle>
                  </div>
                  <CardDescription className="flex items-center gap-4">
                    <span className="font-mono text-xs">{report.id}</span>
                    <Badge variant="outline">{report.type}</Badge>
                    <span>{report.company}</span>
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-primary">{report.value}</p>
                  <p className="text-xs text-muted-foreground">评估价值</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    完成日期: {report.completedDate}
                  </span>
                  <span>文件大小: {report.fileSize}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    在线查看
                  </Button>
                  <Button size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    下载报告
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reports.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          暂无评估报告
        </div>
      )}
    </div>
  )
}
