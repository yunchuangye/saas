"use client"
import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  MapPin,
  Building2,
  Calendar,
  User,
  Phone,
  FileText,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronRight,
  Play,
  ClipboardCheck,
  PenLine,
  Search,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending:   { label: "待竞价", variant: "secondary" },
  bidding:   { label: "竞价中", variant: "secondary" },
  awarded:   { label: "已中标", variant: "outline" },
  active:    { label: "进行中", variant: "default" },
  surveying: { label: "勘察中", variant: "default" },
  reporting: { label: "报告编制", variant: "default" },
  reviewing: { label: "审核中", variant: "secondary" },
  completed: { label: "已完成", variant: "outline" },
  cancelled: { label: "已取消", variant: "destructive" },
}

const progressSteps = [
  { key: "bidding",   label: "竞价中",   icon: Clock },
  { key: "awarded",   label: "已中标",   icon: CheckCircle2 },
  { key: "surveying", label: "现场勘察", icon: Search },
  { key: "reporting", label: "报告编制", icon: PenLine },
  { key: "reviewing", label: "报告审核", icon: ClipboardCheck },
  { key: "completed", label: "已完成",   icon: CheckCircle2 },
]

const stepOrder = progressSteps.map(s => s.key)

function getStepIndex(status: string) {
  const idx = stepOrder.indexOf(status)
  return idx === -1 ? 0 : idx
}

// 状态流转规则（评估师可以执行的操作）
const statusTransitions: Record<string, { next: string; label: string; icon: any; description: string }[]> = {
  awarded:   [{ next: "surveying", label: "开始勘察", icon: Play, description: "确认开始现场勘察工作" }],
  surveying: [{ next: "reporting", label: "开始编制报告", icon: PenLine, description: "确认勘察完成，开始编制评估报告" }],
  reporting: [{ next: "reviewing", label: "提交审核", icon: ClipboardCheck, description: "确认报告编制完成，提交内部审核" }],
  reviewing: [{ next: "completed", label: "完成评估", icon: CheckCircle2, description: "确认审核通过，完成本次评估项目" }],
}

export default function AppraiserProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const projectId = parseInt(id)
  const router = useRouter()
  const { toast } = useToast()
  const [confirmDialog, setConfirmDialog] = useState<{ next: string; label: string; description: string } | null>(null)
  const [remark, setRemark] = useState("")

  const { data: projectData, isLoading, refetch } = trpc.projects.get.useQuery(
    { id: projectId },
    { enabled: !isNaN(projectId) }
  )

  const updateStatusMutation = trpc.projects.updateStatus.useMutation({
    onSuccess: () => {
      toast({ title: "状态已更新", description: `项目状态已更新为 ${confirmDialog?.label}` })
      setConfirmDialog(null)
      setRemark("")
      refetch()
    },
    onError: (err) => toast({ title: "操作失败", description: err.message, variant: "destructive" }),
  })

  if (isNaN(projectId)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mb-4 opacity-40" />
        <p>无效的项目 ID</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const project = projectData as typeof projectData & { attachments?: unknown[] | null }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mb-4 opacity-40" />
        <p>项目不存在或无权查看</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/appraiser/projects")}>
          返回列表
        </Button>
      </div>
    )
  }

  const s = statusMap[project.status] ?? { label: project.status, variant: "outline" as const }
  const stepIndex = getStepIndex(project.status)
  const progress = Math.round((stepIndex / (progressSteps.length - 1)) * 100)
  const availableTransitions = statusTransitions[project.status] ?? []

  const handleTransition = (transition: { next: string; label: string; description: string }) => {
    setConfirmDialog(transition)
  }

  const confirmTransition = () => {
    if (!confirmDialog) return
    updateStatusMutation.mutate({ id: projectId, status: confirmDialog.next as any })
  }

  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/appraiser/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回项目列表
        </Button>
      </div>

      {/* 项目基本信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-lg">{project.propertyAddress || project.title}</CardTitle>
              </div>
              <CardDescription className="flex items-center gap-4">
                <span className="font-mono text-xs">{project.projectNo || `#${project.id}`}</span>
                {project.propertyType && <Badge variant="outline">{project.propertyType}</Badge>}
              </CardDescription>
            </div>
            <Badge variant={s.variant}>{s.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 进度条 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">项目进度</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* 进度时间线 */}
          <div className="space-y-0">
            {progressSteps.map((step, index) => {
              const isCompleted = index < stepIndex
              const isCurrent = index === stepIndex
              const Icon = step.icon
              return (
                <div key={step.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : isCurrent ? (
                      <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                      </div>
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                    {index < progressSteps.length - 1 && (
                      <div className={`w-0.5 h-10 ${isCompleted ? "bg-green-500" : "bg-muted"}`} />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className={`font-medium ${!isCompleted && !isCurrent ? "text-muted-foreground" : ""}`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 操作按钮 */}
          {availableTransitions.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">可执行操作</p>
                <div className="flex gap-3 flex-wrap">
                  {availableTransitions.map((t) => {
                    const Icon = t.icon
                    return (
                      <Button key={t.next} onClick={() => handleTransition(t)} className="gap-2">
                        <Icon className="h-4 w-4" />
                        {t.label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 项目详情 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              房产信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">物业地址</span>
              <span className="font-medium text-right max-w-[200px]">{project.propertyAddress || "-"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">物业类型</span>
              <span>{project.propertyType || "-"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">建筑面积</span>
              <span>{project.area ? `${project.area} m²` : "-"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">楼层</span>
              <span>{project.floor || "-"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">评估目的</span>
              <span>{project.purpose || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              联系信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">联系人</span>
              <span className="font-medium">{project.contactName || "-"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">联系电话</span>
              <span>{project.contactPhone || "-"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">截止日期</span>
              <span>{project.deadline ? new Date(project.deadline).toLocaleDateString() : "-"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">创建时间</span>
              <span>{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "-"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 附件 */}
      {project.attachments && Array.isArray(project.attachments) && project.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              附件材料
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(project.attachments as any[]).map((att: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{att.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={att.url} target="_blank" rel="noopener noreferrer">查看</a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 状态变更确认对话框 */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认操作</DialogTitle>
            <DialogDescription>{confirmDialog?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>备注（可选）</Label>
              <Textarea
                placeholder="请输入操作备注..."
                value={remark}
                onChange={e => setRemark(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>取消</Button>
            <Button onClick={confirmTransition} disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? "处理中..." : "确认"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
