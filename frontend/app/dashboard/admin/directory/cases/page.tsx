"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, TrendingUp } from "lucide-react"
import { trpc } from "@/lib/trpc"

export default function CasesPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const { data, isLoading } = trpc.directory.listCases.useQuery({ page, pageSize: 20, search: search || undefined })
  const cases = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">成交案例</h1>
          <p className="text-muted-foreground">管理房产成交案例数据</p>
        </div>
        <Badge variant="secondary">共 {total} 条案例</Badge>
      </div>
      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="搜索案例..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mb-4 opacity-30" /><p>暂无案例数据</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>物业地址</TableHead>
                    <TableHead>物业类型</TableHead>
                    <TableHead>面积(㎡)</TableHead>
                    <TableHead>成交价格</TableHead>
                    <TableHead>单价(元/㎡)</TableHead>
                    <TableHead>成交日期</TableHead>
                    <TableHead>数据来源</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="max-w-xs truncate">{c.address ?? "-"}</TableCell>
                      <TableCell>{c.propertyType ?? "-"}</TableCell>
                      <TableCell>{c.area ?? "-"}</TableCell>
                      <TableCell className="font-medium">{c.totalPrice ? `¥${Number(c.totalPrice).toLocaleString()}` : "-"}</TableCell>
                      <TableCell>{c.unitPrice ? `¥${Number(c.unitPrice).toLocaleString()}` : "-"}</TableCell>
                      <TableCell>{c.dealDate ? new Date(c.dealDate).toLocaleDateString() : "-"}</TableCell>
                      <TableCell><Badge variant="outline">{c.source ?? "手动录入"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">共 {total} 条记录</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p-1)}>上一页</Button>
                  <Button variant="outline" size="sm" disabled={cases.length < 20} onClick={() => setPage(p => p+1)}>下一页</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
