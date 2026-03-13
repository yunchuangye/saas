"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Clock, MapPin, Building2, Banknote, ArrowRight, CheckCircle, Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

export default function AppraiserBiddingPage() {
  const { toast } = useToast()
  const [isBidDialogOpen, setIsBidDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [bidAmount, setBidAmount] = useState("")
  const [bidDays, setBidDays] = useState("")
  const [bidNote, setBidNote] = useState("")

  const { data, isLoading, refetch } = trpc.projects.listBidding.useQuery({ page: 1, pageSize: 20 })
  const submitBidMutation = trpc.bids.submit.useMutation({
    onSuccess: () => {
      toast({ title: "竞价成功", description: "您的报价已提交，等待客户选择" })
      setIsBidDialogOpen(false)
      setBidAmount(""); setBidDays(""); setBidNote("")
      refetch()
    },
    onError: (err) => toast({ title: "提交失败", description: err.message, variant: "destructive" }),
  })

  const biddingProjects = data?.items ?? []

  const handleSubmitBid = () => {
    if (!selectedProject || !bidAmount || !bidDays) {
      toast({ title: "请填写完整信息", variant: "destructive" })
      return
    }
    submitBidMutation.mutate({
      projectId: selectedProject.id,
      price: parseFloat(bidAmount),
      estimatedDays: parseInt(bidDays),
      note: bidNote,
    })
  }

  function getTimeLeft(deadline: string | null) {
    if (!deadline) return "无截止时间"
    const diff = new Date(deadline).getTime() - Date.now()
    if (diff <= 0) return "已截止"
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    return `${days}天 ${hours}小时`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">竞价项目</h1>
          <p className="text-muted-foreground">查看并参与当前开放竞价的评估项目</p>
        </div>
        <Badge variant="secondary">
          <Clock className="mr-1 h-3 w-3" />
          {biddingProjects.length} 个项目竞价中
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : biddingProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Clock className="h-12 w-12 mb-4 opacity-30" />
            <p>暂无竞价项目</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {biddingProjects.map((project: any) => (
            <Card key={project.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 flex-wrap">
                      <span className="font-mono text-xs">{project.projectNo}</span>
                      <Badge variant="outline">{project.propertyType ?? "未分类"}</Badge>
                      <Badge className="bg-primary/10 text-primary border-0">竞价中</Badge>
                    </CardDescription>
                  </div>
                  <div className="text-right text-sm">
                    <div className="flex items-center gap-1 text-warning font-medium">
                      <Clock className="h-4 w-4" />
                      剩余 {getTimeLeft(project.deadline)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">{project.propertyAddress ?? "地址待填写"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{project.propertyArea ? `${project.propertyArea}㎡` : "面积未知"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {project.budgetMin && project.budgetMax
                        ? `¥${Number(project.budgetMin).toLocaleString()} - ¥${Number(project.budgetMax).toLocaleString()}`
                        : "预算待定"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>截止: {project.deadline ? new Date(project.deadline).toLocaleDateString() : "未设置"}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground line-clamp-1">{project.description ?? "暂无描述"}</p>
                  <Button onClick={() => { setSelectedProject(project); setIsBidDialogOpen(true) }}>
                    立即竞价
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isBidDialogOpen} onOpenChange={setIsBidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>提交竞价</DialogTitle>
            <DialogDescription>{selectedProject?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>报价金额（元）</Label>
              <Input type="number" placeholder="请输入报价金额" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>预计完成天数</Label>
              <Input type="number" placeholder="请输入预计天数" value={bidDays} onChange={(e) => setBidDays(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>备注说明（选填）</Label>
              <Textarea placeholder="请输入竞价备注" value={bidNote} onChange={(e) => setBidNote(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBidDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmitBid} disabled={submitBidMutation.isPending}>
              {submitBidMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />提交中...</> : <><CheckCircle className="mr-2 h-4 w-4" />确认提交</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
