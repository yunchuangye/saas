"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Sparkles, Play, CheckCircle2, AlertTriangle, RefreshCw, Clock, Trash2, Wrench } from "lucide-react"

const CLEAN_RULES = [
  { id: "dup", label: "重复数据检测", desc: "检测并删除重复案例记录", color: "text-orange-500" },
  { id: "missing", label: "缺失字段补充", desc: "自动补充缺失的地址、面积等字段", color: "text-blue-500" },
  { id: "price", label: "价格异常过滤", desc: "过滤价格过高或过低的异常数据", color: "text-red-500" },
  { id: "conflict", label: "数据冲突解决", desc: "处理同一房源的矛盾信息", color: "text-purple-500" },
  { id: "format", label: "格式标准化", desc: "统一日期、地址、面积单位格式", color: "text-cyan-500" },
]

type Issue = { id: number; type: string; field: string; original: string; fixed: string; status: "fixed" | "removed" | "pending" }
type LogEntry = { time: string; level: "info" | "success" | "error" | "warn"; msg: string }

export default function AICleanPage() {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [enabledRules, setEnabledRules] = useState<string[]>(["dup", "missing", "price", "conflict", "format"])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState({ scanned: 0, fixed: 0, removed: 0, pending: 0 })
  const [issues, setIssues] = useState<Issue[]>([])

  const addLog = (level: LogEntry["level"], msg: string) => {
    const time = new Date().toLocaleTimeString("zh-CN", { hour12: false })
    setLogs(prev => [{ time, level, msg }, ...prev].slice(0, 100))
  }

  const handleStart = () => {
    setRunning(true); setProgress(0); setLogs([]); setStats({ scanned: 0, fixed: 0, removed: 0, pending: 0 }); setIssues([])
    addLog("info", `开始数据清洗，已启用规则：${enabledRules.map(r => CLEAN_RULES.find(c => c.id === r)?.label).join("、")}`)
    let p = 0, scanned = 0, fixed = 0, removed = 0, pending = 0, issueId = 0
    const issueTypes = [
      { type: "重复数据", field: "案例 ID", orig: "#2341 / #2342", fix: "删除 #2342", status: "removed" as const },
      { type: "缺失字段", field: "物业地址", orig: "NULL", fix: "深圳市福田区未知路", status: "fixed" as const },
      { type: "价格异常", field: "成交单价", orig: "98,000 元/㎡", fix: "标记待复核", status: "pending" as const },
      { type: "格式错误", field: "成交日期", orig: "2024/3/5", fix: "2024-03-05", status: "fixed" as const },
      { type: "数据冲突", field: "建筑面积", orig: "120㎡ vs 95㎡", fix: "保留官方数据 120㎡", status: "fixed" as const },
    ]
    const interval = setInterval(() => {
      p += Math.random() * 6 + 2
      if (p >= 100) p = 100
      const bScan = Math.floor(Math.random() * 50) + 20
      const bFix = Math.floor(Math.random() * 5)
      const bRem = Math.floor(Math.random() * 2)
      const bPend = Math.random() > 0.85 ? 1 : 0
      scanned += bScan; fixed += bFix; removed += bRem; pending += bPend
      setProgress(Math.floor(p))
      setStats({ scanned, fixed, removed, pending })
      if (bFix > 0 || bRem > 0 || bPend > 0) {
        const issue = issueTypes[Math.floor(Math.random() * issueTypes.length)]
        issueId++
        setIssues(prev => [...prev, { id: issueId, type: issue.type, field: issue.field, original: issue.orig, fixed: issue.fix, status: issue.status }].slice(-100))
        if (issue.status === "removed") addLog("warn", `删除重复记录：${issue.orig}`)
        else if (issue.status === "fixed") addLog("success", `修复字段 [${issue.field}]：${issue.orig} → ${issue.fix}`)
        else addLog("warn", `异常标记：${issue.field} = ${issue.orig}，待人工复核`)
      } else {
        addLog("info", `扫描 ${bScan} 条记录，未发现问题`)
      }
      if (p >= 100) { clearInterval(interval); setRunning(false); addLog("info", `清洗完成！扫描 ${scanned} 条，修复 ${fixed} 条，删除 ${removed} 条，待复核 ${pending} 条`) }
    }, 700)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white"><Sparkles className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI 数据清洗</h1>
            <p className="text-muted-foreground text-sm">智能检测并处理重复、缺失、异常、冲突数据</p>
          </div>
        </div>
        {running ? (
          <Button variant="destructive" onClick={() => { setRunning(false); addLog("warn", "清洗任务已停止") }}><RefreshCw className="h-4 w-4 mr-2 animate-spin" />停止</Button>
        ) : (
          <Button onClick={handleStart} className="bg-emerald-600 hover:bg-emerald-700"><Play className="h-4 w-4 mr-2" />开始清洗</Button>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Wrench className="h-4 w-4 text-emerald-600" />清洗规则</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {CLEAN_RULES.map(rule => (
                <div key={rule.id} className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${rule.color}`}>{rule.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{rule.desc}</p>
                  </div>
                  <Switch checked={enabledRules.includes(rule.id)} disabled={running}
                    onCheckedChange={v => setEnabledRules(prev => v ? [...prev, rule.id] : prev.filter(r => r !== rule.id))} />
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "扫描总量", value: stats.scanned, icon: RefreshCw, color: "text-blue-600" },
              { label: "已修复", value: stats.fixed, icon: CheckCircle2, color: "text-emerald-600" },
              { label: "已删除", value: stats.removed, icon: Trash2, color: "text-orange-500" },
              { label: "待复核", value: stats.pending, icon: AlertTriangle, color: "text-yellow-500" }
            ].map(item => (
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
                <span className="text-sm font-medium flex items-center gap-2">
                  {running ? <><RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />清洗进行中...</> : <><CheckCircle2 className="h-4 w-4 text-emerald-600" />清洗完成</>}
                </span>
                <span className="text-sm font-bold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent></Card>
          )}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-600" />实时日志<Badge variant="secondary" className="ml-auto text-xs">{logs.length} 条</Badge></CardTitle></CardHeader>
            <CardContent>
              <div className="h-44 overflow-y-auto rounded-md bg-muted/30 p-3 font-mono text-xs space-y-1">
                {logs.length === 0 ? <p className="text-muted-foreground text-center py-8">等待清洗任务启动...</p> : logs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-muted-foreground shrink-0">{log.time}</span>
                    <span className={log.level === "success" ? "text-green-600" : log.level === "error" ? "text-red-500" : log.level === "warn" ? "text-yellow-600" : "text-foreground"}>{log.msg}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-emerald-600" />问题记录</CardTitle></CardHeader>
            <CardContent>
              {issues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground"><CheckCircle2 className="h-10 w-10 mb-3 opacity-20" /><p className="text-sm">暂无检测到问题</p></div>
              ) : (
                <div className="overflow-auto max-h-64">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="text-xs">问题类型</TableHead>
                      <TableHead className="text-xs">字段</TableHead>
                      <TableHead className="text-xs">原始值</TableHead>
                      <TableHead className="text-xs">处理结果</TableHead>
                      <TableHead className="text-xs">状态</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {issues.map(issue => (
                        <TableRow key={issue.id}>
                          <TableCell className="text-xs font-medium">{issue.type}</TableCell>
                          <TableCell className="text-xs">{issue.field}</TableCell>
                          <TableCell className="text-xs text-red-500 max-w-[100px] truncate">{issue.original}</TableCell>
                          <TableCell className="text-xs text-green-600 max-w-[120px] truncate">{issue.fixed}</TableCell>
                          <TableCell>
                            <Badge variant={issue.status === "fixed" ? "default" : issue.status === "removed" ? "destructive" : "secondary"} className="text-xs">
                              {issue.status === "fixed" ? "已修复" : issue.status === "removed" ? "已删除" : "待复核"}
                            </Badge>
                          </TableCell>
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
