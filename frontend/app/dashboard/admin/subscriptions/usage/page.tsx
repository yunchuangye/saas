"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { trpc } from "@/lib/trpc"
import { BarChart3, TrendingUp, Zap, Users } from "lucide-react"

export default function AdminUsagePage() {
  const { data: usageStats, isLoading } = trpc.billing.getUsageStats.useQuery()
  const stats = Array.isArray(usageStats) ? usageStats : []

  const totalOrgs = stats.reduce((sum: number, s: any) => sum + Number(s.org_count || 0), 0)
  const totalRevenue = stats.reduce((sum: number, s: any) => sum + Number(s.total_revenue || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">用量统计</h1>
        <p className="text-muted-foreground text-sm mt-1">平台整体用量与各套餐使用情况</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />订阅机构总数
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-3xl font-bold">{totalOrgs}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />累计收入
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-3xl font-bold text-blue-600">¥{totalRevenue.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />活跃套餐数
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-3xl font-bold text-green-600">{stats.length}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />各套餐用量分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : stats.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">暂无用量数据</div>
          ) : (
            <div className="space-y-4">
              {stats.map((s: any) => {
                const pct = totalOrgs > 0 ? (Number(s.org_count) / totalOrgs) * 100 : 0
                return (
                  <div key={s.plan_code} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{s.plan_name}</span>
                      <span className="text-muted-foreground">{s.org_count} 家机构（{pct.toFixed(1)}%）</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      累计收入：¥{Number(s.total_revenue || 0).toLocaleString()}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
