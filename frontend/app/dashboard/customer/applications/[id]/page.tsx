"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Banknote,
  Download,
  AlertCircle,
  Trophy,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const statusMap: Record<string, { label: string; color: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending:    { label: "待竞价", color: "text-yellow-600",  variant: "secondary" },
  bidding:    { label: "竞价中", color: "text-blue-600",    variant: "default" },
  awarded:    { label: "已中标", color: "text-green-600",   variant: "outline" },
  surveying:  { label: "勘察中", color: "text-purple-600",  variant: "default" },
  reporting:  { label: "报告编制", color: "text-indigo-600", variant: "default" },
  reviewing:  { label: "审核中", color: "text-orange-600",  variant: "secondary" },
  completed:  { label: "已完成", color: "text-green-700",   variant: "outline" },
  cancelled:  { label: "已取消", color: "text-red-600",     variant: "destructive" },
}

const progressSteps = [
  { key: "pending",   label: "提交申请" },
  { key: "bidding",   label: "竞价中" },
  { key: "awarded",   label: "已中标" },
  { key: "surveying", label: "现场勘察" },
  { key: "reporting", label: "报告编制" },
  { key: "reviewing", label: "审核中" },
  { key: "completed", label: "已完成" },
]

const stepOrder = progressSteps.map((s) => s.key)

