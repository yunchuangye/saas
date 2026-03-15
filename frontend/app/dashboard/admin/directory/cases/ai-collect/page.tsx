"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Database, Play, RefreshCw, CheckCircle, XCircle, Clock, Loader2, ArrowLeft,
  Building2, FileText, Info
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// ── 状态映射 ──────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: "等待中", color: "bg-yellow-100 text-yellow-700", icon: <Clock className="h-3 w-3" /> },
  running:   { label: "采集中", color: "bg-blue-100 text-blue-700",   icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  completed: { label: "已完成", color: "bg-green-100 text-green-700", icon: <CheckCircle className="h-3 w-3" /> },
  failed:    { label: "失败",   color: "bg-red-100 text-red-700",     icon: <XCircle className="h-3 w-3" /> },
  paused:    { label: "已暂停", color: "bg-gray-100 text-gray-700",   icon: <Clock className="h-3 w-3" /> },
}

const DATA_TYPE_LABELS: Record<string, string> = {
  estate_info: "楼盘基础信息",
  sold_cases:  "成交案例",
  listing:     "在售报盘",
}

// ── 主页面 ────────────────────────────────────────────────────────────────────

export default function AiCollectPage() {
  const router = useRouter()

  // ── 楼盘基础信息采集表单 ──────────────────────────────────────────────────
  const [estateSource, setEstateSource]   = useState("")
  const [estateCityId, setEstateCityId]   = useState("")
  const [estatePages, setEstatePages]     = useState("5")

  // ── 案例报盘采集表单 ──────────────────────────────────────────────────────
  const [caseSource, setCaseSource]       = useState("")
  const [caseCityId, setCaseCityId]       = useState("")
  const [caseDataType, setCaseDataType]   = useState("sold_cases")
  const [casePages, setCasePages]         = useState("5")

  // ── 数据查询 ──────────────────────────────────────────────────────────────
  const { data: estateConfig } = trpc.crawl.getEstateInfoConfig.useQuery()
  const { data: caseConfig }   = trpc.crawl.getCaseListingConfig.useQuery()
  const { data: typeStats, refetch: refetchTypeStats } = trpc.crawl.getJobStatsByType.useQuery()
  const { data: collectStats, refetch: refetchCollectStats } = trpc.aiFeatures.getCollectStats.useQuery()
  const { data: jobsData, refetch: refetchJobs, isLoading: jobsLoading } = trpc.aiFeatures.listCollectJobs.useQuery({ page: 1, pageSize: 30 })

  // ── 创建任务 Mutation ─────────────────────────────────────────────────────
  const createJobMutation = trpc.crawl.createJob.useMutation({
    onSuccess: (data) => {
      toast.success(`采集任务已创建：${(data as any).name || "任务"}`)
      refetchJobs()
      refetchTypeStats()
      refetchCollectStats()
    },
    onError: (e) => toast.error(`创建失败：${e.message}`),
  })

  // ── 启动楼盘基础信息采集 ──────────────────────────────────────────────────
  const handleStartEstateInfo = () => {
    if (!estateSource) return toast.error("请选择数据源")
    if (!estateCityId) return toast.error("请选择城市")
    const city = estateConfig?.cities.find(c => String(c.id) === estateCityId)
    createJobMutation.mutate({
      name: `楼盘基础信息-${city?.name ?? "未知城市"}-${estateSource}-${new Date().toLocaleDateString("zh-CN")}`,
      source: estateSource as any,
      dataType: "estate_info",
      cityId: Number(estateCityId),
      cityName: city?.name,
      maxPages: Number(estatePages),
      concurrency: 2,
      delayMin: 2000,
      delayMax: 5000,
    })
  }

  // ── 启动案例报盘采集 ──────────────────────────────────────────────────────
  const handleStartCaseListing = () => {
    if (!caseSource) return toast.error("请选择数据源")
    if (!caseCityId) return toast.error("请选择城市")
    const city = caseConfig?.cities.find(c => String(c.id) === caseCityId)
    const dtLabel = DATA_TYPE_LABELS[caseDataType] ?? caseDataType
    createJobMutation.mutate({
      name: `${dtLabel}-${city?.name ?? "未知城市"}-${caseSource}-${new Date().toLocaleDateString("zh-CN")}`,
      source: caseSource as any,
      dataType: caseDataType as any,
      cityId: Number(caseCityId),
      cityName: city?.name,
      maxPages: Number(casePages),
      concurrency: 2,
      delayMin: 2000,
      delayMax: 5000,
    })
  }

  const handleRefreshAll = () => {
    refetchJobs()
    refetchTypeStats()
    refetchCollectStats()
  }

  // ── 渲染 ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />AI 智能采集
          </h1>
          <p className="text-muted-foreground text-sm">
            两大类数据采集：楼盘基础信息（政府来源）+ 案例交易报盘（平台来源）
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "案例总量",     value: typeStats?.totalCases?.toLocaleString() ?? collectStats?.totalCases?.toLocaleString() ?? "—", color: "text-blue-600" },
          { label: "楼盘信息任务", value: typeStats?.estateInfoJobs?.toString() ?? "—",  color: "text-violet-600" },
          { label: "报盘采集任务", value: typeStats?.listingJobs?.toString() ?? "—",     color: "text-indigo-600" },
          { label: "成交案例任务", value: typeStats?.soldCasesJobs?.toString() ?? "—",   color: "text-teal-600" },
          { label: "运行中",       value: typeStats?.runningJobs?.toString() ?? collectStats?.runningJobs?.toString() ?? "0", color: "text-amber-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 两大类采集 Tab */}
      <Tabs defaultValue="estate_info">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="estate_info" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />楼盘基础信息
          </TabsTrigger>
          <TabsTrigger value="case_listing" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />案例交易报盘
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1：楼盘基础信息 ─────────────────────────────────────── */}
        <TabsContent value="estate_info" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-violet-600" />
                楼盘基础信息采集
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                采集楼盘（estates）、楼栋（buildings）、房屋（units）三级结构，写入基础数据库。
                去重规则：{estateConfig?.dedupeRule ?? "以楼盘名称为去重标准"}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">数据源</label>
                  <Select value={estateSource} onValueChange={setEstateSource}>
                    <SelectTrigger><SelectValue placeholder="选择数据源" /></SelectTrigger>
                    <SelectContent>
                      {estateConfig?.sources.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          <div className="flex items-center gap-2">
                            {s.recommended && <Badge variant="secondary" className="text-xs px-1 py-0">推荐</Badge>}
                            <span>{s.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {estateSource && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {estateConfig?.sources.find(s => s.value === estateSource)?.desc}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">城市</label>
                  <Select value={estateCityId} onValueChange={setEstateCityId}>
                    <SelectTrigger><SelectValue placeholder="选择城市" /></SelectTrigger>
                    <SelectContent>
                      {estateConfig?.cities.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">最大页数</label>
                  <Select value={estatePages} onValueChange={setEstatePages}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["1", "5", "10", "20", "50", "100"].map(v => (
                        <SelectItem key={v} value={v}>{v} 页</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 采集字段说明 */}
              {estateConfig?.fields && (
                <div className="bg-muted/40 rounded-lg p-3 mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Info className="h-3 w-3" />采集字段
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {estateConfig.fields.map(f => (
                      <Badge key={f.key} variant={f.required ? "default" : "outline"} className="text-xs">
                        {f.label}{f.required ? " *" : ""}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleStartEstateInfo}
                disabled={createJobMutation.isPending}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
              >
                {createJobMutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" />创建中...</>
                  : <><Play className="h-4 w-4" />启动楼盘信息采集</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2：案例交易报盘 ─────────────────────────────────────── */}
        <TabsContent value="case_listing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                案例交易报盘采集
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                采集成交案例或在售报盘，写入 cases 表，用于估价模型训练和市场分析。
                去重规则：{caseConfig?.dedupeRule ?? "以来源平台+房源ID为主键去重"}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">数据类型</label>
                  <Select value={caseDataType} onValueChange={setCaseDataType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {caseConfig?.dataTypes.map(d => (
                        <SelectItem key={d.value} value={d.value}>
                          <div>
                            <div>{d.label}</div>
                            <div className="text-xs text-muted-foreground">{d.desc}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">数据源</label>
                  <Select value={caseSource} onValueChange={setCaseSource}>
                    <SelectTrigger><SelectValue placeholder="选择数据源" /></SelectTrigger>
                    <SelectContent>
                      {caseConfig?.sources
                        .filter(s => !caseDataType || s.dataType === caseDataType || s.recommended)
                        .map(s => (
                          <SelectItem key={s.value} value={s.value}>
                            <div className="flex items-center gap-2">
                              {s.recommended && <Badge variant="secondary" className="text-xs px-1 py-0">推荐</Badge>}
                              <span>{s.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {caseSource && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {caseConfig?.sources.find(s => s.value === caseSource)?.desc}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">城市</label>
                  <Select value={caseCityId} onValueChange={setCaseCityId}>
                    <SelectTrigger><SelectValue placeholder="选择城市" /></SelectTrigger>
                    <SelectContent>
                      {caseConfig?.cities.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">最大页数</label>
                  <Select value={casePages} onValueChange={setCasePages}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["1", "5", "10", "20", "50", "100"].map(v => (
                        <SelectItem key={v} value={v}>{v} 页</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 采集字段说明 */}
              {caseConfig?.fields && (
                <div className="bg-muted/40 rounded-lg p-3 mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Info className="h-3 w-3" />采集字段
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {caseConfig.fields.map(f => (
                      <Badge key={f.key} variant={f.required ? "default" : "outline"} className="text-xs">
                        {f.label}{f.required ? " *" : ""}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleStartCaseListing}
                disabled={createJobMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                {createJobMutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" />创建中...</>
                  : <><Play className="h-4 w-4" />启动案例报盘采集</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 采集任务记录 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">采集任务记录</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleRefreshAll}>
            <RefreshCw className="h-4 w-4 mr-1" />刷新
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>任务名称</TableHead>
                <TableHead>数据类型</TableHead>
                <TableHead>数据源</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>成功数</TableHead>
                <TableHead>重复数</TableHead>
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : !jobsData?.jobs.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    暂无采集任务，请在上方配置并启动
                  </TableCell>
                </TableRow>
              ) : (
                jobsData.jobs.map((job: any) => {
                  const s = STATUS_MAP[job.status as string] || STATUS_MAP.pending
                  const dtLabel = DATA_TYPE_LABELS[job.dataType as string] ?? job.dataType ?? "—"
                  return (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium text-sm max-w-[200px] truncate">{job.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            job.dataType === "estate_info"
                              ? "border-violet-300 text-violet-700"
                              : job.dataType === "sold_cases"
                              ? "border-teal-300 text-teal-700"
                              : "border-blue-300 text-blue-700"
                          }
                        >
                          {dtLabel}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge variant="outline">{job.source}</Badge></TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
                          {s.icon}{s.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-green-700 font-medium">{job.successCount ?? 0}</TableCell>
                      <TableCell className="text-muted-foreground">{job.duplicateCount ?? 0}</TableCell>
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
    </div>
  )
}
