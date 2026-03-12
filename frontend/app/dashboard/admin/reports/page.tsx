"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CheckCircle, XCircle, Clock, FileText, Building2, Landmark, Eye } from "lucide-react"

const pendingReports = [
  {
    id: "RPT-2024-025",
    title: "朝阳区CBD商业综合体评估报告",
    company: "华信评估",
    bank: "中国银行朝阳支行",
    type: "商业",
    submittedAt: "2024-03-10 09:30",
    value: "¥1.2亿",
  },
  {
    id: "RPT-2024-024",
    title: "海淀区住宅评估报告",
    company: "中房评估",
    bank: "工商银行海淀支行",
    type: "住宅",
    submittedAt: "2024-03-09 16:45",
    value: "¥580万",
  },
  {
    id: "RPT-2024-023",
    title: "西城区办公楼评估报告",
    company: "正信评估",
    bank: "建设银行西城支行",
    type: "商业",
    submittedAt: "2024-03-09 11:20",
    value: "¥3,500万",
  },
]

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">报告审核</h1>
          <p className="text-muted-foreground">审核评估公司提交的报告</p>
        </div>
        <Badge variant="secondary" className="bg-warning/10 text-warning">
          <Clock className="mr-1 h-3 w-3" />
          {pendingReports.length} 份待审核
        </Badge>
      </div>

      <div className="grid gap-4">
        {pendingReports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      <FileText className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {report.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <Landmark className="h-3 w-3" />
                        {report.bank}
                      </span>
                      <Badge variant="outline">{report.type}</Badge>
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-primary">{report.value}</p>
                  <p className="text-xs text-muted-foreground">评估价值</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  提交时间: {report.submittedAt}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    查看报告
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive">
                    <XCircle className="mr-2 h-4 w-4" />
                    退回
                  </Button>
                  <Button size="sm">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    通过
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pendingReports.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          暂无待审核的报告
        </div>
      )}
    </div>
  )
}
