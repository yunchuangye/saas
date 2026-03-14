"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, TrendingDown, FileText, Clock, CheckCircle2 } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { trpc } from "@/lib/trpc"

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"]

export default function AppraiserAnalyticsPage() {
  const { data: stats } = trpc.dashboard.stats.useQuery()
  const { data: projectsData } = trpc.projects.list.useQuery({ page: 1, pageSize: 100 })

  // 从真实数据计算项目类型分布
  const projectTypeMap: Record<string, number> = {}
  projectsData?.items?.forEach((p: any) => {
    const type = p.propertyType || "其他"
    projectTypeMap[type] = (projectTypeMap[type] || 0) + 1
  })
  const projectTypeData = Object.entries(projectTypeMap).map(([name, value], i) => ({
    name,
    value,
    color: COLORS[i % COLORS.length],
  }))

  // 从真实数据计算月度趋势（近6个月）
  const monthlyMap: Record<string, { 项目数: number; 完成数: number }> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getMonth() + 1}月`
    monthlyMap[key] = { 项目数: 0, 完成数: 0 }
  }
  projectsData?.items?.forEach((p: any) => {
    const d = new Date(p.createdAt)
    const key = `${d.getMonth() + 1}月`
    if (monthlyMap[key]) {
      monthlyMap[key].项目数++
      if (p.status === "completed") monthlyMap[key].完成数++
    }
  })
  const monthlyData = Object.entries(monthlyMap).map(([month, v]) => ({ month, ...v, 收入: Math.round(v.完成数 * 3.2) }))

  const totalProjects = stats?.totalProjects || 0
  const completedProjects = projectsData?.items?.filter((p: any) => p.status === "completed").length || 0
  const completionRate = totalProjects > 0 ? ((completedProjects / totalProjects) * 100).toFixed(1) : "0.0"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">数据概览</h1>
        <p className="text-muted-foreground">查看公司业务数据和绩效指标</p>
      </div>

      {/* 核心指标 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总项目数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success">实时数据</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">完成率</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span>已完成 {completedProjects} 个项目</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">进行中项目</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeProjects || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span>待竞价 {stats?.biddingProjects || 0} 个</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审核报告</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.myReports || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <span>我的报告总数</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>业务趋势</CardTitle>
            <CardDescription>近6个月项目数量和完成情况</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="项目数"
                  stackId="1"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="完成数"
                  stackId="2"
                  stroke="hsl(var(--chart-2))"
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>项目类型分布</CardTitle>
            <CardDescription>各类型评估项目占比</CardDescription>
          </CardHeader>
          <CardContent>
            {projectTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={projectTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {projectTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">暂无数据</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
