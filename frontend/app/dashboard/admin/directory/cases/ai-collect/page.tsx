"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Database, Play, RefreshCw, CheckCircle, XCircle, Clock, Loader2, ArrowLeft } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "等待中", color: "bg-yellow-100 text-yellow-700" },
  running: { label: "采集中", color: "bg-blue-100 text-blue-700" },
  completed: { label: "已完成", color: "bg-green-100 text-green-700" },
  failed: { label: "失败", color: "bg-red-100 text-red-700" },
  paused: { label: "已暂停", color: "bg-gray-100 text-gray-700" },
}

export default function AiCollectPage() {
  const router = useRouter()
  const [source, setSource] = useState("")
  const [cityId, setCityId] = useState("")
  const [dataType, setDataType] = useState("sold_cases")
  const [maxPages, setMaxPages] = useState("5")

  const { data: config } = trpc.aiFeatures.getCollectConfig.useQuery()
  const { data: stats, refetch: refetchStats } = trpc.aiFeatures.getCollectStats.useQuery()
  const { data: jobsData, refetch: refetchJobs, isLoading: jobsLoading } = trpc.aiFeatures.listCollectJobs.useQuery({ page: 1, pageSize: 20 })

  const startMutation = trpc.aiFeatures.startCollect.useMutation({
    onSuccess: (data) => {
      toast.success(`采集任务已创建：${data.jobName}`)
      refetchJobs()
      refetchStats()
    },
    onError: (e) => toast.error(`创建失败：${e.message}`),
  })

  const handleStart = () => {
    if (!source) return toast.error("请选择数据源")
    if (!cityId) return toast.error("请选择城市")
    startMutation.mutate({ source: source as any, cityId: Number(cityId), dataType: dataType as any, maxPages: Number(maxPages) })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />AI 智能采集
          </h1>
          <p className="text-muted-foreground text-sm">从链家、贝壳等平台自动采集市场数据，写入案例库</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "案例总量", value: stats?.totalCases?.toLocaleString() ?? "—", color: "text-blue-600" },
          { label: "采集任务", value: stats?.totalJobs?.toString() ?? "—", color: "text-violet-600" },
          { label: "运行中", value: stats?.runningJobs?.toString() ?? "0", color: "text-amber-600" },
          { label: "已完成", value: stats?.completedJobs?.toString() ?? "0", color: "text-green-600" },
        ].map(s => (
          <Card key={s.label}><CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">新建采集任务</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">数据源</label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue placeholder="选择数据源" /></SelectTrigger>
                <SelectContent>
                  {config?.sources.filter(s => s.available).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} — {s.desc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">城市</label>
              <Select value={cityId} onValueChange={setCityId}>
                <SelectTrigger><SelectValue placeholder="选择城市" /></SelectTrigger>
                <SelectContent>
                  {config?.cities.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">数据类型</label>
              <Select value={dataType} onValueChange={setDataType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {config?.dataTypes.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">最大页数</label>
              <Select value={maxPages} onValueChange={setMaxPages}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["1", "5", "10", "20", "50", "100"].map(v => (
                    <SelectItem key={v} value={v}>{v} 页</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleStart} disabled={startMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            {startMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {startMutation.isPending ? "创建中..." : "启动采集"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">采集任务记录</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => { refetchJobs(); refetchStats() }}>
            <RefreshCw className="h-4 w-4 mr-1" />刷新
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>任务名称</TableHead>
                <TableHead>数据源</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>成功数</TableHead>
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                ))
              ) : !jobsData?.jobs.length ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                  暂无采集任务，请在上方配置并启动
                </TableCell></TableRow>
              ) : (
                jobsData.jobs.map(job => {
                  const s = STATUS_MAP[job.status as string] || STATUS_MAP.pending
                  return (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium text-sm">{job.name}</TableCell>
                      <TableCell><Badge variant="outline">{job.source}</Badge></TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
                          {s.label}
                        </span>
                      </TableCell>
                      <TableCell>{job.successCount ?? 0}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {job.createdAt ? new Date(job.createdAt).toLocaleString("zh-CN") : "—"}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {stats?.recentJobs && stats.recentJobs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">最近任务</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {stats.recentJobs.map((job: any) => (
              <div key={job.id} className="border rounded-lg p-3 space-y-1">
                <p className="text-sm font-medium truncate">{job.name}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">{job.source}</Badge>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${(STATUS_MAP[job.status as string] || STATUS_MAP.pending).color}`}>
                    {(STATUS_MAP[job.status as string] || STATUS_MAP.pending).label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">成功 {job.successCount ?? 0} 条</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
