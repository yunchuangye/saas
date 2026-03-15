"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, ArrowLeft, Loader2, BarChart3 } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function AiPredictPage() {
  const router = useRouter()
  const [cityId, setCityId] = useState("1")
  const [area, setArea] = useState("90")
  const [floor, setFloor] = useState("10")
  const [totalFloors, setTotalFloors] = useState("20")
  const [buildingAge, setBuildingAge] = useState("10")
  const [decoration, setDecoration] = useState("medium")
  const [hasElevator, setHasElevator] = useState("true")
  const [submitted, setSubmitted] = useState(false)

  const { data: config } = trpc.aiFeatures.getCollectConfig.useQuery()
  const { data: trend, isLoading: trendLoading } = trpc.aiFeatures.getPriceTrend.useQuery({ cityId: Number(cityId), months: 12 })

  const predictMutation = trpc.aiFeatures.predictSinglePrice.useMutation({
    onError: (e) => toast.error(e.message),
  })

  const handlePredict = () => {
    if (!area || Number(area) <= 0) return toast.error("请输入有效面积")
    setSubmitted(true)
    predictMutation.mutate({
      cityId: Number(cityId), area: Number(area), floor: Number(floor),
      totalFloors: Number(totalFloors), buildingAge: Number(buildingAge),
      decoration, hasElevator: hasElevator === "true",
    })
  }

  const result = predictMutation.data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-violet-600" />AI 价格预测
          </h1>
          <p className="text-muted-foreground text-sm">基于数据库真实案例，预测房屋价格及未来走势</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">房屋参数</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">城市</label>
              <Select value={cityId} onValueChange={setCityId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{config?.cities.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><label className="text-xs text-muted-foreground">建筑面积(㎡)</label><Input type="number" value={area} onChange={e => setArea(e.target.value)} /></div>
              <div className="space-y-1"><label className="text-xs text-muted-foreground">楼龄(年)</label><Input type="number" value={buildingAge} onChange={e => setBuildingAge(e.target.value)} /></div>
              <div className="space-y-1"><label className="text-xs text-muted-foreground">所在楼层</label><Input type="number" value={floor} onChange={e => setFloor(e.target.value)} /></div>
              <div className="space-y-1"><label className="text-xs text-muted-foreground">总楼层</label><Input type="number" value={totalFloors} onChange={e => setTotalFloors(e.target.value)} /></div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">装修情况</label>
              <Select value={decoration} onValueChange={setDecoration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rough">毛坯</SelectItem><SelectItem value="simple">简装</SelectItem>
                  <SelectItem value="medium">中装</SelectItem><SelectItem value="fine">精装</SelectItem><SelectItem value="luxury">豪装</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">是否有电梯</label>
              <Select value={hasElevator} onValueChange={setHasElevator}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="true">有电梯</SelectItem><SelectItem value="false">无电梯</SelectItem></SelectContent>
              </Select>
            </div>
            <Button onClick={handlePredict} disabled={predictMutation.isPending} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
              {predictMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />预测中...</> : "开始预测"}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {submitted && (
            <Card>
              <CardHeader><CardTitle className="text-base">预测结果</CardTitle></CardHeader>
              <CardContent>
                {predictMutation.isPending ? (
                  <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : (result as any)?.error ? (
                  <p className="text-muted-foreground text-sm">{(result as any).error}</p>
                ) : result ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-violet-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">预测单价</p>
                        <p className="text-xl font-bold text-violet-600">{result.predictedUnitPrice?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">元/㎡</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">预测总价</p>
                        <p className="text-xl font-bold text-blue-600">{(Number(result.totalPrice) / 10000).toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">万元</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">置信度</p>
                        <p className="text-xl font-bold text-green-600">{result.confidence}%</p>
                        <p className="text-xs text-muted-foreground">参考 {result.comparableCount} 个案例</p>
                      </div>
                    </div>
                    {result.factors && (
                      <div>
                        <p className="text-sm font-medium mb-2">调整因素</p>
                        <div className="grid grid-cols-2 gap-2">
                          {result.factors.map((f: any) => (
                            <div key={f.name} className={"flex items-center justify-between text-xs p-2 bg-muted/30 rounded"}>
                              <span>{f.name}</span>
                              <span className={f.impact === "positive" ? "text-green-600 font-medium" : f.impact === "negative" ? "text-red-600 font-medium" : "text-muted-foreground"}>{f.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.comparableCases && result.comparableCases.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">参考案例（相似度排序）</p>
                        <Table>
                          <TableHeader><TableRow>
                            <TableHead className="text-xs">地址</TableHead><TableHead className="text-xs">面积(㎡)</TableHead>
                            <TableHead className="text-xs">单价(元/㎡)</TableHead><TableHead className="text-xs">相似度</TableHead>
                          </TableRow></TableHeader>
                          <TableBody>
                            {result.comparableCases.map((c: any) => (
                              <TableRow key={c.id}>
                                <TableCell className="text-xs max-w-[200px] truncate">{c.address || "—"}</TableCell>
                                <TableCell className="text-xs">{c.area}</TableCell>
                                <TableCell className="text-xs font-medium">{Number(c.unitPrice).toLocaleString()}</TableCell>
                                <TableCell><Badge variant="outline" className="text-xs">{c.similarity}%</Badge></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <BarChart3 className="h-4 w-4 text-violet-600" />
              <CardTitle className="text-base">历史价格趋势（近12个月）</CardTitle>
            </CardHeader>
            <CardContent>
              {trendLoading ? <Skeleton className="h-40 w-full" /> : !trend?.history?.length ? (
                <p className="text-muted-foreground text-sm text-center py-8">暂无历史价格数据</p>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-xs">月份</TableHead><TableHead className="text-xs">均价(元/㎡)</TableHead>
                    <TableHead className="text-xs">最高</TableHead><TableHead className="text-xs">最低</TableHead><TableHead className="text-xs">成交量</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {trend.history.map((d: any) => (
                      <TableRow key={d.month}>
                        <TableCell className="text-xs font-medium">{d.month}</TableCell>
                        <TableCell className="text-xs text-violet-600 font-medium">{Number(d.avgPrice).toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-red-500">{Number(d.maxPrice).toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-blue-500">{Number(d.minPrice).toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{d.count} 套</TableCell>
                      </TableRow>
                    ))}
                    {trend.predictions?.map((d: any) => (
                      <TableRow key={d.month} className="bg-violet-50/50">
                        <TableCell className="text-xs font-medium text-violet-600">{d.month} (预测)</TableCell>
                        <TableCell className="text-xs text-violet-600 font-medium">{Number(d.predictedPrice).toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">—</TableCell>
                        <TableCell className="text-xs text-muted-foreground">—</TableCell>
                        <TableCell className="text-xs"><Badge variant="outline" className="text-xs">{d.confidence}%</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
