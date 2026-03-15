"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { GitCompare, ArrowLeft, Search } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useRouter } from "next/navigation"

export default function AiMatchPage() {
  const router = useRouter()
  const [cityId, setCityId] = useState("1")
  const [area, setArea] = useState("90")
  const [floor, setFloor] = useState("")
  const [totalFloors, setTotalFloors] = useState("")
  const [minSimilarity, setMinSimilarity] = useState("70")
  const [enabled, setEnabled] = useState(false)

  const { data: config } = trpc.aiFeatures.getCollectConfig.useQuery()
  const { data: result, isLoading, refetch } = trpc.aiFeatures.matchCases.useQuery(
    { cityId: Number(cityId), area: Number(area), floor: floor ? Number(floor) : undefined, totalFloors: totalFloors ? Number(totalFloors) : undefined, minSimilarity: Number(minSimilarity), limit: 30 },
    { enabled }
  )

  const handleSearch = () => { setEnabled(true); setTimeout(() => refetch(), 100) }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GitCompare className="h-6 w-6 text-cyan-600" />AI 案例匹配
          </h1>
          <p className="text-muted-foreground text-sm">输入房屋参数，从案例库中智能匹配最相似的成交案例</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">匹配参数</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">城市</label>
              <Select value={cityId} onValueChange={setCityId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{config?.cities.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><label className="text-xs text-muted-foreground">建筑面积(㎡)</label><Input type="number" value={area} onChange={e => setArea(e.target.value)} placeholder="如：90" /></div>
            <div className="space-y-1"><label className="text-xs text-muted-foreground">所在楼层（可选）</label><Input type="number" value={floor} onChange={e => setFloor(e.target.value)} placeholder="如：10" /></div>
            <div className="space-y-1"><label className="text-xs text-muted-foreground">总楼层（可选）</label><Input type="number" value={totalFloors} onChange={e => setTotalFloors(e.target.value)} placeholder="如：20" /></div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">最低相似度(%)</label>
              <Select value={minSimilarity} onValueChange={setMinSimilarity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["50","60","70","80","90"].map(v => <SelectItem key={v} value={v}>{v}%</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSearch} className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2">
            <Search className="h-4 w-4" />开始匹配
          </Button>
        </CardContent>
      </Card>

      {enabled && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">匹配结果</CardTitle>
            {result && <Badge variant="secondary">共 {result.total} 条</Badge>}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>地址</TableHead><TableHead>面积(㎡)</TableHead><TableHead>楼层</TableHead>
                  <TableHead>单价(元/㎡)</TableHead><TableHead>总价(万元)</TableHead><TableHead>成交日期</TableHead><TableHead>来源</TableHead><TableHead>相似度</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
                ) : !result?.cases.length ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">未找到符合条件的相似案例，请调低相似度阈值</TableCell></TableRow>
                ) : (
                  result.cases.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm max-w-[200px] truncate">{c.address || "—"}</TableCell>
                      <TableCell>{c.area}</TableCell>
                      <TableCell className="text-xs">{c.floor && c.totalFloors ? c.floor + "/" + c.totalFloors : c.floor || "—"}</TableCell>
                      <TableCell className="font-medium text-cyan-600">{Number(c.unitPrice).toLocaleString()}</TableCell>
                      <TableCell>{c.totalPrice ? (Number(c.totalPrice) / 10000).toFixed(0) : "—"}</TableCell>
                      <TableCell className="text-xs">{c.transactionDate ? new Date(c.transactionDate).toLocaleDateString("zh-CN") : "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{c.source || "—"}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div className="w-12 bg-muted rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-cyan-500" style={{ width: c.similarity + "%" }} />
                          </div>
                          <span className="text-xs font-medium text-cyan-600">{c.similarity}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