function getStepIndex(status: string) {
  const idx = stepOrder.indexOf(status)
  return idx === -1 ? 0 : idx
}

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const projectId = parseInt(id)
  const router = useRouter()
  const { toast } = useToast()

  const [awardDialogOpen, setAwardDialogOpen] = useState(false)
  const [selectedBidId, setSelectedBidId] = useState<number | null>(null)
  const [selectedBidInfo, setSelectedBidInfo] = useState<any>(null)

  const { data: project, isLoading: projectLoading, refetch: refetchProject } = trpc.projects.get.useQuery(
    { id: projectId },
    { enabled: !isNaN(projectId) }
  )

  const { data: bids, isLoading: bidsLoading, refetch: refetchBids } = trpc.bids.listByProject.useQuery(
    { projectId },
    { enabled: !isNaN(projectId) }
  )

  const awardMutation = trpc.bids.award.useMutation({
    onSuccess: () => {
      toast({ title: "选择成功", description: "已成功选择中标评估公司，项目即将进入勘察阶段" })
      setAwardDialogOpen(false)
      refetchProject()
      refetchBids()
    },
    onError: (err: any) => {
      toast({ title: "操作失败", description: err.message, variant: "destructive" })
    },
  })

  const handleSelectBid = (bid: any) => {
    setSelectedBidId(bid.id)
    setSelectedBidInfo(bid)
    setAwardDialogOpen(true)
  }

  const handleConfirmAward = () => {
    if (!selectedBidId) return
    awardMutation.mutate({ bidId: selectedBidId })
  }

  if (isNaN(projectId)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mb-4 opacity-40" />
        <p>无效的申请 ID</p>
      </div>
    )
  }

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mb-4 opacity-40" />
        <p>申请不存在或无权查看</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/customer/applications")}>
          返回列表
        </Button>
      </div>
    )
  }

  const statusInfo = statusMap[(project as any).status] ?? { label: (project as any).status, color: "text-gray-600", variant: "outline" as const }
  const currentStepIdx = getStepIndex((project as any).status)
  const isCancelled = (project as any).status === "cancelled"
  const isBidding = (project as any).status === "bidding"
  const hasAwardedBid = bids?.some((b: any) => b.status === "awarded")

  // 解析附件
  let attachments: { name: string; url: string; size?: number }[] = []
  try {
    if ((project as any).attachments) {
      attachments = typeof (project as any).attachments === "string"
        ? JSON.parse((project as any).attachments)
        : (project as any).attachments
    }
  } catch {}

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 顶部导航 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/customer/applications")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回列表
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{(project as any).title}</h1>
          <p className="text-muted-foreground text-sm font-mono">{(project as any).projectNo}</p>
        </div>
        <Badge variant={statusInfo.variant} className="text-sm px-3 py-1">
          {statusInfo.label}
        </Badge>
      </div>

      {/* 进度条（取消时不显示） */}
      {!isCancelled && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">申请进度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between relative">
              {/* 连接线 */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted mx-8" />
              <div
                className="absolute top-4 left-0 h-0.5 bg-primary mx-8 transition-all duration-500"
                style={{ width: `${(currentStepIdx / (progressSteps.length - 1)) * 100}%` }}
              />
              {progressSteps.map((step, idx) => {
                const isDone = idx < currentStepIdx
                const isCurrent = idx === currentStepIdx
                return (
                  <div key={step.key} className="flex flex-col items-center gap-1 z-10">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center border-2 bg-background transition-colors ${
                        isDone ? "border-primary bg-primary text-primary-foreground" :
                        isCurrent ? "border-primary text-primary" :
                        "border-muted text-muted-foreground"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className={`h-4 w-4 ${isCurrent ? "fill-primary" : ""}`} />
                      )}
                    </div>
                    <span className={`text-xs whitespace-nowrap ${isCurrent ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 左侧：房产信息 */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                房产信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {(project as any).propertyAddress && (
                  <div className="col-span-2 flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs">房产地址</p>
                      <p className="font-medium">{(project as any).propertyAddress}</p>
                    </div>
                  </div>
                )}
                {(project as any).propertyType && (
                  <div>
                    <p className="text-muted-foreground text-xs">物业类型</p>
                    <p className="font-medium">{(project as any).propertyType}</p>
                  </div>
                )}
                {(project as any).propertyArea && (
                  <div>
                    <p className="text-muted-foreground text-xs">建筑面积</p>
                    <p className="font-medium">{(project as any).propertyArea} ㎡</p>
                  </div>
                )}
                {(project as any).floor && (
                  <div>
                    <p className="text-muted-foreground text-xs">所在楼层</p>
                    <p className="font-medium">{(project as any).floor}</p>
                  </div>
                )}
                {(project as any).buildYear && (
                  <div>
                    <p className="text-muted-foreground text-xs">建成年份</p>
                    <p className="font-medium">{(project as any).buildYear} 年</p>
                  </div>
                )}
                {(project as any).purpose && (
                  <div>
                    <p className="text-muted-foreground text-xs">评估目的</p>
                    <p className="font-medium">{(project as any).purpose}</p>
                  </div>
                )}
              </div>
              {(project as any).description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">补充说明</p>
                    <p className="text-sm">{(project as any).description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 竞价列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                收到的报价
                {bids && bids.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{bids.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bidsLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : !bids || bids.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Clock className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">暂无报价，等待评估公司竞价中</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bids.map((bid: any, idx: number) => (
                    <div
                      key={bid.id}
                      className={`rounded-lg border p-4 ${bid.status === "awarded" ? "border-green-500 bg-green-50" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">报价 #{idx + 1}</span>
                          {bid.status === "awarded" && (
                            <Badge className="bg-green-500 text-white text-xs">已中标</Badge>
                          )}
                          {bid.status === "pending" && (
                            <Badge variant="secondary" className="text-xs">待选择</Badge>
                          )}
                          {bid.status === "rejected" && (
                            <Badge variant="destructive" className="text-xs">已拒绝</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(bid.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">报价金额</p>
                          <p className="font-semibold text-lg text-primary">
                            ¥{Number(bid.price).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">预计天数</p>
                          <p className="font-medium">{bid.days ?? bid.estimatedDays ?? "-"} 天</p>
                        </div>
                      </div>
                      {bid.message && (
                        <p className="text-sm text-muted-foreground mt-2 border-t pt-2">{bid.message}</p>
                      )}
                      {/* 选择中标按钮 */}
                      {isBidding && !hasAwardedBid && bid.status === "pending" && (
                        <div className="mt-3 pt-3 border-t">
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleSelectBid(bid)}
                          >
                            <Trophy className="h-4 w-4 mr-2" />
                            选择此评估公司
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧：联系人和附件 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                联系人信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(project as any).contactName && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">联系人</p>
                    <p className="font-medium">{(project as any).contactName}</p>
                  </div>
                </div>
              )}
              {(project as any).contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">手机号码</p>
                    <p className="font-medium">{(project as any).contactPhone}</p>
                  </div>
                </div>
              )}
              {!(project as any).contactName && !(project as any).contactPhone && (
                <p className="text-muted-foreground text-sm">暂无联系人信息</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                申请时间
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>
                <p className="text-muted-foreground text-xs">提交时间</p>
                <p className="font-medium">{new Date((project as any).createdAt).toLocaleString()}</p>
              </div>
              {(project as any).deadline && (
                <div>
                  <p className="text-muted-foreground text-xs">截止时间</p>
                  <p className="font-medium">{new Date((project as any).deadline).toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  上传资料
                  <Badge variant="secondary">{attachments.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded border p-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {/* 选择中标确认弹窗 */}
      <Dialog open={awardDialogOpen} onOpenChange={setAwardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              确认选择中标评估公司
            </DialogTitle>
            <DialogDescription>
              您即将选择此评估公司承接本项目，选择后将无法更改，请确认。
            </DialogDescription>
          </DialogHeader>
          {selectedBidInfo && (
            <div className="rounded-lg border p-4 bg-muted/30 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">报价金额</span>
                <span className="font-semibold text-primary">¥{Number(selectedBidInfo.price).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">预计完成天数</span>
                <span className="font-medium">{selectedBidInfo.days ?? selectedBidInfo.estimatedDays ?? "-"} 天</span>
              </div>
              {selectedBidInfo.message && (
                <div>
                  <p className="text-muted-foreground">评估公司留言</p>
                  <p className="mt-1 text-foreground">{selectedBidInfo.message}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAwardDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleConfirmAward}
              disabled={awardMutation.isPending}
            >
              {awardMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />处理中...</>
              ) : (
                <><Trophy className="h-4 w-4 mr-2" />确认选择</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
