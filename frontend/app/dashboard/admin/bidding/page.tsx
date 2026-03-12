"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Building2, Banknote, Users, Eye, Landmark } from "lucide-react"

const activeBiddings = [
  {
    id: "BID-2024-010",
    title: "朝阳区CBD商业综合体评估",
    bank: "中国银行朝阳支行",
    type: "商业",
    budget: "¥50,000 - ¥80,000",
    deadline: "2024-03-15 18:00",
    timeLeft: "5天 6小时",
    bids: 5,
  },
  {
    id: "BID-2024-009",
    title: "海淀区科技园区厂房评估",
    bank: "工商银行海淀支行",
    type: "工业",
    budget: "¥30,000 - ¥45,000",
    deadline: "2024-03-12 12:00",
    timeLeft: "2天 0小时",
    bids: 3,
  },
  {
    id: "BID-2024-008",
    title: "西城区住宅小区批量评估",
    bank: "建设银行西城支行",
    type: "住宅",
    budget: "¥15,000 - ¥25,000",
    deadline: "2024-03-18 18:00",
    timeLeft: "8天 6小时",
    bids: 8,
  },
]

export default function AdminBiddingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">竞价管理</h1>
          <p className="text-muted-foreground">监控平台所有竞价项目</p>
        </div>
        <Badge variant="secondary" className="bg-info/10 text-info">
          {activeBiddings.length} 个进行中
        </Badge>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">竞价中</TabsTrigger>
          <TabsTrigger value="completed">已结束</TabsTrigger>
          <TabsTrigger value="cancelled">已取消</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-4 mt-4">
          {activeBiddings.map((bidding) => (
            <Card key={bidding.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{bidding.title}</CardTitle>
                      <Badge variant="outline">{bidding.type}</Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span className="font-mono text-xs">{bidding.id}</span>
                      <span className="flex items-center gap-1">
                        <Landmark className="h-3 w-3" />
                        {bidding.bank}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge className="bg-warning/10 text-warning border-warning/20">
                    竞价中
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Banknote className="h-4 w-4" />
                      {bidding.budget}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      剩余: {bidding.timeLeft}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {bidding.bids} 家报价
                    </span>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    查看详情
                  </Button>
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
        <TabsContent value="cancelled">
          <div className="text-center py-12 text-muted-foreground">
            暂无已取消的竞价项目
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
