"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ArrowRight,
  Loader2,
  Shield,
  Users,
  Star,
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

const REVIEW_LEVEL_INFO = [
  { level: 1, label: "内部复核", icon: Users, color: "text-blue-500", bgColor: "bg-blue-50" },
  { level: 2, label: "同行评审", icon: Star, color: "text-purple-500", bgColor: "bg-purple-50" },
  { level: 3, label: "主任审核", icon: Shield, color: "text-orange-500", bgColor: "bg-orange-50" },
  { level: 4, label: "已完成", icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-50" },
]

function ReviewLevelBadge({ level }: { level: number }) {
  const info = REVIEW_LEVEL_INFO.find(i => i.level === level)
  if (!info) return <Badge variant="secondary">草稿</Badge>
  return (
    <Badge variant="outline" className={`${info.color} border-current`}>
      {info.label}
    </Badge>
  )
}

export default function ThreeLevelReviewPage() {
  const { toast } = useToast()
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean
    reportId: number | null
    reportTitle: string
    level: number
  }>({ open: false, reportId: null, reportTitle: "", level: 0 })
  const [comment, setComment] = useState("")

  const { data: pendingList, isLoading, refetch } = trpc.threeLevelReview.pendingMyReview.useQuery()
  const reports = Array.isArray(pendingList) ? pendingList : []

  const internalMutation = trpc.threeLevelReview.internalReview.useMutation({
    onSuccess: (data) => {
      toast({ title: "操作成功", description: data.message })
      setReviewDialog({ open: false, reportId: null, reportTitle: "", level: 0 })
      setComment("")
      refetch()
    },
    onError: (err: any) => toast({ title: "操作失败", description: err.message, variant: "destructive" }),
  })

  const peerMutation = trpc.threeLevelReview.peerReview.useMutation({
    onSuccess: (data) => {
      toast({ title: "操作成功", description: data.message })
      setReviewDialog({ open: false, reportId: null, reportTitle: "", level: 0 })
      setComment("")
      refetch()
    },
    onError: (err: any) => toast({ title: "操作失败", description: err.message, variant: "destructive" }),
  })

  const chiefMutation = trpc.threeLevelReview.chiefReview.useMutation({
    onSuccess: (data) => {
      toast({ title: "操作成功", description: data.message })
      setReviewDialog({ open: false, reportId: null, reportTitle: "", level: 0 })
      setComment("")
      refetch()
    },
    onError: (err: any) => toast({ title: "操作失败", description: err.message, variant: "destructive" }),
  })

  const isPending = internalMutation.isPending || peerMutation.isPending || chiefMutation.isPending

  const openDialog = (report: any) => {
    setReviewDialog({
      open: true,
      reportId: report.id,
      reportTitle: report.title,
      level: report.review_level ?? 0,
    })
    setComment("")
  }

  const handleApprove = () => {
    if (!reviewDialog.reportId) return
    const id = reviewDialog.reportId
    if (reviewDialog.level === 1) internalMutation.mutate({ reportId: id, approved: true, comment: comment || undefined })
    else if (reviewDialog.level === 2) peerMutation.mutate({ reportId: id, approved: true, comment: comment || undefined })
    else if (reviewDialog.level === 3) chiefMutation.mutate({ reportId: id, approved: true, comment: comment || undefined })
  }

  const handleReject = () => {
    if (!reviewDialog.reportId) return
    if (!comment.trim()) { toast({ title: "请填写驳回原因", variant: "destructive" }); return }
    const id = reviewDialog.reportId
    if (reviewDialog.level === 1) internalMutation.mutate({ reportId: id, approved: false, comment })
    else if (reviewDialog.level === 2) peerMutation.mutate({ reportId: id, approved: false, comment })
    else if (reviewDialog.level === 3) chiefMutation.mutate({ reportId: id, approved: false, comment })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">三级审核管理</h1>
        <p className="text-muted-foreground">符合《房地产估价规范》的三级审核流程：内部复核 → 同行评审 → 主任审核</p>
      </div>

      {/* 流程说明 */}
      <div className="grid grid-cols-4 gap-3">
        {REVIEW_LEVEL_INFO.map((info, idx) => {
          const Icon = info.icon
          return (
            <Card key={info.level} className={`${info.bgColor} border-0`}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`h-5 w-5 ${info.color}`} />
                  <span className="font-semibold text-sm">{info.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {idx === 0 && "同机构评估师互审，检查基础数据和方法"}
                  {idx === 1 && "资深评估师评审，验证估价方法和结论"}
                  {idx === 2 && "主任评估师终审，签发报告"}
                  {idx === 3 && "报告正式批准，可对外发布"}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 待审核列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            待我审核的报告
            {reports.length > 0 && <Badge variant="secondary">{reports.length}</Badge>}
          </CardTitle>
          <CardDescription>
            根据您的角色权限，显示需要您参与审核的报告
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mb-4 opacity-30" />
              <p>暂无待审核报告</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>报告编号</TableHead>
                  <TableHead>报告标题</TableHead>
                  <TableHead>作者</TableHead>
                  <TableHead>当前阶段</TableHead>
                  <TableHead>提交时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.report_no || `#${r.id}`}</TableCell>
                    <TableCell className="font-medium max-w-[180px] truncate">{r.title}</TableCell>
                    <TableCell className="text-sm">{r.author_name || "—"}</TableCell>
                    <TableCell><ReviewLevelBadge level={r.review_level ?? 0} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString("zh-CN") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => openDialog(r)}>
                        审核
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 审核弹窗 */}
      <Dialog open={reviewDialog.open} onOpenChange={(open) => setReviewDialog({ ...reviewDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {reviewDialog.level === 1 && "内部复核"}
              {reviewDialog.level === 2 && "同行评审"}
              {reviewDialog.level === 3 && "主任审核"}
            </DialogTitle>
            <DialogDescription className="truncate">
              {reviewDialog.reportTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border p-3 bg-muted/30 text-sm">
              <p className="font-medium mb-1">
                {reviewDialog.level === 1 && "内部复核要点："}
                {reviewDialog.level === 2 && "同行评审要点："}
                {reviewDialog.level === 3 && "主任审核要点："}
              </p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                {reviewDialog.level === 1 && (
                  <>
                    <li>• 检查基础数据来源是否可靠</li>
                    <li>• 验证估价方法选择是否恰当</li>
                    <li>• 核实计算过程是否正确</li>
                  </>
                )}
                {reviewDialog.level === 2 && (
                  <>
                    <li>• 评估结论是否符合市场实际</li>
                    <li>• 可比案例选取是否合理</li>
                    <li>• 修正系数是否有依据</li>
                  </>
                )}
                {reviewDialog.level === 3 && (
                  <>
                    <li>• 报告格式是否符合规范</li>
                    <li>• 估价结论是否合理</li>
                    <li>• 签发后承担相应法律责任</li>
                  </>
                )}
              </ul>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                审核意见 {reviewDialog.level === 3 ? "" : "（驳回时必填）"}
              </label>
              <Textarea
                placeholder="请输入审核意见..."
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewDialog({ ...reviewDialog, open: false })}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4 mr-1" />驳回</>}
            </Button>
            <Button onClick={handleApprove} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-1" />通过</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
