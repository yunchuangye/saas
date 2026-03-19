"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { FileText, CheckCircle, XCircle, Eye, Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft:     { label: "草稿",   variant: "secondary" },
  submitted: { label: "待审核", variant: "default" },
  reviewing: { label: "审核中", variant: "default" },
  approved:  { label: "已通过", variant: "outline" },
  rejected:  { label: "已驳回", variant: "destructive" },
  archived:  { label: "已归档", variant: "secondary" },
}

interface ReportReviewListProps {
  title?: string
  description?: string
  detailBasePath?: string // e.g. "/dashboard/bank/reports" or "/dashboard/appraiser/reports"
  showReviewActions?: boolean // 是否显示审核按钮
}

export function ReportReviewList({
  title = "报告审核",
  description = "待审核的评估报告",
  detailBasePath = "/dashboard/appraiser/reports",
  showReviewActions = true,
}: ReportReviewListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; reportId: number | null; reportTitle: string }>({
    open: false, reportId: null, reportTitle: "",
  })
  const [comment, setComment] = useState("")

  const { data, isLoading, refetch } = trpc.reports.list.useQuery({
    page: 1, pageSize: 50, status: "submitted",
  })
  const reports = data?.items ?? []

  const reviewMutation = trpc.reports.review.useMutation({
    onSuccess: (_, vars) => {
      toast({
        title: vars.approved ? "审核通过" : "已驳回",
        description: vars.approved ? "报告已通过审核" : "报告已被驳回，评估师将收到通知",
      })
      setReviewDialog({ open: false, reportId: null, reportTitle: "" })
      setComment("")
      refetch()
    },
    onError: (err: any) => {
      toast({ title: "操作失败", description: err.message, variant: "destructive" })
    },
  })

  const openReviewDialog = (report: any) => {
    setReviewDialog({ open: true, reportId: report.id, reportTitle: report.title })
    setComment("")
  }

  const handleApprove = () => {
    if (!reviewDialog.reportId) return
    reviewMutation.mutate({ id: reviewDialog.reportId, approved: true, comment: comment || undefined })
  }

  const handleReject = () => {
    if (!reviewDialog.reportId) return
    if (!comment.trim()) {
      toast({ title: "请填写驳回原因", variant: "destructive" })
      return
    }
    reviewMutation.mutate({ id: reviewDialog.reportId, approved: false, comment })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            待审核报告
            {reports.length > 0 && (
              <Badge variant="secondary">{reports.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-30" />
              <p>暂无待审核报告</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>报告编号</TableHead>
                  <TableHead>报告标题</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>提交时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r: any) => {
                  const si = statusMap[r.status] ?? { label: r.status, variant: "secondary" as const }
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.reportNo || `#${r.id}`}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{r.title}</TableCell>
                      <TableCell>
                        <Badge variant={si.variant} className="text-xs">{si.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.submittedAt
                          ? new Date(r.submittedAt).toLocaleDateString("zh-CN")
                          : new Date(r.createdAt).toLocaleDateString("zh-CN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`${detailBasePath}/${r.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            查看
                          </Button>
                          {showReviewActions && r.status === "submitted" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openReviewDialog(r)}
                            >
                              审核
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 审核弹窗 */}
      <Dialog open={reviewDialog.open} onOpenChange={(open) => setReviewDialog({ ...reviewDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>审核报告</DialogTitle>
            <DialogDescription className="truncate">
              {reviewDialog.reportTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">审核意见（驳回时必填）</label>
              <Textarea
                placeholder="请输入审核意见..."
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setReviewDialog({ ...reviewDialog, open: false })}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <><XCircle className="h-4 w-4 mr-1" />驳回</>
              )}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <><CheckCircle className="h-4 w-4 mr-1" />通过</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
