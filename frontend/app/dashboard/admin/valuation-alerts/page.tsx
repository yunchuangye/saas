"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Loader2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

const SEVERITY_MAP = {
  critical: { label: "严重", color: "text-red-600", bgColor: "bg-red-50", badgeVariant: "destructive" as const },
  high:     { label: "高风险", color: "text-orange-600", bgColor: "bg-orange-50", badgeVariant: "destructive" as const },
  medium:   { label: "中风险", color: "text-yellow-600", bgColor: "bg-yellow-50", badgeVariant: "default" as const },
  low:      { label: "低风险", color: "text-blue-600", bgColor: "bg-blue-50", badgeVariant: "secondary" as const },
}

export default function ValuationAlertsPage() {
  const { toast } = useToast()
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [resolvedFilter, setResolvedFilter] = useState<string>("unresolved")

  const { data: summary } = trpc.valuationAlerts.summary.useQuery()
  const { data: alertsData, isLoading, refetch } = trpc.valuationAlerts.list.useQuery({
    severity: severityFilter !== "all" ? severityFilter as any : undefined,
    isResolved: resolvedFilter === "all" ? undefined : resolvedFilter === "resolved",
    page: 1,
    pageSize: 50,
  })

  const resolveMutation = trpc.valuationAlerts.resolve.useMutation({
    onSuccess: () => {
      toast({ title: "已标记为已处理" })
      refetch()
    },
    onError: (err: any) => toast({ title: "操作失败", description: err.message, variant: "destructive" }),
  })

  const alerts = alertsData?.items ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">估价偏离度预警</h1>
        <p className="text-muted-foreground">监控人工估价与 AVM 自动估价之间的偏差，识别异常估价</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">未处理</span>
            </div>
            <p className="text-2xl font-bold">{(summary as any)?.unresolved ?? 0}</p>
          </CardContent>
        </Card>
        {["critical", "high", "medium", "low"].map((sev) => {
          const info = SEVERITY_MAP[sev as keyof typeof SEVERITY_MAP]
          return (
            <Card key={sev} className={`${info.bgColor} border-0`}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={`h-5 w-5 ${info.color}`} />
                  <span className={`text-sm ${info.color} font-medium`}>{info.label}</span>
                </div>
                <p className="text-2xl font-bold">{(summary as any)?.[sev] ?? 0}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 过滤器 */}
      <div className="flex gap-3">
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="风险等级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部等级</SelectItem>
            <SelectItem value="critical">严重</SelectItem>
            <SelectItem value="high">高风险</SelectItem>
            <SelectItem value="medium">中风险</SelectItem>
            <SelectItem value="low">低风险</SelectItem>
          </SelectContent>
        </Select>
        <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="处理状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="unresolved">未处理</SelectItem>
            <SelectItem value="resolved">已处理</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 预警列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            预警记录
            {alerts.length > 0 && <Badge variant="secondary">{alerts.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ShieldCheck className="h-12 w-12 mb-4 opacity-30" />
              <p>暂无预警记录</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>项目</TableHead>
                  <TableHead>AVM 估价</TableHead>
                  <TableHead>人工估价</TableHead>
                  <TableHead>偏差</TableHead>
                  <TableHead>风险等级</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((a: any) => {
                  const sev = SEVERITY_MAP[a.severity as keyof typeof SEVERITY_MAP] ?? SEVERITY_MAP.low
                  const deviationPct = Number(a.deviation_pct) * 100
                  const isPositive = deviationPct > 0
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium max-w-[150px] truncate">
                        {a.project_title || `项目 #${a.project_id}`}
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.avm_value ? `${(Number(a.avm_value) / 10000).toFixed(0)}万` : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.manual_value ? `${(Number(a.manual_value) / 10000).toFixed(0)}万` : "—"}
                      </TableCell>
                      <TableCell>
                        <span className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
                          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {isPositive ? "+" : ""}{deviationPct.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sev.badgeVariant} className="text-xs">{sev.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {a.is_resolved ? (
                          <Badge variant="outline" className="text-xs text-green-600">已处理</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">待处理</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString("zh-CN")}
                      </TableCell>
                      <TableCell className="text-right">
                        {!a.is_resolved && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resolveMutation.mutate({ id: a.id })}
                            disabled={resolveMutation.isPending}
                          >
                            {resolveMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <><CheckCircle2 className="h-4 w-4 mr-1" />标记处理</>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
