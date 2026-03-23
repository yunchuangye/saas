"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, Clock, MapPin, Building2, Loader2, ChevronRight, AlertCircle, XCircle } from "lucide-react"
import { trpc } from "@/lib/trpc"
import Link from "next/link"

// 项目状态到进度步骤的完整映射
function getProgressSteps(status: string) {
  const allSteps = [
    { name: "提交申请", key: "submitted", description: "评估申请已提交，等待评估公司报价" },
    { name: "竞价中", key: "bidding", description: "评估公司正在报价，请等待或主动选择" },
    { name: "已中标", key: "awarded", description: "已选定评估公司，等待开始勘察" },
    { name: "现场勘查", key: "surveying", description: "评估师正在进行现场勘察" },
    { name: "报告编制", key: "reporting", description: "评估师正在编制评估报告" },
    { name: "报告审核", key: "reviewing", description: "报告正在审核中，请耐心等待" },
    { name: "报告交付", key: "completed", description: "评估报告已完成，可前往下载" },
  ]

  const statusOrder: Record<string, number> = {
    pending:    0,
    bidding:    1,
    awarded:    2,
    active:     3,
    surveying:  3,
    reporting:  4,
    reviewing:  5,
    completed:  6,
    cancelled:  -1,
  }

  const currentStep = statusOrder[status] ?? 1

  return allSteps.map((step, index) => ({
    ...step,
    status:
      currentStep === -1 ? "cancelled"
      : index < currentStep ? "completed"
      : index === currentStep ? "current"
      : "pending",
    date: index < currentStep ? "已完成" : "",
  }))
}

function getProgressPercent(status: string) {
  const map: Record<string, number> = {
    pending:    5,
    bidding:    15,
    awarded:    30,
    active:     45,
    surveying:  50,
    reporting:  65,
    reviewing:  80,
    completed:  100,
    cancelled:  0,
  }
  return map[status] ?? 10
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: "待竞价", color: "bg-gray-100 text-gray-700" },
  bidding:    { label: "竞价中", color: "bg-blue-100 text-blue-700" },
  awarded:    { label: "已中标", color: "bg-indigo-100 text-indigo-700" },
  active:     { label: "进行中", color: "bg-yellow-100 text-yellow-700" },
  surveying:  { label: "勘察中", color: "bg-orange-100 text-orange-700" },
  reporting:  { label: "报告编制", color: "bg-purple-100 text-purple-700" },
  reviewing:  { label: "审核中", color: "bg-pink-100 text-pink-700" },
  completed:  { label: "已完成", color: "bg-green-100 text-green-700" },
  cancelled:  { label: "已取消", color: "bg-red-100 text-red-700" },
}

export default function CustomerProgressPage() {
  const { data: projectsData, isLoading } = trpc.projects.list.useQuery({ page: 1, pageSize: 20 })
  const projects = (projectsData?.items || []).filter((p: any) => p.status !== "cancelled")
  const [selectedId, setSelectedId] = useState<number | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">进度查询</h1>
          <p className="text-muted-foreground">查看评估申请的处理进度</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 gap-4 text-muted-foreground">
            <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium text-foreground">暂无评估申请</p>
              <p className="text-sm mt-1">您还没有提交过评估申请</p>
            </div>
            <Link href="/dashboard/customer/apply">
              <Button size="sm">立即申请评估</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 优先显示进行中的项目，否则显示最新的
  const defaultProject = projects.find((p: any) => !["completed", "cancelled"].includes(p.status)) || projects[0]
  const activeProject = projects.find((p: any) => p.id === selectedId) || defaultProject

  const steps = getProgressSteps(activeProject.status)
  const progress = getProgressPercent(activeProject.status)
  const statusInfo = STATUS_LABELS[activeProject.status] || { label: activeProject.status, color: "bg-gray-100 text-gray-700" }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">进度查询</h1>
        <p className="text-muted-foreground">查看评估申请的处理进度</p>
      </div>

      {/* 项目选择列表（多项目时显示） */}
      {projects.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">我的申请（{projects.length} 个）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {projects.map((p: any) => {
              const si = STATUS_LABELS[p.status] || { label: p.status, color: "bg-gray-100 text-gray-700" }
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors hover:bg-muted/50 ${
                    p.id === activeProject.id ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{p.propertyAddress || p.title}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.projectNo || `#${p.id}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${si.color}`}>{si.label}</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* 当前项目进度详情 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <CardTitle className="text-lg leading-tight">
                  {activeProject.propertyAddress || activeProject.title}
                </CardTitle>
              </div>
              <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                  {activeProject.projectNo || `#${activeProject.id}`}
                </span>
                {activeProject.propertyType && (
                  <Badge variant="outline" className="text-xs">{activeProject.propertyType}</Badge>
                )}
                {activeProject.area && (
                  <span className="text-xs">{activeProject.area}㎡</span>
                )}
              </CardDescription>
            </div>
            <Badge className={`text-xs flex-shrink-0 ${statusInfo.color}`}>
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 进度条 */}
          {activeProject.status !== "cancelled" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">整体进度</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2.5" />
            </div>
          )}

          {/* 已取消提示 */}
          {activeProject.status === "cancelled" && (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-700">申请已取消</p>
                <p className="text-sm text-red-600 mt-0.5">该评估申请已被取消，如需重新申请请点击下方按钮</p>
              </div>
            </div>
          )}

          {/* 评估公司信息 */}
          {(activeProject.awardedOrgId || activeProject.assignedOrgId) && (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
              <Building2 className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium">承接评估公司</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {activeProject.awardedOrgName || "评估公司已确认，正在安排评估师"}
                </p>
              </div>
              {activeProject.status === "completed" && (
                <Link href="/dashboard/customer/reports" className="ml-auto">
                  <Button size="sm" variant="outline">查看报告</Button>
                </Link>
              )}
            </div>
          )}

          {/* 竞价中 - 提示用户选择 */}
          {activeProject.status === "bidding" && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-blue-700">评估公司正在报价</p>
                <p className="text-sm text-blue-600 mt-0.5">您可以查看报价详情并选择合适的评估公司</p>
              </div>
              <Link href={`/dashboard/customer/applications/${activeProject.id}`}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">查看报价</Button>
              </Link>
            </div>
          )}

          {/* 进度时间线 */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">处理进度</h3>
            <div className="space-y-0">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {step.status === "completed" ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : step.status === "current" ? (
                      <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                      </div>
                    ) : step.status === "cancelled" ? (
                      <XCircle className="h-6 w-6 text-red-400" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground/40" />
                    )}
                    {index < steps.length - 1 && (
                      <div
                        className={`w-0.5 h-10 mt-1 ${
                          step.status === "completed" ? "bg-green-300" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className={`font-medium text-sm ${
                      step.status === "current" ? "text-primary" :
                      step.status === "completed" ? "text-foreground" :
                      "text-muted-foreground"
                    }`}>
                      {step.name}
                      {step.status === "current" && (
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">进行中</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    {step.date && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {step.date}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 底部操作 */}
          <div className="flex gap-3 pt-2 border-t">
            <Link href={`/dashboard/customer/applications/${activeProject.id}`} className="flex-1">
              <Button variant="outline" className="w-full" size="sm">查看申请详情</Button>
            </Link>
            {activeProject.status === "completed" && (
              <Link href="/dashboard/customer/reports" className="flex-1">
                <Button className="w-full" size="sm">下载评估报告</Button>
              </Link>
            )}
            {activeProject.status === "cancelled" && (
              <Link href="/dashboard/customer/apply" className="flex-1">
                <Button className="w-full" size="sm">重新申请</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
