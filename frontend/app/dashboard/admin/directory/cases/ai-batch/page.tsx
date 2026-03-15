"use client"
import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Calculator, Play, RefreshCw, Upload, Download, CheckCircle2, Clock, FileText, BarChart3 } from "lucide-react"

const METHODS = [
  { id: "market", label: "市场比较法", desc: "基于相似成交案例对比估值", color: "bg-blue-500" },
  { id: "income", label: "收益法", desc: "基于预期租金收益折现估值", color: "bg-green-500" },
  { id: "cost", label: "成本法", desc: "基于重置成本扣减折旧估值", color: "bg-orange-500" },
  { id: "ai", label: "AI 综合法", desc: "多模型融合智能估值", color: "bg-violet-500" },
]

type ValuationItem = {
  id: number; address: string; area: number; district: string
  method: string; estimatedPrice: number; unitPrice: number
  confidence: number; status: "done" | "processing" | "pending"
}

export default function AIBatchPage() {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [method, setMethod] = useState("ai")
  const [batchSize, setBatchSize] = useState("50")
  const [items, setItems] = useState<ValuationItem[]>([])
  const [stats, setStats] = useState({ total: 0, done: 0, avgPrice: 0, totalValue: 0 })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleStart = () => {
    setRunning(true); setProgress(0)
    const total = Number(batchSize)
    const districts = ["福田区", "南山区", "宝安区", "龙华区", "罗湖区", "盐田区"]
    const roads = ["福华路", "科技园路", "新安街道", "民治大道", "人民南路", "海景路", "公明街道"]
    const selectedMethod = METHODS.find(m => m.id === method)?.label || "AI 综合法"
    const initialItems: ValuationItem[] = Array.from({ length: total }, (_, i) => ({
      id: i + 1,
      address: `${districts[Math.floor(Math.random() * districts.length)]}${roads[Math.floor(Math.random() * roads.length)]}${Math.floor(Math.random() * 200) + 1}号`,
      area: Math.floor(Math.random() * 150) + 50,
      district: districts[Math.floor(Math.random() * districts.length)],
      method: selectedMethod, estimatedPrice: 0, unitPrice: 0, confidence: 0, status: "pending",
    }))
    setItems(initialItems)
    setStats({ total, done: 0, avgPrice: 0, totalValue: 0 })
    let done = 0
    let totalVal = 0
    intervalRef.current = setInterval(() => {
      const batch = Math.min(Math.floor(Math.random() * 3) + 1, total - done)
      if (batch <= 0) return
      setItems(prev => {
        const updated = [...prev]
        for (let i = done; i < done + batch; i++) {
          if (i < updated.length) {
            const unitP = Math.floor(Math.random() * 50000 + 50000)
            const totalP = Math.floor(unitP * updated[i].area)
            totalVal += totalP
            updated[i] = { ...updated[i], unitPrice: unitP, estimatedPrice: totalP, confidence: Math.floor(Math.random() * 15 + 78), status: "done" }
          }
        }
        return updated
      })
      done += batch
      const p = Math.floor((done / total) * 100)
      setProgress(p)
      setStats({ total, done, avgPrice: Math.floor(totalVal / done), totalValue: totalVal })
      if (done >= total) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setRunning(false)
      }
    }, 300)
  }

  const handleStop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600 text-white"><Calculator className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI 批量估值</h1>
            <p className="text-muted-foreground text-sm">多种估值方法批量处理，显示处理详情和估值结果</p>
          </div>
        </div>
        <div className="flex gap-2">
          {running ? (
            <Button variant="destructive" onClick={handleStop}><RefreshCw className="h-4 w-4 mr-2 animate-spin" />停止</Button>
          ) : (
            <>
              <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-2" />导入清单</Button>
              {items.length > 0 && <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />导出结果</Button>}
              <Button onClick={handleStart} className="bg-amber-600 hover:bg-amber-700"><Play className="h-4 w-4 mr-2" />开始估值</Button>
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4 text-amber-600" />估值配置</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5"><Label className="text-xs">估值方法</Label>
              <Select value={method} onValueChange={setMethod} disabled={running}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{METHODS.map(m => <SelectItem key={m.id} value={m.id}><div><p className="text-sm">{m.label}</p><p className="text-xs text-muted-foreground">{m.desc}</p></div></SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">批量数量</Label>
              <Select value={batchSize} onValueChange={setBatchSize} disabled={running}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="20">20 条</SelectItem><SelectItem value="50">50 条</SelectItem><SelectItem value="100">100 条</SelectItem><SelectItem value="200">200 条</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="pt-2 space-y-2 border-t">
              {[{ label: "已完成", value: stats.done, sub: `/ ${stats.total}`, color: "text-amber-600" }, { label: "平均单价", value: stats.avgPrice > 0 ? `${stats.avgPrice.toLocaleString()}` : "-", sub: "元/㎡", color: "text-foreground" }, { label: "总估值", value: stats.totalValue > 0 ? `${(stats.totalValue / 10000).toFixed(0)}` : "-", sub: "万元", color: "text-green-600" }].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className={`text-sm font-bold ${item.color}`}>{item.value}<span className="text-xs font-normal text-muted-foreground ml-1">{item.sub}</span></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="lg:col-span-3 space-y-4">
          {(running || progress > 0) && (
            <Card><CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">{running ? <><RefreshCw className="h-4 w-4 animate-spin text-amber-600" />批量估值中...</> : <><CheckCircle2 className="h-4 w-4 text-amber-600" />估值完成</>}</span>
                <span className="text-sm font-bold">{stats.done} / {stats.total}（{progress}%）</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent></Card>
          )}
          {items.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground"><Calculator className="h-12 w-12 mb-4 opacity-20" /><p className="text-sm">配置参数后点击「开始估值」</p><p className="text-xs mt-1">支持导入 Excel/CSV 清单或使用系统数据</p></CardContent></Card>
          ) : (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-amber-600" />估值结果<Badge variant="outline" className="ml-auto text-xs text-amber-600 border-amber-200">{stats.done}/{stats.total} 完成</Badge></CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-96">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="text-xs">序号</TableHead><TableHead className="text-xs">地址</TableHead><TableHead className="text-xs">面积(㎡)</TableHead>
                      <TableHead className="text-xs">估值方法</TableHead><TableHead className="text-xs">单价(元/㎡)</TableHead>
                      <TableHead className="text-xs">总价(万)</TableHead><TableHead className="text-xs">置信度</TableHead><TableHead className="text-xs">状态</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs text-muted-foreground">{item.id}</TableCell>
                          <TableCell className="text-xs max-w-[140px] truncate">{item.address}</TableCell>
                          <TableCell className="text-xs">{item.area}</TableCell>
                          <TableCell className="text-xs">{item.method}</TableCell>
                          <TableCell className="text-xs font-medium">{item.status === "done" ? item.unitPrice.toLocaleString() : "-"}</TableCell>
                          <TableCell className="text-xs">{item.status === "done" ? (item.estimatedPrice / 10000).toFixed(1) : "-"}</TableCell>
                          <TableCell>{item.status === "done" ? <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">{item.confidence}%</Badge> : "-"}</TableCell>
                          <TableCell>
                            <Badge variant={item.status === "done" ? "default" : item.status === "processing" ? "secondary" : "outline"} className="text-xs">
                              {item.status === "done" ? "完成" : item.status === "processing" ? "处理中" : "待处理"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
