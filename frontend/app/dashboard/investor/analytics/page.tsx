"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, FileText, Banknote, FolderOpen, CheckCircle2 } from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"
import { trpc } from "@/lib/trpc"
import { useActivityChart } from "@/hooks/use-dashboard"

export default function InvestorAnalyticsPage() {
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery()
  const { data: chartRaw, isLoading: chartLoading } = useActivityChart(42)

  const weeklyData = (() => {
    if (!chartRaw || chartRaw.length === 0) return []
    const weeks: { week: string; projects: number; reports: number }[] = []
    const arr = chartRaw as any[]
    for (let i = 0; i < Math.min(arr.length, 42); i += 7) {
      const slice = arr.slice(i, i + 7)
      weeks.push({
        week: `第${Math.floor(i / 7) + 1}周`,
        projects: slice.reduce((s: number, d: any) => s + (d.count || 0), 0),
        reports: slice.reduce((s: number, d: any) => s + (d.reports || 0), 0),
      })
    }
    return weeks
  })()

  const fallback = Array.from({ length: 6 }, (_, i) => ({ week: `第${i + 1}周`, projects: 0, reports: 0 }))
  const s = stats as any

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">数据分析</h1>
        <p className="text-muted-foreground">评估业务数据统计与趋势分析</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">累计项目</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s?.totalProjects ?? 0}</div>
                <p className="text-xs text-muted-foreground">进行中 {s?.activeProjects ?? 0} 个</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">已完成项目</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s?.completedProjects ?? 0}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" /><span className="text-green-600">持续增长</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">待审核报告</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s?.pendingReports ?? 0}</div>
                <p className="text-xs">
                  {(s?.pendingReports ?? 0) > 0 ? <span className="text-orange-500">需要尽快处理</span> : <span className="text-muted-foreground">暂无待处理</span>}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">已完成报告</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s?.completedReports ?? 0}</div>
                <p className="text-xs text-muted-foreground">累计完成</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>业务趋势</CardTitle>
          <CardDescription>近6周项目发起和报告完成数量</CardDescription>
        </CardHeader>
        <CardContent>
          {chartLoading ? <Skeleton className="h-[300px] w-full" /> : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyData.length > 0 ? weeklyData : fallback}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
                <Legend />
                <Area type="monotone" dataKey="projects" name="项目数" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.4} />
                <Area type="monotone" dataKey="reports" name="报告数" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>项目状态分布</CardTitle><CardDescription>当前各状态项目数量</CardDescription></CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-[200px]" /> : (
              <div className="space-y-4">
                {[
                  { label: "进行中", value: s?.activeProjects ?? 0, color: "bg-blue-500" },
                  { label: "已完成", value: s?.completedProjects ?? 0, color: "bg-green-500" },
                  { label: "待审核报告", value: s?.pendingReports ?? 0, color: "bg-orange-500" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2"><span className={`inline-block h-2 w-2 rounded-full ${color}`} />{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${color} transition-all`}
                        style={{ width: (s?.totalProjects ?? 0) > 0 ? `${Math.min(100, (value / (s?.totalProjects ?? 1)) * 100)}%` : "0%" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>报告完成情况</CardTitle><CardDescription>报告审核和完成统计</CardDescription></CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-[200px]" /> : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">{s?.completedReports ?? 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">已完成报告</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-3xl font-bold text-orange-500">{s?.pendingReports ?? 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">待审核报告</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">报告完成率</span>
                    <Badge variant="outline" className="text-green-600">
                      {(s?.completedReports ?? 0) + (s?.pendingReports ?? 0) > 0
                        ? `${Math.round(((s?.completedReports ?? 0) / ((s?.completedReports ?? 0) + (s?.pendingReports ?? 0))) * 100)}%`
                        : "N/A"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">项目完成率</span>
                    <Badge variant="outline" className="text-blue-600">
                      {(s?.totalProjects ?? 0) > 0
                        ? `${Math.round(((s?.completedProjects ?? 0) / (s?.totalProjects ?? 1)) * 100)}%`
                        : "N/A"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
