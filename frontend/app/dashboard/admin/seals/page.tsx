"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
  Stamp, CheckCircle, XCircle, Clock, Eye, Shield, Loader2, AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

const sealTypeMap: Record<string, string> = {
  org_seal: "机构公章",
  personal_seal: "个人执业章",
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "待审核", variant: "secondary" },
  approved: { label: "已通过", variant: "default" },
  rejected: { label: "已拒绝", variant: "destructive" },
  disabled: { label: "已禁用", variant: "outline" },
}

export default function AdminSealsPage() {
  const { toast } = useToast()
  const [statusFilter, setStatusFilter] = useState("pending")
  const [page, setPage] = useState(1)
  const [reviewTarget, setReviewTarget] = useState<any>(null)
  const [reviewComment, setReviewComment] = useState("")
  const [previewSeal, setPreviewSeal] = useState<any>(null)

  const { data, isLoading, refetch } = trpc.seals.getAllSeals.useQuery({
    status: statusFilter || undefined,
    page,
    pageSize: 20,
  })

  const reviewMutation = trpc.seals.reviewSeal.useMutation({
    onSuccess: (_, vars) => {
      toast({ title: vars.approved ? "签章已审核通过" : "签章已拒绝" })
      setReviewTarget(null)
      setReviewComment("")
      refetch()
    },
    onError: (err: any) => toast({ title: "操作失败", description: err.message, variant: "destructive" }),
  })

  const handleReview = (approved: boolean) => {
    if (!reviewTarget) return
    if (!approved && !reviewComment.trim()) {
      toast({ title: "请填写拒绝原因", variant: "destructive" })
      return
    }
    reviewMutation.mutate({ id: reviewTarget.id, approved, comment: reviewComment })
  }

  const formatDate = (d: any) => {
    if (!d) return "—"
    try { return format(new Date(d), "yyyy-MM-dd HH:mm", { locale: zhCN }) } catch { return "—" }
  }

  const items = (data?.items as any[]) ?? []
  const total = data?.total ?? 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            签章审核管理
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            审核各机构提交的电子签章，确保签章合法有效
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="全部状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部</SelectItem>
              <SelectItem value="pending">待审核</SelectItem>
              <SelectItem value="approved">已通过</SelectItem>
              <SelectItem value="rejected">已拒绝</SelectItem>
              <SelectItem value="disabled">已禁用</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "待审核", status: "pending", icon: Clock, color: "text-yellow-600" },
          { label: "已通过", status: "approved", icon: CheckCircle, color: "text-green-600" },
          { label: "已拒绝", status: "rejected", icon: XCircle, color: "text-red-600" },
          { label: "已禁用", status: "disabled", icon: AlertCircle, color: "text-gray-500" },
        ].map(({ label, status, icon: Icon, color }) => (
          <Card
            key={status}
            className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === status ? "ring-2 ring-primary" : ""}`}
            onClick={() => { setStatusFilter(status); setPage(1) }}
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Icon className={`h-8 w-8 ${color}`} />
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{statusFilter === status ? total : "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 签章列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">签章列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Stamp className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">暂无签章记录</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">签章图片</TableHead>
                  <TableHead>签章名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>所属机构</TableHead>
                  <TableHead>申请人</TableHead>
                  <TableHead>证书编号</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>提交时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((seal: any) => {
                  const status = statusMap[seal.status] || statusMap.pending
                  return (
                    <TableRow key={seal.id}>
                      <TableCell>
                        <div
                          className="w-10 h-10 border rounded overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer hover:opacity-80"
                          onClick={() => setPreviewSeal(seal)}
                        >
                          {seal.image_url ? (
                            <img src={seal.image_url} alt={seal.name} className="w-full h-full object-contain" />
                          ) : (
                            <Stamp className="h-5 w-5 text-gray-300" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{seal.name}</TableCell>
                      <TableCell>
                        <span className="text-xs">{sealTypeMap[seal.type] || seal.type}</span>
                      </TableCell>
                      <TableCell className="text-sm">{seal.org_name || "—"}</TableCell>
                      <TableCell className="text-sm">{seal.real_name || seal.user_name || "机构"}</TableCell>
                      <TableCell className="text-xs font-mono">{seal.certificate_no || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(seal.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewSeal(seal)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {seal.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => { setReviewTarget(seal); setReviewComment("") }}
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

      {/* 分页 */}
      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">共 {total} 条记录</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
            <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>下一页</Button>
          </div>
        </div>
      )}

      {/* 审核对话框 */}
      {reviewTarget && (
        <Dialog open={!!reviewTarget} onOpenChange={() => setReviewTarget(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>审核签章</DialogTitle>
              <DialogDescription>请仔细核查签章图片和证书信息后进行审核</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  {reviewTarget.image_url ? (
                    <img src={reviewTarget.image_url} alt={reviewTarget.name} className="w-full h-full object-contain" />
                  ) : (
                    <Stamp className="h-8 w-8 text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{reviewTarget.name}</p>
                  <p className="text-sm text-muted-foreground">{sealTypeMap[reviewTarget.type]}</p>
                  <p className="text-sm text-muted-foreground">{reviewTarget.org_name}</p>
                  {reviewTarget.certificate_no && (
                    <p className="text-xs font-mono text-muted-foreground mt-1">{reviewTarget.certificate_no}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>审核意见（拒绝时必填）</Label>
                <Textarea
                  placeholder="填写审核意见，拒绝时请说明原因..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setReviewTarget(null)}>取消</Button>
              <Button
                variant="destructive"
                onClick={() => handleReview(false)}
                disabled={reviewMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                拒绝
              </Button>
              <Button
                onClick={() => handleReview(true)}
                disabled={reviewMutation.isPending}
              >
                {reviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                通过
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 签章预览对话框 */}
      {previewSeal && (
        <Dialog open={!!previewSeal} onOpenChange={() => setPreviewSeal(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{previewSeal.name}</DialogTitle>
              <DialogDescription>
                {sealTypeMap[previewSeal.type]} · {statusMap[previewSeal.status]?.label}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-48 h-48 border rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                {previewSeal.image_url ? (
                  <img src={previewSeal.image_url} alt={previewSeal.name} className="w-full h-full object-contain" />
                ) : (
                  <Stamp className="h-16 w-16 text-gray-300" />
                )}
              </div>
              <div className="w-full space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">所属机构</span>
                  <span>{previewSeal.org_name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">申请人</span>
                  <span>{previewSeal.real_name || previewSeal.user_name || "机构"}</span>
                </div>
                {previewSeal.certificate_no && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">证书编号</span>
                    <span className="font-mono text-xs">{previewSeal.certificate_no}</span>
                  </div>
                )}
                {previewSeal.valid_until && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">有效期至</span>
                    <span>{formatDate(previewSeal.valid_until)}</span>
                  </div>
                )}
                {previewSeal.review_comment && (
                  <div className="p-2 rounded bg-gray-50 text-xs text-muted-foreground">
                    审核意见：{previewSeal.review_comment}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )

  function formatDate(d: any) {
    if (!d) return "—"
    try { return format(new Date(d), "yyyy-MM-dd", { locale: zhCN }) } catch { return "—" }
  }
}
