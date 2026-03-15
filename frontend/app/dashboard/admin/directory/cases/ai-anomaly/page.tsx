"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ShieldAlert, Play, RefreshCw, Clock, CheckCircle2, AlertTriangle, XCircle, TrendingUp, TrendingDown, Ruler } from "lucide-react"

const ANOMALY_TYPES = [
  { id: "price_high", label: "价格过高", desc: "成交价超出市场均价 50% 以上", color: "text-red-500", icon: TrendingUp },
  { id: "price_low", label: "价格过低", desc: "成交价低于市场均价 40% 以下", color: "text-orange-500", icon: TrendingDown },
  { id: "area", label: "面积异常", desc: "建筑面积与套内面积差异过大", color: "text-yellow-500", icon: Ruler },
  { id: "date", label: "日期异常", desc: "成交日期早于建成年份或未来日期", color: "text-purple-500", icon: Clock },
  { id: "duplicate", label: "疑似重复", desc: "同一房源短期内多次成交", color: "text-blue-500", icon: AlertTriangle },
]

type Anomaly = { id: number; caseId: string; type: string; risk: "high" | "medium" | "low"; desc: string; value: string; expected: string; district: string }
type LogEntry = { time: string; level: "info" | "warn" | "error"; msg: string }

export default function AIAnomalyPage() {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [enabledTypes, setEnabledTypes] = useState<string[]>(["price_high", "price_low", "area", "date", "duplicate"])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState({ scanned: 0, high: 0, medium: 0, low: 0 })
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])

  const addLog = (level: LogEntry["level"], msg: string) => {
    const time = new Date().toLocaleTimeString("zh-CN", { hour12: false })
    setLogs(prev => [{ time, level, msg }, ...prev].slice(0, 100))
  }

  const handleStart = () => {
    setRunning(true); setProgress(0); setLogs([]); setStats({ scanned: 0, high: 0, medium: 0, low: 0 }); setAnomalies([])
    addLog("info", `开始异常检测，检测项：${enabledTypes.map(t => ANOMALY_TYPES.find(a => a.id === t)?.label).join("、")}`)
    let p = 0, scanned = 0, high = 0, medium = 0, low = 0, anomalyId = 0
    const districts = ["福田区", "南山区", "宝安区", "龙华区", "罗湖区"]
    const mockAnomalies = [
      { type: "价格过高", risk: "high" as const, desc: "成交单价超出区域均价 68%", value: "145,000 元/㎡", expected: "≤ 100,000 元/㎡" },
      { type: "价格过低", risk: "high" as const, desc: "成交单价仅为区域均价 35%", value: "26,000 元/㎡", expected: "≥ 50,000 元/㎡" },
      { type: "面积异常", risk: "medium" as const, desc: "套内面积超过建筑面积", value: "套内 125㎡", expected: "建筑 110㎡" },
      { type: "日期异常", risk: "medium" as const, desc: "成交日期早于楼盘建成年份", value: "2018-03-01", expected: "≥ 2020-06-01" },
      { type: "疑似重复", risk: "low" as const, desc: "同一房源 30 天内第 2 次成交", value: "2 次成交", expected: "通常 1 次" },
    ]
    const interval = setInterval(() => {
      p += Math.random() * 5 + 2
      if (p >= 100) p = 100
      const bScan = Math.floor(Math.random() * 80) + 30
      scanned += bScan
      setProgress(Math.floor(p))
      if (Math.random() > 0.6) {
        const a = mockAnomalies[Math.floor(Math.random() * mockAnomalies.length)]
        anomalyId++
        if (a.risk === "high") high++
        else if (a.risk === "medium") medium++
        else low++
        setStats({ scanned, high, medium, low })
        setAnomalies(prev => [...prev, { id: anomalyId, caseId: `#${Math.floor(Math.random() * 90000) + 10000}`, ...a, district: districts[Math.floor(Math.random() * districts.length)] }].slice(-200))
        addLog(a.risk === "high" ? "error" : "warn", `[${a.risk === "high" ? "高风险" : a.risk === "medium" ? "中风险" : "低风险"}] ${a.type}：${a.desc}`)
      } else {
        setStats({ scanned, high, medium, low })
        addLog("info", `扫描 ${bScan} 条记录，未发现异常`)
      }
      if (p >= 100) { clearInterval(interval); setRunning(false); addLog("info", `检测完成！扫描 ${scanned} 条，高风险 ${high}，中风险 ${medium}，低风险 ${low}`) }
    }, 600)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-600 text-white"><ShieldAlert className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI 异常检测</h1>
            <p className="text-muted-foreground text-sm">检测价格过高/过低、面积异常等问题案例并标记风险等级</p>
          </div>
        </div>
        {running ? (
          <Button variant="destructive" onClick={() => { setRunning(false); addLog("warn", "检测任务已停止") }}><RefreshCw className="h-4 w-4 mr-2 animate-spin" />停止</Button>
        ) : (
          <Button onClick={handleStart} className="bg-rose-600 hover:bg-rose-700"><Play className="h-4 w-4 mr-2" />开始检测</Button>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-rose-600" />检测项目</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {ANOMALY_TYPES.map(type => (
                <div key={type.id} className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1">
                    <type.icon className={`h-4 w-4 mt-0.5 shrink-0 ${type.color}`} />
                    <div><p className={`text-sm font-medium ${type.color}`}>{type.label}</p><p className="text-xs text-muted-foreground mt-0.5">{type.desc}</p></div>
                  </div>
                  <Switch checked={enabledTypes.includes(type.id)} disabled={running} onCheckedChange={v => setEnabledTypes(prev => v ? [...prev, type.id] : prev.filter(t => t !== type.id))} />
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            {[{ label: "已扫描", value: stats.scanned, color: "text-blue-600" }, { label: "高风险", value: stats.high, color: "text-red-600" }, { label: "中风险", value: stats.medium, color: "text-orange-500" }, { label: "低风险", value: stats.low, color: "text-yellow-500" }].map(item => (
              <Card key={item.label} className="p-3"><p className="text-xs text-muted-foreground">{item.label}</p><p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value.toLocaleString()}</p></Card>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          {(running || progress > 0) && (
            <Card><CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">{running ? <><RefreshCw className="h-4 w-4 animate-spin text-rose-600" />检测进行中...</> : <><CheckCircle2 className="h-4 w-4 text-rose-600" />检测完成</>}</span>
                <span className="text-sm font-bold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent></Card>
          )}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Clock className="h-4 w-4 text-rose-600" />实时日志<Badge variant="secondary" className="ml-auto text-xs">{logs.length} 条</Badge></CardTitle></CardHeader>
            <CardContent>
              <div className="h-40 overflow-y-auto rounded-md bg-muted/30 p-3 font-mono text-xs space-y-1">
                {logs.length === 0 ? <p className="text-muted-foreground text-center py-6">等待检测任务启动...</p> : logs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-muted-foreground shrink-0">{log.time}</span>
                    <span className={log.level === "error" ? "text-red-500" : log.level === "warn" ? "text-yellow-600" : "text-foreground"}>{log.msg}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><XCircle className="h-4 w-4 text-rose-600" />异常记录<Badge variant="destructive" className="ml-auto text-xs">{anomalies.length}</Badge></CardTitle></CardHeader>
            <CardContent>
              {anomalies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground"><CheckCircle2 className="h-10 w-10 mb-3 opacity-20" /><p className="text-sm">暂未检测到异常</p></div>
              ) : (
                <div className="overflow-auto max-h-72">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="text-xs">风险</TableHead><TableHead className="text-xs">案例ID</TableHead><TableHead className="text-xs">区域</TableHead>
                      <TableHead className="text-xs">异常类型</TableHead><TableHead className="text-xs">实际值</TableHead><TableHead className="text-xs">期望范围</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {anomalies.map(a => (
                        <TableRow key={a.id}>
                          <TableCell><Badge variant={a.risk === "high" ? "destructive" : a.risk === "medium" ? "default" : "secondary"} className="text-xs">{a.risk === "high" ? "高" : a.risk === "medium" ? "中" : "低"}</Badge></TableCell>
                          <TableCell className="text-xs font-mono">{a.caseId}</TableCell>
                          <TableCell className="text-xs">{a.district}</TableCell>
                          <TableCell className="text-xs font-medium">{a.type}</TableCell>
                          <TableCell className="text-xs text-red-500">{a.value}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{a.expected}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
