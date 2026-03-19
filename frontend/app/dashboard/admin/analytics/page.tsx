"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart3, TrendingUp, Users, FileText, Building2, Landmark, FolderOpen, CheckCircle2, CreditCard, Activity, ArrowRight } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { trpc } from "@/lib/trpc"
import Link from "next/link"

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"]

export default function AdminAnalyticsPage() {
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery()
  const { data: usageData, isLoading: usageLoading } = trpc.billing.getUsageStats.useQuery()
  const { data: activityRaw, isLoading: chartLoading } = trpc.dashboard.activityChart.useQuery({ days: 28 })

  const s = stats as any
  const u = usageData as any

  const weeklyActivity = (() => {
    if (!activityRaw || (activityRaw as any[]).length === 0) return []
    const arr = activityRaw as any[]
    const weeks: { week: string; projects: number }[] = []
    for (let i = 0; i < Math.min(arr.length, 28); i += 7) {
      const slice = arr.slice(i, i + 7)
      weeks.push({ week: `第${Math.floor(i / 7) + 1}周`, projects: slice.reduce((sum: number, d: any) => sum + (d.count || 0), 0) })
    }
    return weeks
  })()

  const orgDistribution = [
    { name: "评估公司", value: s?.appraiserOrgs ?? 0 },
    { name: "银行机构", value: s?.bankOrgs ?? 0 },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">数据分析</h1>
          <p className="text-muted-foreground">平台整体运营数据与商业化指标</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/org/billing"><CreditCard className="mr-2 h-4 w-4" />SaaS 计费管理</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />) : (
          <>
            {[
              { label: "注册用户", value: s?.totalUsers ?? 0, sub: "平台累计注册", icon: Users },
              { label: "评估公司", value: s?.appraiserOrgs ?? 0, sub: "已入驻机构", icon: Building2 },
              { label: "银行/投资机构", value: s?.bankOrgs ?? 0, sub: "委托方机构", icon: Landmark },
              { label: "本月新增项目", value: s?.monthlyProjects ?? 0, sub: "本月新增", icon: Activity },
              { label: "总项目数", value: s?.totalProjects ?? 0, sub: `进行中 ${s?.activeProjects ?? 0} 个`, icon: FolderOpen },
              { label: "已完成项目", value: s?.completedProjects ?? 0, sub: `完成率 ${(s?.totalProjects ?? 0) > 0 ? Math.round(((s?.completedProjects ?? 0) / (s?.totalProjects ?? 1)) * 100) : 0}%`, icon: CheckCircle2 },
              { label: "总报告数", value: s?.totalReports ?? 0, sub: `待审核 ${s?.pendingReports ?? 0} 份`, icon: FileText },
              { label: "房屋案例库", value: (s?.totalCases ?? 0) > 10000 ? `${((s?.totalCases ?? 0) / 10000).toFixed(1)}万` : (s?.totalCases ?? 0), sub: "累计案例数据", icon: BarChart3 },
            ].map(({ label, value, sub, icon: Icon }) => (
              <Card key={label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{label}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{value}</div>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>SaaS 订阅概览</CardTitle>
            <CardDescription>平台订阅收入与用量统计</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/org/billing">查看详情 <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {usageLoading ? <Skeleton className="h-32 w-full" /> : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "累计收入（元）", value: `¥${u?.totalRevenue ? (u.totalRevenue / 100).toFixed(0) : "0"}`, color: "text-green-600" },
                { label: "活跃订阅", value: u?.activeSubscriptions ?? 0, color: "text-blue-600" },
                { label: "API 调用次数", value: u?.totalApiCalls ?? 0, color: "text-purple-600" },
                { label: "本月收入（元）", value: `¥${u?.monthlyRevenue ? (u.monthlyRevenue / 100).toFixed(0) : "0"}`, color: "text-orange-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-lg border p-4 text-center">
                  <p className={`text-3xl font-bold ${color}`}>{value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>项目活动趋势</CardTitle>
            <CardDescription>近4周项目发起数量</CardDescription>
          </CardHeader>
          <CardContent>
            {chartLoading ? <Skeleton className="h-[250px] w-full" /> : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyActivity.length > 0 ? weeklyActivity : [{ week: "第1周", projects: 0 }, { week: "第2周", projects: 0 }, { week: "第3周", projects: 0 }, { week: "第4周", projects: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
                  <Bar dataKey="projects" name="项目数" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>机构类型分布</CardTitle>
            <CardDescription>平台各类机构占比</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-[250px] w-full" /> : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="60%" height={250}>
                  <PieChart>
                    <Pie data={orgDistribution.length > 0 ? orgDistribution : [{ name: "暂无数据", value: 1 }]}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                      {orgDistribution.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {orgDistribution.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>平台健康度指标</CardTitle>
          <CardDescription>关键业务指标综合评估</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? <Skeleton className="h-32 w-full" /> : (
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "项目完成率", value: (s?.totalProjects ?? 0) > 0 ? Math.round(((s?.completedProjects ?? 0) / (s?.totalProjects ?? 1)) * 100) : 0, color: "bg-green-500", status: "正常" },
                { label: "报告待审率", value: (s?.totalReports ?? 0) > 0 ? Math.round(((s?.pendingReports ?? 0) / (s?.totalReports ?? 1)) * 100) : 0, color: "bg-orange-500", status: (s?.pendingReports ?? 0) > 10 ? "需关注" : "正常" },
                { label: "机构活跃率", value: (s?.totalUsers ?? 0) > 0 ? Math.round(((s?.appraiserOrgs ?? 0) / Math.max(1, s?.totalUsers ?? 1)) * 100) : 0, color: "bg-blue-500", status: "正常" },
              ].map(({ label, value, color, status }) => (
                <div key={label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{label}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={status === "需关注" ? "destructive" : "outline"} className="text-xs">{status}</Badge>
                      <span className="font-bold">{value}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, value)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
