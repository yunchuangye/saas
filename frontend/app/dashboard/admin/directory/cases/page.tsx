"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Search, TrendingUp, Bot, ChevronDown, Database, Sparkles, GitCompare, ShieldAlert, Calculator, Zap } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useRouter } from "next/navigation"

const AI_FEATURES = [
  { label: "AI 智能采集", href: "/dashboard/admin/directory/cases/ai-collect", icon: Database, desc: "从链家、贝壳等平台采集数据", color: "text-blue-600", bg: "bg-blue-100" },
  { label: "AI 数据清洗", href: "/dashboard/admin/directory/cases/ai-clean", icon: Sparkles, desc: "检测重复、缺失、异常数据", color: "text-emerald-600", bg: "bg-emerald-100" },
  { label: "AI 价格预测", href: "/dashboard/admin/directory/cases/ai-predict", icon: TrendingUp, desc: "预测未来价格走势", color: "text-violet-600", bg: "bg-violet-100" },
  { label: "AI 案例匹配", href: "/dashboard/admin/directory/cases/ai-match", icon: GitCompare, desc: "智能匹配相似成交案例", color: "text-cyan-600", bg: "bg-cyan-100" },
  { label: "AI 异常检测", href: "/dashboard/admin/directory/cases/ai-anomaly", icon: ShieldAlert, desc: "检测价格异常、面积异常", color: "text-rose-600", bg: "bg-rose-100" },
  { label: "AI 批量估值", href: "/dashboard/admin/directory/cases/ai-batch", icon: Calculator, desc: "多方法批量处理估值", color: "text-amber-600", bg: "bg-amber-100" },
]

export default function CasesPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const { data, isLoading } = trpc.directory.listCases.useQuery({ page, pageSize: 20, search: search || undefined })
  const cases = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">成交案例</h1>
          <p className="text-muted-foreground">管理房产成交案例数据</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">共 {total} 条案例</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-[#0A2540] hover:bg-[#0d2f4f] text-white gap-1.5">
                <Bot className="h-4 w-4" />
                OpenClaw AI
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-3.5 w-3.5" />AI 智能功能
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {AI_FEATURES.map(feature => (
                <DropdownMenuItem key={feature.href} onClick={() => router.push(feature.href)} className="cursor-pointer py-2.5">
                  <div className="flex items-start gap-3 w-full">
                    <feature.icon className={`h-4 w-4 mt-0.5 shrink-0 ${feature.color}`} />
                    <div>
                      <p className="text-sm font-medium">{feature.label}</p>
                      <p className="text-xs text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {AI_FEATURES.map(feature => (
          <div key={feature.href} className="cursor-pointer rounded-lg border bg-card p-3 text-center hover:shadow-md hover:border-primary/30 transition-all" onClick={() => router.push(feature.href)}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg mx-auto mb-2 ${feature.bg}`}>
              <feature.icon className={`h-4 w-4 ${feature.color}`} />
            </div>
            <p className="text-xs font-medium leading-tight">{feature.label.replace("AI ", "")}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="搜索案例..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mb-4 opacity-30" /><p>暂无案例数据</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>物业地址</TableHead>
                    <TableHead>物业类型</TableHead>
                    <TableHead>面积(㎡)</TableHead>
                    <TableHead>成交价格</TableHead>
                    <TableHead>单价(元/㎡)</TableHead>
                    <TableHead>成交日期</TableHead>
                    <TableHead>数据来源</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="max-w-xs truncate">{c.address ?? "-"}</TableCell>
                      <TableCell>{c.propertyType ?? "-"}</TableCell>
                      <TableCell>{c.area ?? "-"}</TableCell>
                      <TableCell className="font-medium">{c.totalPrice ? `¥${Number(c.totalPrice).toLocaleString()}` : "-"}</TableCell>
                      <TableCell>{c.unitPrice ? `¥${Number(c.unitPrice).toLocaleString()}` : "-"}</TableCell>
                      <TableCell>{c.dealDate ? new Date(c.dealDate).toLocaleDateString() : "-"}</TableCell>
                      <TableCell><Badge variant="outline">{c.source ?? "手动录入"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">共 {total} 条记录</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p-1)}>上一页</Button>
                  <Button variant="outline" size="sm" disabled={cases.length < 20} onClick={() => setPage(p => p+1)}>下一页</Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
