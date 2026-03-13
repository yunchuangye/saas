"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Home } from "lucide-react"
import { trpc } from "@/lib/trpc"

export default function UnitsPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const { data, isLoading } = trpc.directory.listUnits.useQuery({ page, pageSize: 20, search: search || undefined })
  const units = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">房屋单元管理</h1>
        <p className="text-muted-foreground">管理系统中的房屋单元数据</p>
      </div>
      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="搜索单元..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : units.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Home className="h-12 w-12 mb-4 opacity-30" /><p>暂无单元数据</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>单元编号</TableHead>
                    <TableHead>所属楼栋</TableHead>
                    <TableHead>楼层</TableHead>
                    <TableHead>面积(㎡)</TableHead>
                    <TableHead>户型</TableHead>
                    <TableHead>创建时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.unitNo}</TableCell>
                      <TableCell>{u.buildingName ?? "-"}</TableCell>
                      <TableCell>{u.floor ?? "-"}</TableCell>
                      <TableCell>{u.area ?? "-"}</TableCell>
                      <TableCell>{u.layout ?? "-"}</TableCell>
                      <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">共 {total} 条记录</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p-1)}>上一页</Button>
                  <Button variant="outline" size="sm" disabled={units.length < 20} onClick={() => setPage(p => p+1)}>下一页</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
