"use client"

import { useState } from "react"
import {
  Landmark, Calculator, FileBarChart, Handshake, TrendingUp,
  Users, DollarSign, Eye, Code2, Copy, Check, Plus,
  BarChart3, ArrowUpRight, ArrowDownRight, Percent,
  Building, MapPin, Calendar, Sparkles, Send
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { SalesStatCard } from "@/components/sales/sales-stat-card"
import { ShareDialog } from "@/components/sales/share-dialog"
import type { ShareContentType } from "@/components/sales/share-dialog"
import {
  useBankLoanCalculatorConfig,
  useBankGenerateMarketReport,
  useBankCoMarketingCampaigns,
  useBankCreateCoMarketing,
  useBankDashboard,
  useSalesMarketData,
} from "@/hooks/use-sales"

export default function BankSalesPage() {
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [shareTitle, setShareTitle] = useState("")
  const [shareContentType, setShareContentType] = useState<ShareContentType>("report")
  const [codeCopied, setCodeCopied] = useState(false)
  const [reportForm, setReportForm] = useState({ cityId: 1, reportType: "monthly" as const, propertyTypes: ["住宅"] })
  const [coForm, setCoForm] = useState({
    title: "",
    description: "",
    type: "rate_discount",
    benefit: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  })

  const { data: calcConfig } = useBankLoanCalculatorConfig()
  const { data: campaigns } = useBankCoMarketingCampaigns()
  const { data: dashboard } = useBankDashboard()
  const { data: marketData } = useSalesMarketData(reportForm.cityId)
  const generateReport = useBankGenerateMarketReport()
  const createCoMarketing = useBankCreateCoMarketing()

  const handleShare = (url: string, title: string, contentType: ShareContentType = "report") => {
    setShareUrl(url)
    setShareTitle(title)
    setShareContentType(contentType)
    setShareOpen(true)
  }

  const handleCopyCode = async () => {
    if (!calcConfig?.embedCode) return
    await navigator.clipboard.writeText(calcConfig.embedCode).catch(() => {})
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const handleGenerateReport = async () => {
    const result = await generateReport.mutateAsync(reportForm)
    handleShare(result.downloadUrl, `${result.cityName}市场报告`, "report")
  }

  const handleCreateCo = async () => {
    const result = await createCoMarketing.mutateAsync(coForm as any)
    handleShare(result.shareUrl, coForm.title, "poster")
  }

  const statCards = [
    { title: "获客线索", value: dashboard?.totalLeads ?? 0, icon: Users, color: "blue" as const, trend: { value: 12, label: "较上月" } },
    { title: "已转化", value: dashboard?.convertedLeads ?? 0, icon: Handshake, color: "green" as const },
    { title: "转化率", value: `${dashboard?.conversionRate ?? 0}%`, icon: Percent, color: "orange" as const },
    { title: "贷款总额", value: `${Math.round((dashboard?.totalLoanAmount ?? 0) / 10000)}万`, icon: DollarSign, color: "purple" as const },
  ]

  return (
    <div className="space-y-6">
      {/* 顶部 Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">营销推广中心</h1>
            <p className="mt-1 text-sm opacity-80">银行机构 · 获客引流 · 房贷业务拓展</p>
          </div>
          <div className="rounded-xl bg-white/20 p-3">
            <Landmark className="h-6 w-6" />
          </div>
        </div>
        {/* 快捷入口 */}
        <div className="mt-5 grid grid-cols-4 gap-2">
          {[
            { label: "计算器插件", icon: Calculator },
            { label: "市场报告", icon: FileBarChart },
            { label: "联名活动", icon: Handshake },
            { label: "数据看板", icon: BarChart3 },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1.5 rounded-xl bg-white/15 p-2.5 cursor-pointer hover:bg-white/25 transition-colors">
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <SalesStatCard key={s.title} {...s} />
        ))}
      </div>

      {/* 月度趋势图 */}
      {dashboard?.monthlyTrend && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              近6月营销数据趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-2">
              {dashboard.monthlyTrend.map((m: any) => {
                const maxLeads = Math.max(...dashboard.monthlyTrend.map((x: any) => x.leads))
                const pct = maxLeads > 0 ? (m.leads / maxLeads) * 100 : 0
                return (
                  <div key={m.month} className="flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col justify-end h-20 bg-muted/30 rounded-lg overflow-hidden">
                      <div
                        className="w-full bg-blue-500 rounded-lg transition-all"
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{m.month.slice(5)}</p>
                    <p className="text-xs font-medium">{m.leads}</p>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />线索数</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 主功能 Tabs */}
      <Tabs defaultValue="calculator">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculator">房贷计算器</TabsTrigger>
          <TabsTrigger value="report">市场报告</TabsTrigger>
          <TabsTrigger value="comarketing">联名活动</TabsTrigger>
        </TabsList>

        {/* ── 房贷计算器插件 ── */}
        <TabsContent value="calculator" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="h-5 w-5 text-blue-600" />
                房贷计算器 + 估值插件
              </CardTitle>
              <CardDescription>嵌入到您的公众号、小程序或官网，获取高意向客户</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 贷款产品列表 */}
              <div className="space-y-2">
                {(calcConfig?.products ?? []).map((p: any) => (
                  <div key={p.name} className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{p.rate}%</p>
                      <p className="text-xs text-muted-foreground">首付 {p.minDown}% · 最长 {p.maxYears} 年</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 内嵌代码 */}
              <div>
                <Label className="text-sm mb-2 block">嵌入代码（复制到您的网页/小程序）</Label>
                <div className="relative">
                  <pre className="rounded-xl bg-slate-900 text-green-400 p-4 text-xs overflow-x-auto font-mono">
                    {calcConfig?.embedCode ?? "加载中..."}
                  </pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={handleCopyCode}
                  >
                    {codeCopied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {codeCopied ? "已复制" : "复制"}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleShare(calcConfig?.widgetUrl ?? "", "分享房贷计算器", "poster")}
                >
                  <Send className="mr-2 h-4 w-4" />
                  分享计算器链接
                </Button>
                <Button variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  预览效果
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 来源分析 */}
          {dashboard?.topSources && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">线索来源分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard.topSources.map((s: any) => (
                    <div key={s.source}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{s.source}</span>
                        <span className="font-medium">{s.count} 条 ({s.rate}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.rate}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── 市场报告 ── */}
        <TabsContent value="report" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileBarChart className="h-5 w-5 text-indigo-600" />
                区域市场报告生成
              </CardTitle>
              <CardDescription>生成带有银行 Logo 的区域房产市场分析报告，用于客户维护</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>选择城市</Label>
                  <Select
                    value={String(reportForm.cityId)}
                    onValueChange={(v) => setReportForm((p) => ({ ...p, cityId: Number(v) }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(marketData?.cities ?? []).map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>报告周期</Label>
                  <Select
                    value={reportForm.reportType}
                    onValueChange={(v) => setReportForm((p) => ({ ...p, reportType: v as any }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">月度报告</SelectItem>
                      <SelectItem value="quarterly">季度报告</SelectItem>
                      <SelectItem value="annual">年度报告</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 数据预览 */}
              {marketData?.stats && (
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                  <p className="text-sm font-medium text-indigo-800 mb-3">
                    {marketData.currentCity?.name ?? "所选城市"} 市场数据预览
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-indigo-700">
                        {marketData.stats.avgPrice > 0 ? `¥${marketData.stats.avgPrice.toLocaleString()}` : "暂无"}
                      </p>
                      <p className="text-xs text-muted-foreground">均价（元/㎡）</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-indigo-700">{marketData.stats.totalCases}</p>
                      <p className="text-xs text-muted-foreground">成交案例</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-indigo-700">
                        {marketData.stats.maxPrice > 0 ? `¥${marketData.stats.maxPrice.toLocaleString()}` : "暂无"}
                      </p>
                      <p className="text-xs text-muted-foreground">最高单价</p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                onClick={handleGenerateReport}
                disabled={generateReport.isPending}
              >
                <FileBarChart className="mr-2 h-4 w-4" />
                {generateReport.isPending ? "生成中..." : "生成并分享市场报告"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 联名活动 ── */}
        <TabsContent value="comarketing" className="space-y-4 mt-4">
          {/* 现有活动 */}
          <div className="space-y-3">
            {(campaigns ?? []).map((c: any) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-sm">{c.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">进行中</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="rounded-lg bg-muted/30 p-2 text-center">
                      <p className="text-base font-bold">{c.participants}</p>
                      <p className="text-xs text-muted-foreground">参与人数</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-2 text-center">
                      <p className="text-base font-bold text-green-600">{c.conversions}</p>
                      <p className="text-xs text-muted-foreground">已转化</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-2 text-center">
                      <p className="text-base font-bold text-blue-600">
                        {c.participants > 0 ? ((c.conversions / c.participants) * 100).toFixed(1) : 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">转化率</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => handleShare(`https://gujia.app/campaign/${c.id}`, c.title, "poster")}
                  >
                    分享活动链接
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 创建新活动 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-5 w-5 text-blue-600" />
                创建联名营销活动
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>活动标题</Label>
                <Input className="mt-1" placeholder="如：查房价·享利率优惠" value={coForm.title} onChange={(e) => setCoForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <Label>活动描述</Label>
                <Textarea className="mt-1" placeholder="描述活动内容和客户权益..." value={coForm.description} onChange={(e) => setCoForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label>客户权益</Label>
                <Input className="mt-1" placeholder="如：享受房贷利率优惠 5BP" value={coForm.benefit} onChange={(e) => setCoForm((p) => ({ ...p, benefit: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>开始日期</Label>
                  <Input type="date" className="mt-1" value={coForm.startDate} onChange={(e) => setCoForm((p) => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div>
                  <Label>结束日期</Label>
                  <Input type="date" className="mt-1" value={coForm.endDate} onChange={(e) => setCoForm((p) => ({ ...p, endDate: e.target.value }))} />
                </div>
              </div>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleCreateCo}
                disabled={createCoMarketing.isPending || !coForm.title}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {createCoMarketing.isPending ? "创建中..." : "创建联名活动"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 分享弹窗 */}
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={shareTitle}
        url={shareUrl}
        description="选择平台分享，获取高意向房贷线索"
        contentType={shareContentType}
      />
    </div>
  )
}
