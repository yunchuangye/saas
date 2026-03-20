"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { trpc } from "@/lib/trpc"
import { CheckCircle2, XCircle, Settings } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

function FeatureRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      {value
        ? <CheckCircle2 className="h-4 w-4 text-green-500" />
        : <XCircle className="h-4 w-4 text-gray-300" />}
    </div>
  )
}

function QuotaRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value === -1 ? "无限制" : value?.toLocaleString?.() ?? value}</span>
    </div>
  )
}

const PLAN_COLORS: Record<string, string> = {
  free: "border-gray-200",
  starter: "border-blue-200",
  professional: "border-purple-300",
  enterprise: "border-orange-300",
}

const PLAN_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  free: "outline",
  starter: "secondary",
  professional: "default",
  enterprise: "destructive",
}

export default function AdminSubscriptionPlansPage() {
  const { data: plans, isLoading } = trpc.billing.getPlans.useQuery()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">套餐配置</h1>
          <p className="text-muted-foreground text-sm mt-1">查看和管理平台所有订阅套餐的功能与配额</p>
        </div>
        <Button variant="outline" size="sm" disabled>
          <Settings className="h-4 w-4 mr-2" />编辑套餐
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-96 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(plans ?? []).map((plan: any) => (
            <Card key={plan.code} className={`border-2 ${PLAN_COLORS[plan.code] || "border-gray-200"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant={PLAN_BADGE[plan.code] || "outline"}>{plan.name}</Badge>
                  <span className="text-xs text-muted-foreground uppercase">{plan.code}</span>
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-bold">
                    {plan.price_monthly === 0 ? "免费" : `¥${plan.price_monthly}`}
                    {plan.price_monthly > 0 && <span className="text-sm font-normal text-muted-foreground">/月</span>}
                  </div>
                  {plan.price_yearly > 0 && (
                    <div className="text-xs text-muted-foreground mt-0.5">年付 ¥{plan.price_yearly}/年（节省 {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}%）</div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">配额限制</div>
                  <QuotaRow label="项目数" value={plan.quota_projects} />
                  <QuotaRow label="报告数" value={plan.quota_reports} />
                  <QuotaRow label="AVM 调用" value={plan.quota_avm_calls} />
                  <QuotaRow label="API 调用" value={plan.quota_api_calls} />
                  <QuotaRow label="用户数" value={plan.quota_users} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">功能权限</div>
                  <FeatureRow label="三级审核" value={Boolean(plan.feature_three_level_review)} />
                  <FeatureRow label="工作底稿" value={Boolean(plan.feature_work_sheets)} />
                  <FeatureRow label="批量估价" value={Boolean(plan.feature_batch_valuation)} />
                  <FeatureRow label="API 接入" value={Boolean(plan.feature_api_access)} />
                  <FeatureRow label="白标品牌" value={Boolean(plan.feature_white_label)} />
                  <FeatureRow label="优先支持" value={Boolean(plan.feature_priority_support)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
