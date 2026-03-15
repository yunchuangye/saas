"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Bot, Play, Square, RefreshCw, Globe, Database, CheckCircle2, XCircle, Clock, Download, TrendingUp, Building2 } from "lucide-react"

const SOURCES = [
  { id: "lianjia", name: "链家", url: "lianjia.com" },
  { id: "beike", name: "贝壳", url: "ke.com" },
  { id: "anjuke", name: "安居客", url: "anjuke.com" },
  { id: "fang", name: "房天下", url: "fang.com" },
  { id: "szfdc", name: "深圳住建局", url: "fdc.zjj.sz.gov.cn" },
]
const CITIES = ["深圳", "广州", "北京", "上海", "杭州", "成都", "武汉", "南京"]
type LogEntry = { time: string; level: "info" | "success" | "error" | "warn"; msg: string }

export default function AICollectPage() {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedSources, setSelectedSources] = useState<string[]>(["lianjia", "beike"])
  const [city, setCity] = useState("深圳")
  const [maxPages, setMaxPages] = useState("10")
  const [dedup, setDedup] = useState(true)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState({ total: 0, new: 0, dup: 0, error: 0 })
  const [results, setResults] = useState<any[]>([])

  const toggleSource = (id: string) => setSelectedSources(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])

  const addLog = (level: LogEntry["level"], msg: string) => {
    const time = new Date().toLocaleTimeString("zh-CN", { hour12: false })
    setLogs(prev => [{ time, level, msg }, ...prev].slice(0, 100))
  }

  const handleStart = () => {
    if (selectedSources.length === 0) return
    setRunning(true); setProgress(0); setLogs([]); setStats({ total: 0, new: 0, dup: 0, error: 0 }); setResults([])
    const srcName = SOURCES.filter(s => selectedSources.includes(s.id)).map(s => s.name).join("、")
    addLog("info", `开始采集：${srcName} | 城市：${city} | 最大页数：${maxPages}`)
    let p = 0, totalCount = 0, newCount = 0, dupCount = 0, errCount = 0
    const mockEstates = ["海滨花园", "华润城", "万科城", "保利天汇", "龙光玖龙台", "金地格林", "碧桂园天玺", "招商海月"]
    const mockAddr = ["福田区福华路88号", "南山区科技园路12号", "宝安区新安街道", "龙华区民治大道", "罗湖区人民南路"]
    const interval = setInterval(() => {
      p += Math.random() * 8 + 2
      if (p >= 100) p = 100
      const bNew = Math.floor(Math.random() * 8) + 2
      const bDup = dedup ? Math.floor(Math.random() * 3) : 0
      const bErr = Math.random() > 0.9 ? 1 : 0
      totalCount += bNew + bDup + bErr; newCount += bNew; dupCount += bDup; errCount += bErr
      setProgress(Math.floor(p))
      setStats({ total: totalCount, new: newCount, dup: dupCount, error: errCount })
      const src = SOURCES.find(s => s.id === selectedSources[Math.floor(Math.random() * selectedSources.length)])
      const estate = mockEstates[Math.floor(Math.random() * mockEstates.length)]
      const addr = mockAddr[Math.floor(Math.random() * mockAddr.length)]
      if (bErr > 0) addLog("error", `采集失败：${src?.name} 请求超时，跳过当前页`)
      else if (bDup > 0) addLog("warn", `发现 ${bDup} 条重复数据已跳过（${estate}）`)
      else addLog("success", `成功采集 ${bNew} 条：${src?.name} - ${estate}（${addr}）`)
      setResults(prev => [...prev, { id: totalCount, source: src?.name, estate, address: `${city}市${addr}`, area: (Math.random() * 100 + 50).toFixed(1), price: Math.floor(Math.random() * 500 + 300) * 10000, status: bErr > 0 ? "error" : bDup > 0 ? "dup" : "new", time: new Date().toLocaleTimeString("zh-CN", { hour12: false }) }].slice(-50))
      if (p >= 100) { clearInterval(interval); setRunning(false); addLog("info", `采集完成！共 ${totalCount} 条，新增 ${newCount}，去重 ${dupCount}，失败 ${errCount}`) }
    }, 600)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white"><Bot className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI 智能采集</h1>
            <p className="text-muted-foreground text-sm">自动从多平台采集房产市场数据，智能去重入库</p>
          </div>
        </div>
        {running ? (
          <Button variant="destructive" onClick={() => { setRunning(false); addLog("warn", "任务已手动停止") }}><Square className="h-4 w-4 mr-2" />停止采集</Button>
        ) : (
          <Button onClick={handleStart} disabled={selectedSources.length === 0} className="bg-blue-600 hover:bg-blue-700"><Play className="h-4 w-4 mr-2" />开始采集</Button>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Globe className="h-4 w-4 text-blue-600" />数据源配置</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {SOURCES.map(src => (
                <div key={src.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer" onClick={() => !running && toggleSource(src.id)}>
                  <div className="flex items-center gap-2">
                    <Switch checked={selectedSources.includes(src.id)} disabled={running} onCheckedChange={() => toggleSource(src.id)} />
                    <div><p className="text-sm font-medium">{src.name}</p><p className="text-xs text-muted-foreground">{src.url}</p></div>
                  </div>
                  <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">可用</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Database className="h-4 w-4 text-blue-600" />采集参数</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5"><Label className="text-xs">目标城市</Label>
                <Select value={city} onValueChange={setCity} disabled={running}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">最大采集页数</Label>
                <Input type="number" min={1} max={100} value={maxPages} onChange={e => setMaxPages(e.target.value)} disabled={running} className="h-8 text-sm" />
              </div>
              <div className="flex items-center justify-between"><Label className="text-xs">自动去重</Label><Switch checked={dedup} onCheckedChange={setDedup} disabled={running} /></div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            {[{ label: "采集总量", value: stats.total, icon: Database, color: "text-blue-600" }, { label: "新增数据", value: stats.new, icon: CheckCircle2, color: "text-green-600" }, { label: "重复跳过", value: stats.dup, icon: RefreshCw, color: "text-yellow-600" }, { label: "采集失败", value: stats.error, icon: XCircle, color: "text-red-500" }].map(item => (
              <Card key={item.label} className="p-3">
                <div className="flex items-center gap-2"><item.icon className={`h-4 w-4 ${item.color}`} /><span className="text-xs text-muted-foreground">{item.label}</span></div>
                <p className="text-2xl font-bold mt-1">{item.value.toLocaleString()}</p>
              </Card>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          {(running || progress > 0) && (
            <Card><CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">{running ? <><RefreshCw className="h-4 w-4 animate-spin text-blue-600" />采集进行中...</> : <><CheckCircle2 className="h-4 w-4 text-green-600" />采集完成</>}</span>
                <span className="text-sm font-bold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent></Card>
          )}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Clock className="h-4 w-4 text-blue-600" />实时日志<Badge variant="secondary" className="ml-auto text-xs">{logs.length} 条</Badge></CardTitle></CardHeader>
            <CardContent>
              <div className="h-48 overflow-y-auto rounded-md bg-muted/30 p-3 font-mono text-xs space-y-1">
                {logs.length === 0 ? <p className="text-muted-foreground text-center py-8">等待采集任务启动...</p> : logs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-muted-foreground shrink-0">{log.time}</span>
                    <span className={log.level === "success" ? "text-green-600" : log.level === "error" ? "text-red-500" : log.level === "warn" ? "text-yellow-600" : "text-foreground"}>{log.msg}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4 text-blue-600" />采集结果</CardTitle>
                {results.length > 0 && <Button variant="outline" size="sm" className="h-7 text-xs"><Download className="h-3 w-3 mr-1" />导出</Button>}
              </div>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Building2 className="h-10 w-10 mb-3 opacity-20" /><p className="text-sm">采集结果将在此处显示</p></div>
              ) : (
                <div className="overflow-auto max-h-64">
                  <Table>
                    <TableHeader><TableRow><TableHead className="text-xs">来源</TableHead><TableHead className="text-xs">楼盘</TableHead><TableHead className="text-xs">地址</TableHead><TableHead className="text-xs">面积(㎡)</TableHead><TableHead className="text-xs">价格</TableHead><TableHead className="text-xs">状态</TableHead><TableHead className="text-xs">时间</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {results.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{r.source}</TableCell>
                          <TableCell className="text-xs font-medium">{r.estate}</TableCell>
                          <TableCell className="text-xs max-w-[120px] truncate">{r.address}</TableCell>
                          <TableCell className="text-xs">{r.area}</TableCell>
                          <TableCell className="text-xs">¥{Number(r.price).toLocaleString()}</TableCell>
                          <TableCell><Badge variant={r.status === "new" ? "default" : r.status === "dup" ? "secondary" : "destructive"} className="text-xs">{r.status === "new" ? "新增" : r.status === "dup" ? "重复" : "失败"}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{r.time}</TableCell>
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
