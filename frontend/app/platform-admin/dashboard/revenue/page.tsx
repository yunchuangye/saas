"use client"
import { trpc } from "@/lib/trpc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Building2, CreditCard } from "lucide-react"

export default function PlatformAdminRevenuePage() {
  const { data: revenue, isLoading } = trpc.platformAdmin.revenueOverview.useQuery()

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">收入监控</h1>
        <p className="text-gray-400 text-sm mt-1">平台订阅收入、交易佣金、API 调用费实时监控</p>
      </div>

      {/* 收入指标 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "本月收入", value: `¥${((revenue?.monthRevenue || 0) / 10000).toFixed(2)}万`, icon: DollarSign, color: "text-green-400", bg: "bg-green-500/10" },
          { label: "年度收入", value: `¥${((revenue?.yearRevenue || 0) / 10000).toFixed(2)}万`, icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "活跃租户", value: `${revenue?.tenants?.active ?? 0} 家`, icon: Building2, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "新增租户(30天)", value: `${revenue?.tenants?.new_30d ?? 0} 家`, icon: CreditCard, color: "text-yellow-400", bg: "bg-yellow-500/10" },
        ].map(card => (
          <Card key={card.label} className="bg-gray-900 border-gray-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{card.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
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
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader><CardTitle className="text-white text-base">订阅套餐分布</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(revenue?.subscriptions as any[])?.length ? (
              (revenue?.subscriptions as any[])?.map((sub: any, idx: number) => {
                const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-yellow-500"]
                const total = (revenue?.subscriptions as any[])?.reduce((s: number, r: any) => s + Number(r.count), 0) || 1
                const pct = Math.round((Number(sub.count) / total) * 100)
                return (
                  <div key={sub.plan_id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{sub.plan_id} 套餐</span>
                      <span className="text-white">{sub.count} 家 ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full ${colors[idx % colors.length]} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-gray-500 text-sm text-center py-6">暂无订阅数据</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 收入趋势（月度） */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader><CardTitle className="text-white text-base">月度收入趋势</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(revenue?.monthlyTrend as any[])?.length ? (
              (revenue?.monthlyTrend as any[])?.map((m: any) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm w-16">{m.month}</span>
                  <div className="flex-1 h-6 bg-gray-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded flex items-center justify-end pr-2"
                      style={{ width: `${Math.min(100, (m.revenue / (revenue?.yearRevenue || 1)) * 100 * 12)}%` }}
                    >
                      <span className="text-white text-xs">¥{(m.revenue / 10000).toFixed(1)}万</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-6">暂无趋势数据</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
