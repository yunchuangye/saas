"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, FileText, Clock, Banknote, Building2 } from "lucide-react"
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
} from "recharts"

const monthlyData = [
  { month: "1月", projects: 28, cost: 85 },
  { month: "2月", projects: 35, cost: 102 },
  { month: "3月", projects: 42, cost: 128 },
  { month: "4月", projects: 38, cost: 115 },
  { month: "5月", projects: 45, cost: 138 },
  { month: "6月", projects: 52, cost: 156 },
]

const companyPerformance = [
  { name: "华信评估", projects: 18, avgRating: 4.8, avgTime: 2.8 },
  { name: "中房评估", projects: 15, avgRating: 4.6, avgTime: 3.2 },
  { name: "正信评估", projects: 12, avgRating: 4.5, avgTime: 3.0 },
  { name: "同信评估", projects: 10, avgRating: 4.7, avgTime: 2.5 },
]

export default function InvestorAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">数据统计</h1>
        <p className="text-muted-foreground">查看估价业务数据和供应商绩效分析</p>
      </div>

      {/* 关键指标 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月项目数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">52</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success">+15.6%</span> 较上月
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">月度支出</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥156万</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success">+13.0%</span> 较上月
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均周期</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.9天</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-success" />
              <span className="text-success">-0.2天</span> 较上月
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">合作机构</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12家</div>
            <p className="text-xs text-muted-foreground">本月新增2家</p>
          </CardContent>
        </Card>
      </div>

      {/* 趋势图表 */}
      <Card>
        <CardHeader>
          <CardTitle>业务趋势</CardTitle>
          <CardDescription>近6个月项目数量与支出趋势</CardDescription>
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
                dataKey="projects"
                stroke="hsl(var(--chart-1))"
                fill="hsl(var(--chart-1))"
                fillOpacity={0.6}
                name="项目数"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 供应商绩效 */}
      <Card>
        <CardHeader>
          <CardTitle>评估公司绩效</CardTitle>
          <CardDescription>合作评估公司项目完成情况</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={companyPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="name" type="category" width={80} className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)"
                }}
              />
              <Bar dataKey="projects" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} name="项目数" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
