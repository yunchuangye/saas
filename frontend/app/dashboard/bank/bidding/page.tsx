"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { TrendingUp, Eye, Award } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

export default function BiddingPage() {
  const { toast } = useToast()
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  const { data, isLoading } = trpc.projects.listBidding.useQuery({ page: 1, pageSize: 20 })
  const { data: bidsData } = trpc.bids.listByProject.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  )
  const awardBidMutation = trpc.bids.award.useMutation({
    onSuccess: () => { toast({ title: "中标确认成功" }); setIsViewOpen(false) },
    onError: (err) => toast({ title: "操作失败", description: err.message, variant: "destructive" }),
  })

  const projects = data?.items ?? []
  const bids = bidsData ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">竞价管理</h1>
        <p className="text-muted-foreground">查看竞价项目和报价情况，选择中标方</p>
      </div>
      <Card>
        <CardHeader><CardTitle>竞价中项目 ({projects.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mb-4 opacity-30" /><p>暂无竞价项目</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>项目编号</TableHead>
                  <TableHead>项目名称</TableHead>
                  <TableHead>物业类型</TableHead>
                  <TableHead>截止时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.projectNo}</TableCell>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>{p.propertyType ?? "-"}</TableCell>
                    <TableCell>{p.deadline ? new Date(p.deadline).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedProjectId(p.id); setIsViewOpen(true) }}>
                        <Eye className="mr-1 h-4 w-4" />查看报价
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>竞价报价列表</DialogTitle></DialogHeader>
          {bids.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无报价</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>报价方</TableHead>
                  <TableHead>报价金额</TableHead>
                  <TableHead>预计天数</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.map((bid: any) => (
                  <TableRow key={bid.id}>
                    <TableCell>评估公司 #{bid.orgId}</TableCell>
                    <TableCell className="font-medium">¥{Number(bid.price).toLocaleString()}</TableCell>
                    <TableCell>{bid.estimatedDays} 天</TableCell>
                    <TableCell className="text-muted-foreground">{bid.note ?? "-"}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => awardBidMutation.mutate({ bidId: bid.id })}>
                        <Award className="mr-1 h-4 w-4" />选为中标
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
