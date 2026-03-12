"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, Clock, MapPin, Building2 } from "lucide-react"

const activeApplication = {
  id: "APP-2024-001",
  address: "北京市朝阳区望京街道XX小区X号楼",
  type: "住宅",
  purpose: "抵押贷款",
  company: "华信评估",
  appraiser: "张三",
  progress: 65,
  steps: [
    { name: "提交申请", status: "completed", date: "2024-03-10 09:30" },
    { name: "分配评估公司", status: "completed", date: "2024-03-10 14:00" },
    { name: "现场勘查", status: "completed", date: "2024-03-11 10:00" },
    { name: "报告编制", status: "current", date: "预计 2024-03-13" },
    { name: "报告审核", status: "pending", date: "" },
    { name: "报告交付", status: "pending", date: "" },
  ],
}

export default function CustomerProgressPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">进度查询</h1>
        <p className="text-muted-foreground">查看评估申请的处理进度</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-lg">{activeApplication.address}</CardTitle>
              </div>
              <CardDescription className="flex items-center gap-4">
                <span className="font-mono text-xs">{activeApplication.id}</span>
                <Badge variant="outline">{activeApplication.type}</Badge>
                <span>{activeApplication.purpose}</span>
              </CardDescription>
            </div>
            <Badge className="bg-info/10 text-info">处理中</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 进度条 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">整体进度</span>
              <span className="font-medium">{activeApplication.progress}%</span>
            </div>
            <Progress value={activeApplication.progress} className="h-3" />
          </div>

          {/* 评估公司信息 */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">{activeApplication.company}</p>
              <p className="text-sm text-muted-foreground">负责人: {activeApplication.appraiser}</p>
            </div>
          </div>

          {/* 进度时间线 */}
          <div className="space-y-4">
            <h3 className="font-medium">处理进度</h3>
            <div className="space-y-0">
              {activeApplication.steps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {step.status === "completed" ? (
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    ) : step.status === "current" ? (
                      <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                      </div>
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                    {index < activeApplication.steps.length - 1 && (
                      <div className={`w-0.5 h-12 ${step.status === "completed" ? "bg-success" : "bg-muted"}`} />
                    )}
                  </div>
                  <div className="pb-8">
                    <p className={`font-medium ${step.status === "pending" ? "text-muted-foreground" : ""}`}>
                      {step.name}
                    </p>
                    {step.date && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {step.date}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
