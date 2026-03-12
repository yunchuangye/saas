"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, ArrowRight, FileText } from "lucide-react"

const applications = [
  {
    id: "APP-2024-001",
    address: "北京市朝阳区望京街道XX小区X号楼",
    type: "住宅",
    purpose: "抵押贷款",
    submittedAt: "2024-03-10",
    status: "处理中",
    company: "华信评估",
    expectedDate: "2024-03-15",
  },
  {
    id: "APP-2024-002",
    address: "北京市海淀区中关村XX大厦",
    type: "商业",
    purpose: "交易买卖",
    submittedAt: "2024-03-05",
    status: "已完成",
    company: "中房评估",
    completedDate: "2024-03-08",
  },
]

const statusColors: Record<string, string> = {
  "待处理": "bg-muted text-muted-foreground",
  "处理中": "bg-info/10 text-info",
  "已完成": "bg-success/10 text-success",
}

export default function CustomerApplicationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">我的申请</h1>
          <p className="text-muted-foreground">查看已提交的评估申请</p>
        </div>
        <Button>新建申请</Button>
      </div>

      <div className="grid gap-4">
        {applications.map((app) => (
          <Card key={app.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {app.address}
                    </CardTitle>
                  </div>
                  <CardDescription className="flex items-center gap-4">
                    <span className="font-mono text-xs">{app.id}</span>
                    <Badge variant="outline">{app.type}</Badge>
                    <span>{app.purpose}</span>
                  </CardDescription>
                </div>
                <Badge variant="secondary" className={statusColors[app.status]}>
                  {app.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    提交日期: {app.submittedAt}
                  </span>
                  {app.status === "处理中" && (
                    <span>
                      评估公司: {app.company} | 预计完成: {app.expectedDate}
                    </span>
                  )}
                  {app.status === "已完成" && (
                    <span>完成日期: {app.completedDate}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {app.status === "已完成" && (
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      查看报告
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    查看详情
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {applications.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          暂无申请记录
        </div>
      )}
    </div>
  )
}
