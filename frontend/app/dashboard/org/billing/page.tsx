"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CheckCircle2,
  XCircle,
  CreditCard,
  Loader2,
  Zap,
  Building2,
  Crown,
  Gift,
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

const PLAN_ICONS: Record<string, any> = {
  free: Gift,
  starter: Zap,
  professional: Building2,
  enterprise: Crown,
}

const PLAN_COLORS: Record<string, string> = {
  free: "text-gray-600",
  starter: "text-blue-600",
  professional: "text-purple-600",
  enterprise: "text-orange-600",
}

function formatQuota(val: number) {
  if (val === -1) return "无限制"
  return val.toLocaleString()
}

function FeatureCheck({ value }: { value: boolean }) {
  return value
    ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
    : <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
}

export default function BillingPage() {
  const { toast } = useToast()
  const [isYearly, setIsYearly] = useState(false)
  const [subscribingPlan, setSubscribingPlan] = useState<string | null>(null)

  const { data: plans, isLoading: plansLoading } = trpc.billing.getPlans.useQuery()
  const { data: mySubscription, refetch: refetchSub } = trpc.billing.getMySubscription.useQuery()
  const { data: billingHistory } = trpc.billing.getBillingHistory.useQuery({ page: 1, pageSize: 10 })

  const subscribeMutation = trpc.billing.subscribe.useMutation({
    onSuccess: (data) => {
      toast({ title: "订阅成功", description: data.message })
      setSubscribingPlan(null)
      refetchSub()
    },
    onError: (err: any) => {
      toast({ title: "订阅失败", description: err.message, variant: "destructive" })
      setSubscribingPlan(null)
    },
  })

  const handleSubscribe = (planCode: string) => {
    setSubscribingPlan(planCode)
    subscribeMutation.mutate({
      planCode,
      billingCycle: isYearly ? "yearly" : "monthly",
    })
  }

  const currentPlanCode = (mySubscription as any)?.plan_code

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">订阅与计费</h1>
        <p className="text-muted-foreground">管理您的订阅计划、账单记录和用量配额</p>
      </div>

      {/* 当前订阅状态 */}
      {mySubscription && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">当前套餐</p>
                <p className="text-xl font-bold">{(mySubscription as any).plan_name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  到期时间：{new Date((mySubscription as any).expires_at).toLocaleDateString("zh-CN")}
                </p>
              </div>
              <div className="text-right">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">项目用量</p>
                    <p className="font-medium">{(mySubscription as any).used_projects} / {formatQuota((mySubscription as any).quota_projects)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">AVM 调用</p>
                    <p className="font-medium">{(mySubscription as any).used_avm_calls} / {formatQuota((mySubscription as any).quota_avm_calls)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 计费周期切换 */}
      <div className="flex items-center gap-3">
        <Label>月付</Label>
        <Switch checked={isYearly} onCheckedChange={setIsYearly} />
        <Label>年付</Label>
        <Badge variant="secondary" className="text-green-600">年付享 8.3 折</Badge>
      </div>

      {/* 订阅计划卡片 */}
      {plansLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-80" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(plans as any[] ?? []).map((plan: any) => {
            const Icon = PLAN_ICONS[plan.code] ?? Gift
            const colorClass = PLAN_COLORS[plan.code] ?? "text-gray-600"
            const isCurrent = plan.code === currentPlanCode
            const price = isYearly ? plan.price_yearly : plan.price_monthly
            const monthlyEquivalent = isYearly ? (plan.price_yearly / 12).toFixed(0) : plan.price_monthly

            return (
              <Card key={plan.id} className={`relative ${isCurrent ? "border-primary ring-1 ring-primary" : ""} ${plan.code === "professional" ? "shadow-lg" : ""}`}>
                {plan.code === "professional" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-purple-600">推荐</Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-3">
                    <Badge variant="outline" className="text-primary border-primary bg-white">当前套餐</Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-6 w-6 ${colorClass}`} />
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <div className="mt-2">
                    {plan.price_monthly === 0 ? (
                      <p className="text-3xl font-bold">免费</p>
                    ) : (
                      <>
                        <p className="text-3xl font-bold">
                          ¥{isYearly ? monthlyEquivalent : price}
                          <span className="text-sm font-normal text-muted-foreground">/月</span>
                        </p>
                        {isYearly && (
                          <p className="text-xs text-muted-foreground">年付 ¥{price}</p>
                        )}
                      </>
                    )}
                  </div>
                  <CardDescription className="text-xs mt-1">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">每月项目</span>
                      <span className="font-medium">{formatQuota(plan.quota_projects)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">每月报告</span>
                      <span className="font-medium">{formatQuota(plan.quota_reports)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AVM 调用</span>
                      <span className="font-medium">{formatQuota(plan.quota_avm_calls)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">团队成员</span>
                      <span className="font-medium">{formatQuota(plan.quota_users)}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">三级审核</span>
                      <FeatureCheck value={Boolean(plan.feature_three_level_review)} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">工作底稿</span>
                      <FeatureCheck value={Boolean(plan.feature_work_sheets)} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">批量估价</span>
                      <FeatureCheck value={Boolean(plan.feature_batch_valuation)} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">API 访问</span>
                      <FeatureCheck value={Boolean(plan.feature_api_access)} />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : plan.code === "professional" ? "default" : "outline"}
                    disabled={isCurrent || subscribingPlan !== null}
                    onClick={() => handleSubscribe(plan.code)}
                  >
                    {subscribingPlan === plan.code ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCurrent ? (
                      "当前套餐"
                    ) : plan.price_monthly === 0 ? (
                      "免费使用"
                    ) : (
                      <><CreditCard className="h-4 w-4 mr-2" />立即订阅</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 账单历史 */}
      <Card>
        <CardHeader>
          <CardTitle>账单记录</CardTitle>
        </CardHeader>
        <CardContent>
          {!billingHistory?.items?.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <CreditCard className="h-10 w-10 mb-3 opacity-30" />
              <p>暂无账单记录</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>描述</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingHistory.items.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.description}</TableCell>
                    <TableCell className={`font-medium ${Number(b.amount) < 0 ? "text-green-600" : ""}`}>
                      {Number(b.amount) < 0 ? "-" : ""}¥{Math.abs(Number(b.amount)).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={b.status === "paid" ? "outline" : "secondary"} className="text-xs">
                        {b.status === "paid" ? "已支付" : b.status === "pending" ? "待支付" : b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString("zh-CN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
