"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Clock, MapPin, Building2, Banknote, ArrowRight, CheckCircle } from "lucide-react"

const biddingProjects = [
  {
    id: "BID-2024-001",
    title: "朝阳区CBD商业综合体评估",
    bank: "中国银行北京分行",
    location: "北京市朝阳区建国路88号",
    type: "商业",
    budget: "¥50,000 - ¥80,000",
    deadline: "2024-03-10 18:00",
    timeLeft: "2天 6小时",
    bids: 5,
    status: "竞价中",
  },
  {
    id: "BID-2024-002",
    title: "海淀区科技园区厂房评估",
    bank: "工商银行海淀支行",
    location: "北京市海淀区中关村科技园",
    type: "工业",
    budget: "¥30,000 - ¥45,000",
    deadline: "2024-03-12 12:00",
    timeLeft: "4天 0小时",
    bids: 3,
    status: "竞价中",
  },
  {
    id: "BID-2024-003",
    title: "西城区住宅小区批量评估",
    bank: "建设银行西城支行",
    location: "北京市西城区金融街",
    type: "住宅",
    budget: "¥15,000 - ¥25,000",
    deadline: "2024-03-15 18:00",
    timeLeft: "7天 6小时",
    bids: 8,
    status: "竞价中",
  },
]

export default function AppraiserBiddingPage() {
  const [isBidDialogOpen, setIsBidDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<typeof biddingProjects[0] | null>(null)
  const [bidAmount, setBidAmount] = useState("")
  const [bidDays, setBidDays] = useState("")
  const [bidNote, setBidNote] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmitBid = () => {
    setIsSubmitted(true)
    setTimeout(() => {
      setIsBidDialogOpen(false)
      setIsSubmitted(false)
      setBidAmount("")
      setBidDays("")
      setBidNote("")
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">竞价项目</h1>
          <p className="text-muted-foreground">参与银行发布的评估项目竞价</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-info/10 text-info">
            {biddingProjects.length} 个进行中
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {biddingProjects.map((project) => (
          <Card key={project.id} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <Badge variant="outline">{project.type}</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {project.bank}
                  </CardDescription>
                </div>
                <Badge className="bg-warning/10 text-warning border-warning/20">
                  {project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{project.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">预算: {project.budget}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">剩余: {project.timeLeft}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">已有 {project.bids} 家报价</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  截止时间: {project.deadline}
                </span>
                <Button onClick={() => {
                  setSelectedProject(project)
                  setIsBidDialogOpen(true)
                }}>
                  立即报价
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 报价对话框 */}
      <Dialog open={isBidDialogOpen} onOpenChange={setIsBidDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>提交报价</DialogTitle>
            <DialogDescription>
              {selectedProject?.title}
            </DialogDescription>
          </DialogHeader>
          {isSubmitted ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <p className="text-lg font-semibold">报价提交成功</p>
              <p className="text-muted-foreground text-sm">请等待银行评审结果</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="bid-amount">报价金额 (元)</Label>
                  <Input
                    id="bid-amount"
                    type="number"
                    placeholder="请输入报价金额"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                  />
                  {selectedProject && (
                    <p className="text-sm text-muted-foreground">
                      预算范围: {selectedProject.budget}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bid-days">预计完成天数</Label>
                  <Input
                    id="bid-days"
                    type="number"
                    placeholder="请输入预计工作天数"
                    value={bidDays}
                    onChange={(e) => setBidDays(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bid-note">报价说明</Label>
                  <Textarea
                    id="bid-note"
                    placeholder="请简要说明您的报价优势和服务承诺"
                    value={bidNote}
                    onChange={(e) => setBidNote(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBidDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSubmitBid} disabled={!bidAmount || !bidDays}>
                  提交报价
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
