"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Sparkles, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, Loader2, ShieldCheck } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function AiCleanPage() {
  const router = useRouter()
  const [cityId, setCityId] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"overview" | "duplicates" | "anomalies">("overview")
  const [markingId, setMarkingId] = useState<number | null>(null)

  const { data: config } = trpc.aiFeatures.getCollectConfig.useQuery()
  const cityIdNum = cityId ? Number(cityId) : undefined

  const { data: quality, isLoading: qualityLoading, refetch: refetchQuality } = trpc.aiFeatures.scanDataQuality.useQuery({ cityId: cityIdNum })
  const { data: duplicates, isLoading: dupLoading } = trpc.aiFeatures.getDuplicateCases.useQuery(
    { cityId: cityIdNum, limit: 50 }, { enabled: activeTab === "duplicates" }
  )
  const { data: anomalies, isLoading: anomalyLoading, refetch: refetchAnomalies } = trpc.aiFeatures.getAnomalyCases.useQuery(
    { cityId: cityIdNum, limit: 50 }, { enabled: activeTab === "anomalies" }
  )

  const markMutation = trpc.aiFeatures.markAnomaly.useMutation({
    onSuccess: () => { toast.success("标记成功"); refetchAnomalies(); refetchQuality(); setMarkingId(null) },
    onError: (e) => { toast.error(e.message); setMarkingId(null) },
  })

  const batchMarkMutation = trpc.aiFeatures.batchMarkAnomalies.useMutation({
    onSuccess: (d) => {
      if (d.dryRun) toast.info(`预检：将标记 ${d.count} 条异常案例（均价 ${d.avgPrice?.toLocaleString()} 元/㎡）`)
      else { toast.success(`已标记 ${d.count} 条异常案例`); refetchQuality(); refetchAnomalies() }
    },
    onError: (e) => toast.error(e.message),
  })

  const issues = quality?.issues
  const issueCards = issues ? [
    { label: "缺失面积", count: issues.missingArea, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "缺失单价", count: issues.missingPrice, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "缺失日期", count: issues.missingDate, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "缺失地址", count: issues.missingAddress, color: "text-red-500", bg: "bg-red-50" },
    { label: "重复案例组", count: issues.duplicateGroups, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "价格异常", count: issues.anomalyPrice, color: "text-rose-600", bg: "bg-rose-50" },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-emerald-600" />AI 数据清洗
          </h1>
          <p className="text-muted-foreground text-sm">检测并处理重复数据、缺失字段、价格异常等数据质量问题</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={cityId} onValueChange={setCityId}>
          <SelectTrigger className="w-40"><SelectValue placeholder="全部城市" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部城市</SelectItem>
            {config?.cities.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetchQuality()}>
          <RefreshCw className="h-4 w-4 mr-1" />重新扫描
        </Button>
        <Button variant="outline" size="sm" onClick={() => batchMarkMutation.mutate({ cityId: cityIdNum, dryRun: true })} disabled={batchMarkMutation.isPending}>
          <ShieldCheck className="h-4 w-4 mr-1" />预检异常
        </Button>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => batchMarkMutation.mutate({ cityId: cityIdNum, dryRun: false })} disabled={batchMarkMutation.isPending}>
          {batchMarkMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
          批量标记异常
        </Button>
      </div>

      {qualityLoading ? (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <>
          <div className="flex items-center gap-4 text-sm">
            <span>总案例：<strong>{quality?.total?.toLocaleString()}</strong></span>
            <span>数据清洁度：<strong className={(quality?.cleanRate ?? 0) >= 80 ? "text-green-600" : "text-amber-600"}>{quality?.cleanRate}%</strong></span>
            {quality?.priceStats && <span className="text-xs text-muted-foreground">均价 {quality.priceStats.avg?.toLocaleString()} ± {quality.priceStats.std?.toLocaleString()} 元/㎡</span>}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {issueCards.map(card => (
              <Card key={card.label} className={card.bg + " border-0"}>
                <CardContent className="pt-3 pb-3 text-center">
                  <p className={"text-2xl font-bold " + card.color}>{card.count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <div className="flex gap-2 border-b">
        {[
          { key: "overview", label: "质量概览" },
          { key: "duplicates", label: "重复案例" + (issues?.duplicateGroups ? ` (${issues.duplicateGroups})` : "") },
          { key: "anomalies", label: "价格异常" + (issues?.anomalyPrice ? ` (${issues.anomalyPrice})` : "") },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={"px-4 py-2 text-sm font-medium border-b-2 transition-colors " + (activeTab === tab.key ? "border-emerald-600 text-emerald-600" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <Card>
          <CardHeader><CardTitle className="text-base">数据质量分析报告</CardTitle></CardHeader>
          <CardContent>
            {qualityLoading ? <Skeleton className="h-40" /> : (
              <div className="space-y-2">
                {issueCards.map(card => (
                  <div key={card.label} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{card.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className={"h-2 rounded-full " + (card.count > 0 ? "bg-amber-400" : "bg-green-400")}
                          style={{ width: quality?.total ? Math.min(100, (card.count / quality.total) * 100) + "%" : "0%" }} />
                      </div>
                      <span className={"text-sm font-medium w-12 text-right " + card.color}>{card.count}</span>
                      <Badge variant={card.count > 0 ? "destructive" : "secondary"} className="text-xs w-14 justify-center">
                        {card.count > 0 ? "需处理" : "正常"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "duplicates" && (
        <Card>
          <CardHeader><CardTitle className="text-base">重复案例列表（同地址+面积+日期）</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead><TableHead>地址</TableHead><TableHead>面积(㎡)</TableHead>
                  <TableHead>单价(元/㎡)</TableHead><TableHead>成交日期</TableHead><TableHead>来源</TableHead><TableHead>重复数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dupLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
                ) : !(duplicates as any[])?.length ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />无重复案例
                  </TableCell></TableRow>
                ) : (
                  (duplicates as any[]).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs text-muted-foreground">{c.id}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{c.address || "—"}</TableCell>
                      <TableCell>{Number(c.area).toFixed(1)}</TableCell>
                      <TableCell>{Number(c.unit_price).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{c.transaction_date ? new Date(c.transaction_date).toLocaleDateString("zh-CN") : "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{c.source || "—"}</Badge></TableCell>
                      <TableCell><Badge variant="destructive" className="text-xs">{c.duplicate_count} 条</Badge></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === "anomalies" && (
        <Card>
          <CardHeader><CardTitle className="text-base">价格异常案例（超出均价 ±2.5 倍标准差）</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>地址</TableHead><TableHead>面积(㎡)</TableHead><TableHead>单价(元/㎡)</TableHead>
                  <TableHead>异常类型</TableHead><TableHead>偏差</TableHead><TableHead>状态</TableHead><TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anomalyLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
                ) : !anomalies?.length ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />无价格异常案例
                  </TableCell></TableRow>
                ) : (
                  anomalies.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm max-w-[200px] truncate">{c.address || "—"}</TableCell>
                      <TableCell>{Number(c.area).toFixed(1)}</TableCell>
                      <TableCell className="font-medium">{Number(c.unitPrice).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={c.anomalyType === "价格过高" ? "destructive" : "secondary"} className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />{c.anomalyType}
                        </Badge>
                      </TableCell>
                      <TableCell className={"text-sm font-medium " + (c.deviation > 0 ? "text-red-600" : "text-blue-600")}>
                        {c.deviation > 0 ? "+" : ""}{c.deviation}%
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.isAnomaly ? "destructive" : "outline"} className="text-xs">
                          {c.isAnomaly ? "已标记" : "未标记"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={markingId === c.id}
                          onClick={() => { setMarkingId(c.id); markMutation.mutate({ caseId: c.id, isAnomaly: !c.isAnomaly, reason: c.isAnomaly ? undefined : c.anomalyType + "：偏差 " + c.deviation + "%" }) }}>
                          {markingId === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : c.isAnomaly ? "取消标记" : "标记异常"}
                        </Button>
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
