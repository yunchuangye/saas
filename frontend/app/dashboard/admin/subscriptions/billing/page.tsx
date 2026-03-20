"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { trpc } from "@/lib/trpc"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Receipt } from "lucide-react"

function formatDate(d: any) {
  if (!d) return "—"
  try { return format(new Date(d), "yyyy-MM-dd HH:mm", { locale: zhCN }) } catch { return "—" }
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  paid:     { label: "已支付", variant: "default" },
  pending:  { label: "待支付", variant: "secondary" },
  failed:   { label: "失败", variant: "destructive" },
  refunded: { label: "已退款", variant: "outline" },
}

const TYPE_MAP: Record<string, string> = {
  subscription: "订阅费用",
  usage:        "用量超额",
  refund:       "退款",
  credit:       "充值",
}

export default function AdminBillingPage() {
  // 使用平台级账单统计
  const { data: usageStats, isLoading } = trpc.billing.getUsageStats.useQuery()
  const stats = Array.isArray(usageStats) ? usageStats : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">账单记录</h1>
        <p className="text-muted-foreground text-sm mt-1">平台各套餐的收入统计与账单汇总</p>
      </div>

      {/* 收入汇总 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading ? (
          [1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full" />)
        ) : stats.map((s: any) => (
          <Card key={s.plan_code}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.plan_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{Number(s.total_revenue || 0).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.org_count} 家机构</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 说明卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />账单说明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>账单记录功能显示平台所有机构的订阅付款历史。当前系统处于测试阶段，所有机构均使用免费试用套餐，暂无实际付款记录。</p>
            <p>当机构通过"订阅计划"页面完成付费升级后，账单记录将自动生成并显示在此处。</p>
            <p>支持的账单类型：<strong>订阅费用</strong>（定期订阅）、<strong>用量超额</strong>（超出配额的按量计费）、<strong>退款</strong>、<strong>充值</strong>。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
