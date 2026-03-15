"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Calculator, ArrowLeft, Play, Loader2, CheckCircle, XCircle } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const METHOD_LABELS: Record<string, string> = {
  market: "市场比较法", income: "收益法", cost: "成本法", ai: "AI 综合法",
}

export default function AiBatchPage() {
  const router = useRouter()
  const [cityId, setCityId] = useState("1")
  const [method, setMethod] = useState<"market" | "income" | "cost" | "ai">("market")
  const [limit, setLimit] = useState("20")
  const [results, setResults] = useState<any[]>([])
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentIdx, setCurrentIdx] = useState(0)

  const { data: config } = trpc.aiFeatures.getCollectConfig.useQuery()
  const { data: stats } = trpc.aiFeatures.getBatchValuationStats.useQuery({ cityId: cityId ? Number(cityId) : undefined })
  const { data: candidates, isLoading: candidatesLoading } = trpc.aiFeatures.getBatchValuationCandidates.useQuery(
    { cityId: cityId ? Number(cityId) : undefined, limit: Number(limit) }
  )

  const valuateMutation = trpc.aiFeatures.valuateSingleCase.useMutation()

  const handleBatchStart = async () => {
    if (!candidates?.length) return toast.error("暂无可估值案例")
    setRunning(true); setProgress(0); setCurrentIdx(0); setResults([])
    const total = candidates.length
    const newResults: any[] = []
    for (let i = 0; i < total; i++) {
      const c = candidates[i]
      setCurrentIdx(i + 1)
      setProgress(Math.round(((i + 1) / total) * 100))
      try {
        const r = await valuateMutation.mutateAsync({ caseId: c.id, method })
        newResults.push({ ...r, status: "done" })
      } catch (e: any) {
        newResults.push({ caseId: c.id, address: c.address, area: c.area, status: "failed", error: e.message })
      }
      setResults([...newResults])
      await new Promise(res => setTimeout(res, 80))
    }
    setRunning(false)
    toast.success("批量估值完成，共处理 " + total + " 条")
  }

  const doneCount = results.filter(r => r.status === "done").length
  const failCount = results.filter(r => r.status === "failed").length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-6 w-6 text-amber-600" />AI 批量估值
          </h1>
          <p className="text-muted-foreground text-sm">基于真实案例数据，批量对案例库进行智能估值</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "可估值案例", value: stats.total?.toLocaleString(), color: "text-amber-600" },
            { label: "均价(元/㎡)", value: Math.round(stats.avgPrice)?.toLocaleString(), color: "text-violet-600" },
            { label: "最高价(元/㎡)", value: Math.round(stats.maxPrice)?.toLocaleString(), color: "text-red-600" },
            { label: "最低价(元/㎡)", value: Math.round(stats.minPrice)?.toLocaleString(), color: "text-blue-600" },
          ].map(s => (
            <Card key={s.label}><CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={"text-xl font-bold mt-1 " + s.color}>{s.value}</p>
            </CardContent></Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">批量估值配置</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">城市</label>
              <Select value={cityId} onValueChange={setCityId} disabled={running}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{config?.cities.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">估值方法</label>
              <Select value={method} onValueChange={v => setMethod(v as any)} disabled={running}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(METHOD_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">处理数量</label>
              <Select value={limit} onValueChange={setLimit} disabled={running}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["10","20","50"].map(v => <SelectItem key={v} value={v}>{v} 条</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleBatchStart} disabled={running || candidatesLoading} className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
            {running ? <><Loader2 className="h-4 w-4 animate-spin" />估值中 ({currentIdx}/{candidates?.length ?? 0})...</> : <><Play className="h-4 w-4" />开始批量估值</>}
          </Button>
        </CardContent>
      </Card>

      {(running || results.length > 0) && (
        <Card><CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span>{running ? "正在处理第 " + currentIdx + " 条..." : "估值完成"}</span>
            <div className="flex gap-3">
              <span className="text-green-600">成功 {doneCount}</span>
              <span className="text-red-500">失败 {failCount}</span>
              <span className="font-bold">{progress}%</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent></Card>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">估值结果（{METHOD_LABELS[method]}）</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>地址</TableHead><TableHead>面积(㎡)</TableHead><TableHead>实际单价</TableHead>
                  <TableHead>估值单价</TableHead><TableHead>偏差</TableHead><TableHead>置信度</TableHead><TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r: any, i) => (
                  <TableRow key={r.caseId || i}>
                    <TableCell className="text-sm max-w-[200px] truncate">{r.address || "—"}</TableCell>
                    <TableCell>{r.area}</TableCell>
                    <TableCell>{r.actualUnitPrice ? Number(r.actualUnitPrice).toLocaleString() : "—"}</TableCell>
                    <TableCell className="font-medium text-amber-600">{r.estimatedUnitPrice ? Number(r.estimatedUnitPrice).toLocaleString() : "—"}</TableCell>
                    <TableCell>
                      {r.deviation != null ? (
                        <span className={"text-sm font-medium " + (r.deviation > 10 ? "text-red-500" : r.deviation < -10 ? "text-blue-500" : "text-green-600")}>
                          {r.deviation > 0 ? "+" : ""}{r.deviation}%
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>{r.confidence ? <Badge variant="outline" className="text-xs">{r.confidence}%</Badge> : "—"}</TableCell>
                    <TableCell>
                      {r.status === "done"
                        ? <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle className="h-3 w-3" />完成</span>
                        : <span className="flex items-center gap-1 text-red-500 text-xs"><XCircle className="h-3 w-3" />失败</span>
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
