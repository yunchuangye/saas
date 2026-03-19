"use client"
import { trpc } from "@/lib/trpc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Users, ArrowRightLeft, Calendar, TrendingUp, Plus, Eye, Star } from "lucide-react"
import Link from "next/link"

export default function BrokerDashboardPage() {
  const { data: stats, isLoading } = trpc.broker.dashboardStats.useQuery()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  const statCards = [
    {
      title: "在售房源",
      value: stats?.listings?.active ?? 0,
      sub: `共 ${stats?.listings?.total ?? 0} 套`,
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/dashboard/broker/listings",
    },
    {
      title: "高意向客户",
      value: stats?.clients?.high_intention ?? 0,
      sub: `共 ${stats?.clients?.total ?? 0} 位客户`,
      icon: Star,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      href: "/dashboard/broker/clients",
    },
    {
      title: "待看房预约",
      value: stats?.viewings?.scheduled ?? 0,
      sub: "近期待带看",
      icon: Calendar,
      color: "text-green-600",
      bg: "bg-green-50",
      href: "/dashboard/broker/viewings",
    },
    {
      title: "成交佣金",
      value: `¥${((stats?.transactions?.total_commission ?? 0) / 10000).toFixed(1)}万`,
      sub: `${stats?.transactions?.completed ?? 0} 笔成交`,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/dashboard/broker/transactions",
    },
  ]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">经纪机构工作台</h1>
          <p className="text-sm text-gray-500 mt-1">管理房源、客户、带看和交易全流程</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/broker/listings/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              发布房源
            </Button>
          </Link>
          <Link href="/dashboard/broker/clients">
            <Button size="sm" variant="outline">
              <Users className="w-4 h-4 mr-1" />
              添加客户
            </Button>
          </Link>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                  </div>
                  <div className={`p-3 rounded-full ${card.bg}`}>
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 业务流程引导 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">业务流程</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { step: "1", title: "发布房源", desc: "录入房源信息，上传图片和产权资料", href: "/dashboard/broker/listings/new", color: "bg-blue-500" },
                { step: "2", title: "管理客源", desc: "录入买方客户，跟踪意向等级", href: "/dashboard/broker/clients", color: "bg-green-500" },
                { step: "3", title: "安排带看", desc: "预约带看时间，记录客户反馈", href: "/dashboard/broker/viewings", color: "bg-yellow-500" },
                { step: "4", title: "发起交易", desc: "买卖双方达成意向后创建交易", href: "/dashboard/broker/transactions/new", color: "bg-purple-500" },
                { step: "5", title: "委托估价", desc: "为交易房产发起专业估价", href: "/dashboard/broker/transactions", color: "bg-red-500" },
              ].map((item) => (
                <Link key={item.step} href={item.href}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className={`w-7 h-7 rounded-full ${item.color} text-white text-sm font-bold flex items-center justify-center flex-shrink-0`}>
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 营销工具 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">营销工具</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: "生成房源分享链接", desc: "一键生成带水印的房源分享页，追踪访客意向", href: "/dashboard/broker/marketing/links", icon: "🔗" },
                { title: "客户意向追踪", desc: "查看哪些客户浏览了你的房源，获取留资线索", href: "/dashboard/broker/marketing/links", icon: "👁" },
                { title: "带看预约管理", desc: "在线预约带看，自动发送提醒短信", href: "/dashboard/broker/viewings", icon: "📅" },
                { title: "营销数据看板", desc: "分析渠道转化率、经纪人业绩排行", href: "/dashboard/broker/analytics", icon: "📊" },
              ].map((item) => (
                <Link key={item.title} href={item.href}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 今日待办 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            今日待办
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{stats?.viewings?.scheduled ?? 0}</p>
              <p className="text-sm text-gray-600 mt-1">待带看预约</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{stats?.clients?.high_intention ?? 0}</p>
              <p className="text-sm text-gray-600 mt-1">高意向客户待跟进</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats?.transactions?.total ?? 0}</p>
              <p className="text-sm text-gray-600 mt-1">进行中交易</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
