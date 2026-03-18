"use client"

import { useState } from "react"
import {
  TrendingUp, BookOpen, Mail, Link2, Plus, Eye,
  MessageSquare, Download, BarChart3, Building,
  DollarSign, Users, Sparkles, Send, FileText,
  ChevronRight, MapPin, CheckCircle2, Globe, Layers
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { SalesStatCard } from "@/components/sales/sales-stat-card"
import { ShareDialog } from "@/components/sales/share-dialog"
import type { ShareContentType } from "@/components/sales/share-dialog"
import {
  useInvestorPitchbooks,
  useInvestorGeneratePitchbook,
  useInvestorGenerateNewsletter,
  useInvestorCreateProjectInvite,
  useInvestorDashboard,
  useSalesMarketData,
} from "@/hooks/use-sales"

export default function InvestorSalesPage() {
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [shareTitle, setShareTitle] = useState("")
  const [shareContentType, setShareContentType] = useState<ShareContentType>("pitchbook")
  const [selectedCities, setSelectedCities] = useState<number[]>([1, 2])
  const [newsletterPeriod, setNewsletterPeriod] = useState<"weekly" | "monthly" | "quarterly">("monthly")
  const [inviteForm, setInviteForm] = useState({
    projectTitle: "",
    projectType: "co_invest" as const,
    description: "",
    targetAmount: 0,
  })
  const [pitchForm, setPitchForm] = useState({
    title: "",
    assetType: "npl" as const,
    description: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    assets: [{ name: "", address: "", area: 0, estimatedValue: 0, propertyType: "住宅" }],
  })

  const { data: pitchbooks } = useInvestorPitchbooks()
  const { data: dashboard } = useInvestorDashboard()
  const { data: marketData } = useSalesMarketData()
  const generatePitchbook = useInvestorGeneratePitchbook()
  const generateNewsletter = useInvestorGenerateNewsletter()
  const createInvite = useInvestorCreateProjectInvite()

  const handleShare = (url: string, title: string, contentType: ShareContentType = "pitchbook") => {
    setShareUrl(url)
    setShareTitle(title)
    setShareContentType(contentType)
    setShareOpen(true)
  }

  const handleGeneratePitchbook = async () => {
    const result = await generatePitchbook.mutateAsync({
      title: pitchForm.title,
      assetType: pitchForm.assetType,
      assets: pitchForm.assets,
      targetAudience: "机构投资人",
      contactInfo: {
        name: pitchForm.contactName,
        phone: pitchForm.contactPhone,
        email: pitchForm.contactEmail,
      },
    })
    handleShare(result.shareUrl, result.title, "pitchbook")
  }

  const handleGenerateNewsletter = async () => {
    const result = await generateNewsletter.mutateAsync({
      cityIds: selectedCities,
      period: newsletterPeriod,
      focusAreas: ["价格趋势", "成交量", "政策影响"],
    })
    handleShare(result.shareUrl, `投资洞察简报 - ${result.period}`, "report")
  }

  const handleCreateInvite = async () => {
    const result = await createInvite.mutateAsync({
      ...inviteForm,
      deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
    })
    handleShare(result.inviteUrl, inviteForm.projectTitle, "invite")
  }

  const statCards = [
    { title: "推介册总数", value: dashboard?.totalPitchbooks ?? 0, icon: BookOpen, color: "blue" as const },
    { title: "总浏览量", value: dashboard?.totalViews ?? 0, icon: Eye, color: "green" as const },
    { title: "询盘次数", value: dashboard?.totalInquiries ?? 0, icon: MessageSquare, color: "orange" as const },
    { title: "询盘率", value: `${dashboard?.inquiryRate ?? 0}%`, icon: TrendingUp, color: "purple" as const },
  ]

  const assetTypeMap: Record<string, string> = {
    npl: "不良资产",
    real_estate: "房地产",
    portfolio: "资产组合",
    single: "单体资产",
  }

  return (
    <div className="space-y-6">
      {/* 顶部 Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">营销推广中心</h1>
            <p className="mt-1 text-sm opacity-80">投资机构 · 资产推介 · 行业影响力建设</p>
          </div>
          <div className="rounded-xl bg-white/20 p-3">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
        {/* 资产类型概览 */}
        {dashboard?.assetTypes && (
          <div className="mt-5 grid grid-cols-3 gap-2">
            {dashboard.assetTypes.map((a: any) => (
              <div key={a.type} className="rounded-xl bg-white/15 p-3">
                <p className="text-xs opacity-75">{a.type}</p>
                <p className="text-base font-bold mt-0.5">{a.count} 个</p>
                <p className="text-xs opacity-60">约 {Math.round(a.totalValue / 10000)} 万</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <SalesStatCard key={s.title} {...s} />
        ))}
      </div>

      {/* 主功能 Tabs */}
      <Tabs defaultValue="pitchbook">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pitchbook">资产推介册</TabsTrigger>
          <TabsTrigger value="newsletter">投资简报</TabsTrigger>
          <TabsTrigger value="invite">项目邀请码</TabsTrigger>
        </TabsList>

        {/* ── 资产推介册 ── */}
        <TabsContent value="pitchbook" className="space-y-4 mt-4">
          {/* 现有推介册列表 */}
          {(pitchbooks ?? []).length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">我的推介册</h3>
              {(pitchbooks ?? []).map((pb: any) => (
                <Card key={pb.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-sm">{pb.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">{assetTypeMap[pb.assetType] ?? pb.assetType}</Badge>
                          <span className="text-xs text-muted-foreground">{pb.assets?.length ?? 0} 个资产</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{pb.views}</span>
                          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{pb.inquiries}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-violet-600 hover:bg-violet-700" onClick={() => handleShare(pb.shareUrl ?? `https://gujia.app/pitchbook/${pb.id}`, pb.title, "pitchbook")}>
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        分享推介册
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        下载
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 创建新推介册 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-5 w-5 text-violet-600" />
                创建资产推介册
              </CardTitle>
              <CardDescription>将资产信息生成标准化推介材料，向投资人精准推介</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>推介册标题</Label>
                  <Input className="mt-1" placeholder="如：北京朝阳区不良资产包 2026Q1" value={pitchForm.title} onChange={(e) => setPitchForm((p) => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <Label>资产类型</Label>
                  <Select value={pitchForm.assetType} onValueChange={(v) => setPitchForm((p) => ({ ...p, assetType: v as any }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="npl">不良资产（NPL）</SelectItem>
                      <SelectItem value="real_estate">房地产项目</SelectItem>
                      <SelectItem value="portfolio">资产组合包</SelectItem>
                      <SelectItem value="single">单体资产</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 资产列表 */}
              <div>
                <Label className="mb-2 block">资产清单</Label>
                {pitchForm.assets.map((asset, idx) => (
                  <div key={idx} className="rounded-xl border p-3 mb-2 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">资产 #{idx + 1}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="资产名称" value={asset.name} onChange={(e) => {
                        const newAssets = [...pitchForm.assets]
                        newAssets[idx] = { ...newAssets[idx], name: e.target.value }
                        setPitchForm((p) => ({ ...p, assets: newAssets }))
                      }} />
                      <Input placeholder="地址" value={asset.address} onChange={(e) => {
                        const newAssets = [...pitchForm.assets]
                        newAssets[idx] = { ...newAssets[idx], address: e.target.value }
                        setPitchForm((p) => ({ ...p, assets: newAssets }))
                      }} />
                      <Input type="number" placeholder="面积（㎡）" value={asset.area || ""} onChange={(e) => {
                        const newAssets = [...pitchForm.assets]
                        newAssets[idx] = { ...newAssets[idx], area: Number(e.target.value) }
                        setPitchForm((p) => ({ ...p, assets: newAssets }))
                      }} />
                      <Input type="number" placeholder="估值（元）" value={asset.estimatedValue || ""} onChange={(e) => {
                        const newAssets = [...pitchForm.assets]
                        newAssets[idx] = { ...newAssets[idx], estimatedValue: Number(e.target.value) }
                        setPitchForm((p) => ({ ...p, assets: newAssets }))
                      }} />
                    </div>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPitchForm((p) => ({ ...p, assets: [...p.assets, { name: "", address: "", area: 0, estimatedValue: 0, propertyType: "住宅" }] }))}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  添加资产
                </Button>
              </div>

              {/* 联系人信息 */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>联系人</Label>
                  <Input className="mt-1" placeholder="姓名" value={pitchForm.contactName} onChange={(e) => setPitchForm((p) => ({ ...p, contactName: e.target.value }))} />
                </div>
                <div>
                  <Label>手机号</Label>
                  <Input className="mt-1" placeholder="手机号" value={pitchForm.contactPhone} onChange={(e) => setPitchForm((p) => ({ ...p, contactPhone: e.target.value }))} />
                </div>
                <div>
                  <Label>邮箱</Label>
                  <Input className="mt-1" placeholder="邮箱" value={pitchForm.contactEmail} onChange={(e) => setPitchForm((p) => ({ ...p, contactEmail: e.target.value }))} />
                </div>
              </div>

              <Button
                className="w-full bg-violet-600 hover:bg-violet-700"
                onClick={handleGeneratePitchbook}
                disabled={generatePitchbook.isPending || !pitchForm.title}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                {generatePitchbook.isPending ? "生成中..." : "生成推介册并分享"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 投资洞察简报 ── */}
        <TabsContent value="newsletter" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-5 w-5 text-purple-600" />
                投资洞察简报
              </CardTitle>
              <CardDescription>基于平台数据生成投资视角的市场简报，用于邮件营销和客户维护</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>简报周期</Label>
                <div className="flex gap-2 mt-1">
                  {(["weekly", "monthly", "quarterly"] as const).map((p) => (
                    <Button
                      key={p}
                      size="sm"
                      variant={newsletterPeriod === p ? "default" : "outline"}
                      onClick={() => setNewsletterPeriod(p)}
                      className={newsletterPeriod === p ? "bg-purple-600 hover:bg-purple-700" : ""}
                    >
                      {p === "weekly" ? "周报" : p === "monthly" ? "月报" : "季报"}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">覆盖城市</Label>
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {(marketData?.cities ?? []).slice(0, 12).map((city: any) => (
                    <label key={city.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer hover:bg-muted/30">
                      <Checkbox
                        checked={selectedCities.includes(city.id)}
                        onCheckedChange={(checked) => {
                          setSelectedCities((prev) =>
                            checked ? [...prev, city.id] : prev.filter((id) => id !== city.id)
                          )
                        }}
                      />
                      <span className="text-sm">{city.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 简报预览 */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-6 rounded bg-purple-500 flex items-center justify-center">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-semibold">GuJia.App 投资洞察</span>
                  <Badge className="bg-purple-500/30 text-purple-200 text-xs ml-auto">
                    {newsletterPeriod === "weekly" ? "周报" : newsletterPeriod === "monthly" ? "月报" : "季报"}
                  </Badge>
                </div>
                <h3 className="text-base font-bold mb-2">
                  {new Date().getFullYear()}年{new Date().getMonth() + 1}月 · 房产市场投资洞察
                </h3>
                <div className="space-y-1.5 text-xs opacity-75">
                  <p>✦ 覆盖 {selectedCities.length} 个重点城市市场数据</p>
                  <p>✦ 价格趋势 · 成交量分析 · 政策影响评估</p>
                  <p>✦ 投资机会识别与风险提示</p>
                </div>
              </div>

              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={handleGenerateNewsletter}
                disabled={generateNewsletter.isPending || selectedCities.length === 0}
              >
                <Mail className="mr-2 h-4 w-4" />
                {generateNewsletter.isPending ? "生成中..." : "生成并分享简报"}
              </Button>
            </CardContent>
          </Card>

          {/* 订阅者统计 */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">简报订阅者</p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">{dashboard?.newsletterSubscribers ?? 0}</p>
                  <p className="text-xs text-muted-foreground">已发送 {dashboard?.totalNewsletters ?? 0} 期</p>
                </div>
                <div className="rounded-xl bg-purple-50 p-3">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 项目邀请码 ── */}
        <TabsContent value="invite" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="h-5 w-5 text-fuchsia-600" />
                项目合作邀请码
              </CardTitle>
              <CardDescription>生成特定项目的定向邀请链接，招募联合投资人或处置服务商</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>项目名称</Label>
                <Input className="mt-1" placeholder="如：北京朝阳区不良资产处置项目" value={inviteForm.projectTitle} onChange={(e) => setInviteForm((p) => ({ ...p, projectTitle: e.target.value }))} />
              </div>
              <div>
                <Label>合作类型</Label>
                <Select value={inviteForm.projectType} onValueChange={(v) => setInviteForm((p) => ({ ...p, projectType: v as any }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="co_invest">联合投资</SelectItem>
                    <SelectItem value="disposal">资产处置合作</SelectItem>
                    <SelectItem value="service">服务商招募</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>项目描述</Label>
                <Textarea className="mt-1" placeholder="描述项目背景、合作需求和预期收益..." value={inviteForm.description} onChange={(e) => setInviteForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label>目标金额（元）</Label>
                <Input type="number" className="mt-1" placeholder="如：50000000" value={inviteForm.targetAmount || ""} onChange={(e) => setInviteForm((p) => ({ ...p, targetAmount: Number(e.target.value) }))} />
              </div>

              {/* 邀请码预览 */}
              <div className="rounded-xl bg-fuchsia-50 border border-fuchsia-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4 text-fuchsia-600" />
                  <span className="text-sm font-semibold text-fuchsia-800">邀请码预览</span>
                </div>
                <p className="text-xs text-fuchsia-700">
                  项目：{inviteForm.projectTitle || "待填写"}
                </p>
                <p className="text-xs text-fuchsia-700 mt-0.5">
                  类型：{inviteForm.projectType === "co_invest" ? "联合投资" : inviteForm.projectType === "disposal" ? "资产处置" : "服务商招募"}
                </p>
                <p className="text-xs text-fuchsia-700 mt-0.5">
                  目标：{inviteForm.targetAmount > 0 ? `¥${(inviteForm.targetAmount / 10000).toFixed(0)} 万元` : "待填写"}
                </p>
              </div>

              <Button
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-700"
                onClick={handleCreateInvite}
                disabled={createInvite.isPending || !inviteForm.projectTitle}
              >
                <Link2 className="mr-2 h-4 w-4" />
                {createInvite.isPending ? "生成中..." : "生成项目邀请码"}
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
        description="选择平台分享，触达目标投资人和合作伙伴"
        contentType={shareContentType}
      />
    </div>
  )
}
