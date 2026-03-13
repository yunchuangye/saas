"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calculator } from "lucide-react"
import { trpc } from "@/lib/trpc"

export default function AutoValuationPage() {
  const { data, isLoading } = trpc.valuation.list.useQuery({ page: 1, pageSize: 20 })
  const valuations = data?.items ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">自动估价</h1>
        <p className="text-muted-foreground">AI 自动估价记录</p>
      </div>
      <Card>
        <CardHeader><CardTitle>估价记录 ({valuations.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : valuations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Calculator className="h-12 w-12 mb-4 opacity-30" /><p>暂无估价记录</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>物业地址</TableHead>
                  <TableHead>物业类型</TableHead>
                  <TableHead>面积(㎡)</TableHead>
                  <TableHead>估价结果</TableHead>
                  <TableHead>估价时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {valuations.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell>{v.propertyAddress ?? "-"}</TableCell>
                    <TableCell>{v.propertyType ?? "-"}</TableCell>
                    <TableCell>{v.area ?? "-"}</TableCell>
                    <TableCell className="font-medium">
                      {v.estimatedValue ? `¥${Number(v.estimatedValue).toLocaleString()}` : "计算中"}
                    </TableCell>
                    <TableCell>{new Date(v.createdAt).toLocaleDateString()}</TableCell>
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
