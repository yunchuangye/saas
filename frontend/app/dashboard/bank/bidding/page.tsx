"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Clock, Building2, Banknote, Users, CheckCircle, ArrowRight, Eye, Award } from "lucide-react"

const biddingProjects = [
  {
    id: "BID-2024-001",
    title: "朝阳区CBD商业综合体评估",
    type: "商业",
    budget: "¥50,000 - ¥80,000",
    deadline: "2024-03-10 18:00",
    timeLeft: "2天 6小时",
    bids: [
      { company: "华信评估", price: "¥65,000", rating: 4.8, time: "2.5天" },
      { company: "中房评估", price: "¥58,000", rating: 4.6, time: "3天" },
      { company: "正信评估", price: "¥72,000", rating: 4.5, time: "2天" },
    ],
    status: "竞价中",
  },
  {
    id: "BID-2024-002",
    title: "海淀区科技园区厂房评估",
    type: "工业",
    budget: "¥30,000 - ¥45,000",
    deadline: "2024-03-12 12:00",
    timeLeft: "4天 0小时",
    bids: [
      { company: "同信评估", price: "¥38,000", rating: 4.7, time: "3天" },
      { company: "华信评估", price: "¥42,000", rating: 4.8, time: "2.5天" },
    ],
    status: "竞价中",
  },
]

export default function BankBiddingPage() {
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<typeof biddingProjects[0] | null>(null)
  const [selectedBid, setSelectedBid] = useState<{ company: string; price: string; rating: number; time: string } | null>(null)

  const handleSelectBid = () => {
    alert(`已选择 ${selectedBid?.company} 作为中标方\n报价: ${selectedBid?.price}\n预计工期: ${selectedBid?.time}`)
    setIsSelectDialogOpen(false)
    setSelectedBid(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">竞价项目</h1>
          <p className="text-muted-foreground">管理您发起的竞价项目</p>
        </div>
        <Button onClick={() => window.location.href = '/dashboard/bank/demand/new'}>发起新需求</Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">竞价中 ({biddingProjects.length})</TabsTrigger>
          <TabsTrigger value="completed">已结束</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-4 mt-4">
          {biddingProjects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <Badge variant="outline">{project.type}</Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span className="font-mono text-xs">{project.id}</span>
                      <span className="flex items-center gap-1">
                        <Banknote className="h-3 w-3" />
                        {project.budget}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        剩余: {project.timeLeft}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge className="bg-warning/10 text-warning border-warning/20">
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    已有 {project.bids.length} 家评估公司报价
                  </div>
                  
                  <div className="border rounded-lg divide-y">
                    {project.bids.map((bid, index) => (
                      <div key={index} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{bid.company}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-warning">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={i < Math.floor(bid.rating) ? "" : "opacity-30"}>
                                ★
                              </span>
                            ))}
                            <span className="text-sm text-muted-foreground ml-1">{bid.rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-semibold text-primary">{bid.price}</p>
                            <p className="text-xs text-muted-foreground">预计 {bid.time}</p>
                          </div>
                          <Button size="sm" onClick={() => {
                            setSelectedProject(project)
                            setSelectedBid(bid)
                            setIsSelectDialogOpen(true)
                          }}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            选择
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => {
                      setSelectedProject(project)
                      setIsViewDialogOpen(true)
                    }}>
                      查看详情
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="completed">
          <div className="text-center py-12 text-muted-foreground">
            暂无已结束的竞价项目
          </div>
        </TabsContent>
      </Tabs>

      {/* 选择中标方对话框 */}
      <Dialog open={isSelectDialogOpen} onOpenChange={setIsSelectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>确认选择中标方</DialogTitle>
            <DialogDescription>
              确认选择后，该评估公司将获得此项目
            </DialogDescription>
          </DialogHeader>
          {selectedBid && selectedProject && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                <Award className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">{selectedBid.company}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-primary font-medium">{selectedBid.price}</span>
                    <span>·</span>
                    <span>预计 {selectedBid.time}</span>
                    <span>·</span>
                    <span className="text-warning">★ {selectedBid.rating}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">项目名称</p>
                <p className="font-medium">{selectedProject.title}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSelectDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSelectBid}>
              <CheckCircle className="mr-2 h-4 w-4" />
              确认选择
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 项目详情对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>竞价项目详情</DialogTitle>
            <DialogDescription>{selectedProject?.id}</DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedProject.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{selectedProject.type}</Badge>
                  <Badge className="bg-warning/10 text-warning border-warning/20">
                    {selectedProject.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">预算范围</p>
                  <p className="font-medium">{selectedProject.budget}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">竞价截止</p>
                  <p className="font-medium">{selectedProject.deadline}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">剩余时间</p>
                  <p className="font-medium">{selectedProject.timeLeft}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">已有报价</p>
                  <p className="font-medium">{selectedProject.bids.length} 家公司</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
