"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp } from "lucide-react"
import { trpc } from "@/lib/trpc"

export default function AdminBiddingPage() {
  const { data, isLoading } = trpc.bids.listAll.useQuery({ page: 1, pageSize: 30 })
  const bids = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">竞价管理</h1>
          <p className="text-muted-foreground">查看所有竞价记录</p>
        </div>
        <Badge variant="secondary">共 {total} 条记录</Badge>
      </div>
      <Card>
        <CardHeader><CardTitle>全部竞价记录</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : bids.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mb-4 opacity-30" /><p>暂无竞价数据</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>项目ID</TableHead>
                  <TableHead>报价方</TableHead>
                  <TableHead>报价金额</TableHead>
                  <TableHead>预计天数</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>提交时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.map((bid: any) => (
                  <TableRow key={bid.id}>
                    <TableCell className="font-mono text-xs">#{bid.projectId}</TableCell>
                    <TableCell>组织 #{bid.orgId}</TableCell>
                    <TableCell className="font-medium">¥{Number(bid.price).toLocaleString()}</TableCell>
                    <TableCell>{bid.estimatedDays} 天</TableCell>
                    <TableCell>
                      <Badge variant={bid.status === "awarded" ? "default" : "secondary"}>
                        {bid.status === "awarded" ? "已中标" : bid.status === "pending" ? "待审" : bid.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(bid.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
