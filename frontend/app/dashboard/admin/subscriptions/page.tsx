"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { trpc } from "@/lib/trpc"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  Users, CreditCard, TrendingUp, Building2, Search, RefreshCw,
} from "lucide-react"

const PLAN_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  free:         { label: "免费版", variant: "outline" },
  starter:      { label: "入门版", variant: "secondary" },
  professional: { label: "专业版", variant: "default" },
  enterprise:   { label: "企业版", variant: "destructive" },
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  active:    { label: "正常", color: "bg-green-100 text-green-700" },
  trial:     { label: "试用中", color: "bg-blue-100 text-blue-700" },
  cancelled: { label: "已取消", color: "bg-gray-100 text-gray-600" },
  expired:   { label: "已过期", color: "bg-red-100 text-red-600" },
}

function formatDate(d: any) {
  if (!d) return "—"
  try { return format(new Date(d), "yyyy-MM-dd", { locale: zhCN }) } catch { return "—" }
}

export default function AdminSubscriptionsPage() {
  const [search, setSearch] = useState("")
  const [planFilter, setPlanFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // 获取所有套餐
  const { data: plans } = trpc.billing.getPlans.useQuery()
  // 获取平台用量统计
  const { data: usageStats, isLoading: statsLoading, refetch } = trpc.billing.getUsageStats.useQuery()

  const stats = Array.isArray(usageStats) ? usageStats : []
  const totalOrgs = stats.reduce((sum: number, s: any) => sum + Number(s.org_count || 0), 0)
  const totalRevenue = stats.reduce((sum: number, s: any) => sum + Number(s.total_revenue || 0), 0)
  const paidOrgs = stats
    .filter((s: any) => s.plan_code !== "free")
    .reduce((sum: number, s: any) => sum + Number(s.org_count || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SaaS 订阅管理</h1>
          <p className="text-muted-foreground text-sm mt-1">管理平台所有机构的订阅状态与套餐配置</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />订阅机构总数
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-3xl font-bold">{totalOrgs}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />付费机构
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-3xl font-bold text-green-600">{paidOrgs}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />累计收入（元）
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-3xl font-bold text-blue-600">
                ¥{totalRevenue.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />套餐分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="flex flex-wrap gap-1 pt-1">
                {stats.map((s: any) => (
                  <span key={s.plan_code} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {s.plan_name}: {s.org_count}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 套餐分布表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">套餐订阅分布</CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>套餐</TableHead>
                  <TableHead className="text-right">订阅机构数</TableHead>
                  <TableHead className="text-right">累计收入（元）</TableHead>
                  <TableHead className="text-right">占比</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      暂无订阅数据
                    </TableCell>
                  </TableRow>
                ) : stats.map((s: any) => {
                  const planInfo = PLAN_BADGE[s.plan_code] || { label: s.plan_name, variant: "outline" as const }
                  const pct = totalOrgs > 0 ? ((Number(s.org_count) / totalOrgs) * 100).toFixed(1) : "0"
                  return (
                    <TableRow key={s.plan_code}>
                      <TableCell>
                        <Badge variant={planInfo.variant}>{planInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{s.org_count}</TableCell>
                      <TableCell className="text-right">¥{Number(s.total_revenue || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 套餐列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">当前套餐配置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(plans ?? []).map((plan: any) => {
              const planInfo = PLAN_BADGE[plan.code] || { label: plan.name, variant: "outline" as const }
              return (
                <div key={plan.code} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={planInfo.variant}>{planInfo.label}</Badge>
                    <span className="text-xs text-muted-foreground">{plan.code}</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {plan.price_monthly === 0 ? "免费" : `¥${plan.price_monthly}`}
                      {plan.price_monthly > 0 && <span className="text-sm font-normal text-muted-foreground">/月</span>}
                    </div>
                    {plan.price_yearly > 0 && (
                      <div className="text-xs text-muted-foreground">年付 ¥{plan.price_yearly}/年</div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>项目配额：{plan.quota_projects === -1 ? "无限制" : plan.quota_projects}</div>
                    <div>用户配额：{plan.quota_users === -1 ? "无限制" : plan.quota_users}</div>
                    <div>API 调用：{plan.quota_api_calls === -1 ? "无限制" : plan.quota_api_calls?.toLocaleString()}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
