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
import { CheckCircle, XCircle, Clock, FileText, MessageSquare, Eye } from "lucide-react"

const pendingReviews = [
  {
    id: "RPT-2024-002",
    title: "海淀区商业地产评估报告",
    author: "李四",
    type: "商业",
    submittedAt: "2024-03-10 09:30",
    priority: "高",
    comments: 2,
  },
  {
    id: "RPT-2024-005",
    title: "顺义区住宅评估报告",
    author: "王五",
    type: "住宅",
    submittedAt: "2024-03-09 16:45",
    priority: "中",
    comments: 0,
  },
  {
    id: "RPT-2024-007",
    title: "昌平区土地评估报告",
    author: "赵六",
    type: "土地",
    submittedAt: "2024-03-09 11:20",
    priority: "低",
    comments: 1,
  },
]

const priorityColors: Record<string, string> = {
  "高": "bg-destructive/10 text-destructive",
  "中": "bg-warning/10 text-warning",
  "低": "bg-muted text-muted-foreground",
}

export default function AppraiserReportsReviewPage() {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<typeof pendingReviews[0] | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">审核管理</h1>
          <p className="text-muted-foreground">审核待提交的评估报告</p>
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
                    <AvatarFallback>{review.author.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-lg">{review.title}</CardTitle>
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span>提交人: {review.author}</span>
                      <Badge variant="outline">{review.type}</Badge>
                      <span className="font-mono text-xs">{review.id}</span>
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className={priorityColors[review.priority]}>
                  {review.priority}优先级
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    提交时间: {review.submittedAt}
                  </span>
                  {review.comments > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {review.comments} 条批注
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedReview(review)
                    setIsViewDialogOpen(true)
                  }}>
                    <Eye className="mr-2 h-4 w-4" />
                    查看报告
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => {
                    setSelectedReview(review)
                    setIsRejectDialogOpen(true)
                  }}>
                    <XCircle className="mr-2 h-4 w-4" />
                    退回修改
                  </Button>
                  <Button size="sm" onClick={() => {
                    setSelectedReview(review)
                    setIsApproveDialogOpen(true)
                  }}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    通过审核
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 查看报告对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>报告预览</DialogTitle>
            <DialogDescription>{selectedReview?.title}</DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">报告编号</p>
                  <p className="font-mono">{selectedReview.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">提交人</p>
                  <p>{selectedReview.author}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">报告类型</p>
                  <Badge variant="outline">{selectedReview.type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">提交时间</p>
                  <p>{selectedReview.submittedAt}</p>
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">报告摘要</p>
                <p className="text-sm">本报告对位于北京市的房产进行了详细的市场价值评估，采用了市场比较法和收益法进行综合分析...</p>
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

      {/* 退回修改对话框 */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>退回修改</DialogTitle>
            <DialogDescription>
              请填写退回原因，以便报告编制人进行修改
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
            }}>
              确认退回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 通过审核对话框 */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>确认通过审核</DialogTitle>
            <DialogDescription>
              确认通过后，报告将进入归档状态
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              您确定要通过以下报告的审核吗？
            </p>
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
