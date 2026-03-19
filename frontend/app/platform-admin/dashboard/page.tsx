"use client"
import { trpc } from "@/lib/trpc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, TrendingUp, FileText, DollarSign, BarChart3, ArrowUp, ArrowDown } from "lucide-react"
import Link from "next/link"

export default function PlatformAdminDashboardPage() {
  const { data: revenue, isLoading: revLoading } = trpc.platformAdmin.revenueOverview.useQuery()
  const { data: stats, isLoading: statsLoading } = trpc.platformAdmin.platformStats.useQuery()

  const isLoading = revLoading || statsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  const monthGrowth = revenue?.lastMonthRevenue
    ? (((revenue.monthRevenue - revenue.lastMonthRevenue) / revenue.lastMonthRevenue) * 100).toFixed(1)
    : null

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-white">运营概览</h1>
        <p className="text-gray-400 text-sm mt-1">平台整体运营数据实时监控</p>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "本月收入",
            value: `¥${(revenue?.monthRevenue / 10000 || 0).toFixed(1)}万`,
            sub: monthGrowth ? `较上月 ${Number(monthGrowth) >= 0 ? "+" : ""}${monthGrowth}%` : "暂无对比",
            trend: monthGrowth ? Number(monthGrowth) >= 0 : null,
            icon: DollarSign, color: "text-green-400", bg: "bg-green-500/10",
          },
          {
            title: "年度收入",
            value: `¥${(revenue?.yearRevenue / 10000 || 0).toFixed(1)}万`,
            sub: "本年度累计",
            trend: null, icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10",
          },
          {
            title: "活跃租户",
            value: revenue?.tenants?.active ?? 0,
            sub: `近30天新增 ${revenue?.tenants?.new_30d ?? 0} 家`,
            trend: null, icon: Building2, color: "text-purple-400", bg: "bg-purple-500/10",
          },
          {
            title: "平台用户",
            value: (stats?.users as any[])?.reduce((s: number, r: any) => s + Number(r.count), 0) ?? 0,
            sub: "全平台注册用户",
            trend: null, icon: Users, color: "text-yellow-400", bg: "bg-yellow-500/10",
          },
        ].map((card) => (
          <Card key={card.title} className="bg-gray-900 border-gray-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{card.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {card.trend !== null && (
                      card.trend
                        ? <ArrowUp className="w-3 h-3 text-green-400" />
                        : <ArrowDown className="w-3 h-3 text-red-400" />
                    )}
                    <p className={`text-xs ${card.trend === true ? "text-green-400" : card.trend === false ? "text-red-400" : "text-gray-500"}`}>
                      {card.sub}
                    </p>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${card.bg}`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 订阅套餐分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base">订阅套餐分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(revenue?.subscriptions as any[])?.length ? (
                (revenue?.subscriptions as any[])?.map((sub: any) => (
                  <div key={sub.plan_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-gray-300 text-sm">{sub.plan_id} 套餐</span>
                    </div>
                    <span className="text-white font-medium">{sub.count} 家</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">暂无订阅数据</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 用户角色分布 */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base">用户角色分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats?.users as any[])?.map((r: any) => (
                <div key={r.role} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-gray-300 text-sm capitalize">{r.role}</span>
                  </div>
                  <span className="text-white font-medium">{r.count} 人</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 业务数据 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "报告总数", value: stats?.reports?.total ?? 0, sub: `${stats?.reports?.approved ?? 0} 份已审批`, href: "/platform-admin/dashboard/operations" },
          { label: "项目总数", value: (stats?.projects as any[])?.reduce((s: number, p: any) => s + Number(p.count), 0) ?? 0, sub: "全平台项目", href: "/platform-admin/dashboard/operations" },
          { label: "房源总数", value: stats?.listings?.total ?? 0, sub: `${stats?.listings?.sold ?? 0} 套已售`, href: "/platform-admin/dashboard/operations" },
          { label: "成交金额", value: `¥${((stats?.transactions?.total_amount || 0) / 100000000).toFixed(2)}亿`, sub: `${stats?.transactions?.total ?? 0} 笔`, href: "/platform-admin/dashboard/revenue" },
        ].map((item) => (
          <Link key={item.label} href={item.href}>
            <Card className="bg-gray-900 border-gray-800 hover:border-gray-600 transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <p className="text-xl font-bold text-white">{item.value}</p>
                <p className="text-sm text-gray-400 mt-1">{item.label}</p>
                <p className="text-xs text-gray-600 mt-0.5">{item.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 快捷操作 */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base">快捷操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "审核新租户", href: "/platform-admin/dashboard/tenants", color: "bg-blue-600 hover:bg-blue-700" },
              { label: "发布公告", href: "/platform-admin/dashboard/announcements", color: "bg-green-600 hover:bg-green-700" },
              { label: "查看收入报告", href: "/platform-admin/dashboard/revenue", color: "bg-purple-600 hover:bg-purple-700" },
              { label: "操作日志审计", href: "/platform-admin/dashboard/logs", color: "bg-gray-700 hover:bg-gray-600" },
            ].map((btn) => (
              <Link key={btn.label} href={btn.href}>
                <button className={`w-full py-2.5 px-4 rounded-lg text-white text-sm font-medium transition-colors ${btn.color}`}>
                  {btn.label}
                </button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
