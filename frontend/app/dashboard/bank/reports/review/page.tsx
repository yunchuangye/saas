"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, XCircle, Clock, FileText, MessageSquare, Building2, Eye } from "lucide-react"

const pendingReviews = [
  {
    id: "RPT-2024-016",
    title: "通州区工业厂房评估报告",
    company: "华信评估",
    companyAvatar: "华信",
    type: "工业",
    submittedAt: "2024-03-10 09:30",
    projectId: "PRJ-2024-016",
  },
  {
    id: "RPT-2024-014",
    title: "朝阳区住宅评估报告",
    company: "中房评估",
    companyAvatar: "中房",
    type: "住宅",
    submittedAt: "2024-03-09 16:45",
    projectId: "PRJ-2024-014",
  },
]

export default function BankReportsReviewPage() {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<typeof pendingReviews[0] | null>(null)
  const [comment, setComment] = useState("")
  const [rejectReason, setRejectReason] = useState("")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">报告审核</h1>
          <p className="text-muted-foreground">审核评估公司提交的报告</p>
        </div>
        <Badge variant="secondary" className="bg-warning/10 text-warning">
          <Clock className="mr-1 h-3 w-3" />
          {pendingReviews.length} 份待审核
        </Badge>
      </div>

      <div className="grid gap-4">
        {pendingReviews.map((review) => (
          <Card key={review.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarFallback className="text-xs">{review.companyAvatar}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-lg">{review.title}</CardTitle>
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {review.company}
                      </span>
                      <Badge variant="outline">{review.type}</Badge>
                      <span className="font-mono text-xs">{review.projectId}</span>
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-warning/10 text-warning">
                  待审核
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  提交时间: {review.submittedAt}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedReview(review)
                    setIsViewDialogOpen(true)
                  }}>
                    <Eye className="mr-2 h-4 w-4" />
                    查看报告
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedReview(review)
                    setIsCommentDialogOpen(true)
                  }}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    添加意见
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => {
                    setSelectedReview(review)
                    setIsRejectDialogOpen(true)
                  }}>
                    <XCircle className="mr-2 h-4 w-4" />
                    退回
                  </Button>
                  <Button size="sm" onClick={() => {
                    setSelectedReview(review)
                    setIsApproveDialogOpen(true)
                  }}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    通过
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pendingReviews.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          暂无待审核的报告
        </div>
      )}

      {/* 查看报告对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>报告预览</DialogTitle>
            <DialogDescription>{selectedReview?.id}</DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedReview.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{selectedReview.type}</Badge>
                  <span className="text-sm text-muted-foreground">项目编号: {selectedReview.projectId}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">评估公司</p>
                  <p className="font-medium">{selectedReview.company}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">提交时间</p>
                  <p className="font-medium">{selectedReview.submittedAt}</p>
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">报告摘要</p>
                <p className="text-sm">本报告对标的物业进行了详细的市场价值评估，采用了市场比较法和收益法进行综合分析，评估结论客观、公正。</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              关闭
            </Button>
            <Button>下载完整报告</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加意见对话框 */}
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>添加审核意见</DialogTitle>
            <DialogDescription>
              为 {selectedReview?.title} 添加审核意见
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="comment">审核意见</Label>
              <Textarea
                id="comment"
                placeholder="请输入您的审核意见..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCommentDialogOpen(false)
              setComment("")
            }}>
              取消
            </Button>
            <Button onClick={() => {
              alert(`意见已添加: ${comment}`)
              setIsCommentDialogOpen(false)
              setComment("")
            }} disabled={!comment.trim()}>
              提交意见
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 退回对话框 */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>退回报告</DialogTitle>
            <DialogDescription>
              请填写退回原因
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>退回报告</Label>
              <p className="text-sm text-muted-foreground">{selectedReview?.title}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reject-reason">退回原因</Label>
              <Textarea
                id="reject-reason"
                placeholder="请详细说明需要修改的内容和原因"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsRejectDialogOpen(false)
              setRejectReason("")
            }}>
              取消
            </Button>
            <Button variant="destructive" onClick={() => {
              alert(`已退回报告: ${selectedReview?.title}\n退回原因: ${rejectReason}`)
              setIsRejectDialogOpen(false)
              setRejectReason("")
            }} disabled={!rejectReason.trim()}>
              确认退回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 通过对话框 */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>确认通过审核</DialogTitle>
            <DialogDescription>
              通过后报告将进入归档状态
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">确定通过以下报告的审核吗？</p>
            <p className="font-medium mt-2">{selectedReview?.title}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => {
              alert(`已通过报告审核: ${selectedReview?.title}`)
              setIsApproveDialogOpen(false)
            }}>
              <CheckCircle className="mr-2 h-4 w-4" />
              确认通过
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
