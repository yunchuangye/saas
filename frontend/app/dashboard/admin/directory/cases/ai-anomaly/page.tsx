"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { ShieldAlert, ArrowLeft, RefreshCw, Loader2, CheckCircle } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const RISK_MAP: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: "高风险", color: "text-red-600", bg: "bg-red-50" },
  medium: { label: "中风险", color: "text-amber-600", bg: "bg-amber-50" },
  low: { label: "低风险", color: "text-blue-600", bg: "bg-blue-50" },
}

export default function AiAnomalyPage() {
  const router = useRouter()
  const [cityId, setCityId] = useState("all")
  const [checkPriceHigh, setCheckPriceHigh] = useState(true)
  const [checkPriceLow, setCheckPriceLow] = useState(true)
  const [checkArea, setCheckArea] = useState(true)
  const [checkDate, setCheckDate] = useState(true)
  const [markingId, setMarkingId] = useState<number | null>(null)

  const { data: config } = trpc.aiFeatures.getCollectConfig.useQuery()
  const cityIdNum = cityId && cityId !== "all" ? Number(cityId) : undefined

  const { data: result, isLoading, refetch } = trpc.aiFeatures.detectAnomalies.useQuery({
    cityId: cityIdNum, checkPriceHigh, checkPriceLow, checkArea, checkDate, checkDuplicate: false, limit: 100
  })

  const markMutation = trpc.aiFeatures.markAnomaly.useMutation({
    onSuccess: () => { toast.success("标记成功"); refetch(); setMarkingId(null) },
    onError: (e) => { toast.error(e.message); setMarkingId(null) },
  })

  const stats = result?.stats

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-rose-600" />AI 异常检测
          </h1>
          <p className="text-muted-foreground text-sm">基于统计分析自动检测价格异常、面积异常等问题案例</p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <Select value={cityId} onValueChange={setCityId}>
          <SelectTrigger className="w-40"><SelectValue placeholder="全部城市" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部城市</SelectItem>
            {config?.cities.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 text-sm"><Switch checked={checkPriceHigh} onCheckedChange={setCheckPriceHigh} /><span>价格过高</span></div>
        <div className="flex items-center gap-2 text-sm"><Switch checked={checkPriceLow} onCheckedChange={setCheckPriceLow} /><span>价格过低</span></div>
        <div className="flex items-center gap-2 text-sm"><Switch checked={checkArea} onCheckedChange={setCheckArea} /><span>面积异常</span></div>
        <div className="flex items-center gap-2 text-sm"><Switch checked={checkDate} onCheckedChange={setCheckDate} /><span>日期异常</span></div>
        <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-1" />重新检测</Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "检测总量", value: result?.total, color: "text-foreground" },
            { label: "高风险", value: stats.high, color: "text-red-600" },
            { label: "中风险", value: stats.medium, color: "text-amber-600" },
            { label: "低风险", value: stats.low, color: "text-blue-600" },
            { label: "均价(元/㎡)", value: stats.avgPrice?.toLocaleString(), color: "text-violet-600" },
          ].map(s => (
            <Card key={s.label}><CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={"text-xl font-bold mt-1 " + s.color}>{s.value ?? 0}</p>
            </CardContent></Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">异常案例列表</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>地址</TableHead><TableHead>面积(㎡)</TableHead><TableHead>单价(元/㎡)</TableHead>
                <TableHead>异常类型</TableHead><TableHead>风险等级</TableHead><TableHead>异常描述</TableHead><TableHead>状态</TableHead><TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
              ) : !result?.anomalies.length ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500" />未检测到异常案例
                </TableCell></TableRow>
              ) : (
                result.anomalies.map((c: any) => {
                  const risk = RISK_MAP[c.risk] || RISK_MAP.low
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm max-w-[160px] truncate">{c.address || "—"}</TableCell>
                      <TableCell>{c.area?.toFixed(1)}</TableCell>
                      <TableCell className="font-medium">{Number(c.unitPrice).toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{c.anomalyType}</Badge></TableCell>
                      <TableCell>
                        <span className={"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium " + risk.bg + " " + risk.color}>{risk.label}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{c.desc}</TableCell>
                      <TableCell>
                        <Badge variant={c.isMarked ? "destructive" : "outline"} className="text-xs">{c.isMarked ? "已标记" : "未标记"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={markingId === c.id}
                          onClick={() => { setMarkingId(c.id); markMutation.mutate({ caseId: c.id, isAnomaly: !c.isMarked, reason: c.isMarked ? undefined : c.desc }) }}>
                          {markingId === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : c.isMarked ? "取消" : "标记"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
