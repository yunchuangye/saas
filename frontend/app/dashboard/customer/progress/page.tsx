"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, Clock, MapPin, Building2, Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc"

function getProgressSteps(status: string) {
  const allSteps = [
    { name: "提交申请", key: "submitted" },
    { name: "分配评估公司", key: "assigned" },
    { name: "现场勘查", key: "surveying" },
    { name: "报告编制", key: "reporting" },
    { name: "报告审核", key: "reviewing" },
    { name: "报告交付", key: "completed" },
  ]

  const statusOrder: Record<string, number> = {
    bidding: 1,
    active: 3,
    completed: 6,
    cancelled: 0,
  }

  const currentStep = statusOrder[status] ?? 1

  return allSteps.map((step, index) => ({
    ...step,
    status:
      index < currentStep
        ? "completed"
        : index === currentStep
        ? "current"
        : "pending",
    date: index < currentStep ? "已完成" : "",
  }))
}

function getProgressPercent(status: string) {
  const map: Record<string, number> = {
    bidding: 20,
    active: 60,
    completed: 100,
    cancelled: 0,
  }
  return map[status] ?? 20
}

export default function CustomerProgressPage() {
  const { data: projectsData, isLoading } = trpc.projects.list.useQuery({ page: 1, pageSize: 10 })
  const projects = projectsData?.items || []
  const activeProject = projects.find((p: any) => p.status === "active") || projects[0]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">进度查询</h1>
          <p className="text-muted-foreground">查看评估申请的处理进度</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-40 text-muted-foreground">
            暂无进行中的评估申请
          </CardContent>
        </Card>
      </div>
    )
  }

  const steps = getProgressSteps(activeProject.status)
  const progress = getProgressPercent(activeProject.status)

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
                <CardTitle className="text-lg">
                  {activeProject.propertyAddress || activeProject.title}
                </CardTitle>
              </div>
              <CardDescription className="flex items-center gap-4">
                <span className="font-mono text-xs">{activeProject.projectNo || `#${activeProject.id}`}</span>
                {activeProject.propertyType && (
                  <Badge variant="outline">{activeProject.propertyType}</Badge>
                )}
                <span>{activeProject.description || "房产评估"}</span>
              </CardDescription>
            </div>
            <Badge className="bg-info/10 text-info">
              {activeProject.status === "completed" ? "已完成" : "处理中"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 进度条 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">整体进度</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* 评估公司信息 */}
          {activeProject.assignedOrgId && (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <Building2 className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">已分配评估公司</p>
                <p className="text-sm text-muted-foreground">
                  项目编号: {activeProject.projectNo || `#${activeProject.id}`}
                </p>
              </div>
            </div>
          )}

          {/* 进度时间线 */}
          <div className="space-y-4">
            <h3 className="font-medium">处理进度</h3>
            <div className="space-y-0">
              {steps.map((step, index) => (
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
                    {index < steps.length - 1 && (
                      <div
                        className={`w-0.5 h-12 ${
                          step.status === "completed" ? "bg-success" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-8">
                    <p
                      className={`font-medium ${
                        step.status === "pending" ? "text-muted-foreground" : ""
                      }`}
                    >
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
