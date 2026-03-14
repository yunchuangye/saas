"use client"

import { useState } from "react"
import {
  Megaphone, Globe, Image, Users, Tag, BarChart3,
  Plus, Eye, MousePointerClick, UserPlus, ExternalLink,
  Building2, Star, Phone, Mail, CheckCircle2, Sparkles,
  FileText, Gift, TrendingUp, Send, ChevronRight
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
  useAppraiserMicrosite,
  useAppraiserPosterTemplates,
  useAppraiserGeneratePoster,
  useAppraiserCampaigns,
  useAppraiserLeads,
  useAppraiserIssueCoupon,
} from "@/hooks/use-sales"

export default function AppraiserSalesPage() {
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [shareTitle, setShareTitle] = useState("")
  const [shareContentType, setShareContentType] = useState<ShareContentType>("poster")
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [posterVars, setPosterVars] = useState<Record<string, string>>({})
  const [couponForm, setCouponForm] = useState({ type: "free_estimate", discount: 20, quantity: 100, expireDays: 30 })

  const { data: microsite } = useAppraiserMicrosite()
  const { data: templates } = useAppraiserPosterTemplates()
  const { data: campaigns } = useAppraiserCampaigns()
  const { data: leadsData } = useAppraiserLeads()
  const generatePoster = useAppraiserGeneratePoster()
  const issueCoupon = useAppraiserIssueCoupon()

  const handleShare = (url: string, title: string, contentType: ShareContentType = "poster") => {
    setShareUrl(url)
    setShareTitle(title)
    setShareContentType(contentType)
    setShareOpen(true)
  }

  const handleGeneratePoster = async () => {
    if (!selectedTemplate) return
    const result = await generatePoster.mutateAsync({ templateId: selectedTemplate, variables: posterVars })
    handleShare(result.shareUrl, "分享营销海报", "poster")
  }

  const handleIssueCoupon = async () => {
    const result = await issueCoupon.mutateAsync(couponForm as any)
    handleShare(result.shareUrl, "分享优惠券", "coupon")
  }

  const statCards = [
    { title: "活跃营销活动", value: campaigns?.length ?? 0, icon: Megaphone, color: "blue" as const },
    { title: "总曝光量", value: campaigns?.reduce((s: number, c: any) => s + (c.views ?? 0), 0) ?? 0, icon: Eye, color: "green" as const },
    { title: "点击量", value: campaigns?.reduce((s: number, c: any) => s + (c.clicks ?? 0), 0) ?? 0, icon: MousePointerClick, color: "orange" as const },
    { title: "获客线索", value: leadsData?.total ?? 0, icon: UserPlus, color: "purple" as const },
  ]

  const leadStatusMap: Record<string, { label: string; color: string }> = {
    new: { label: "新线索", color: "bg-blue-100 text-blue-700" },
    contacted: { label: "已联系", color: "bg-yellow-100 text-yellow-700" },
    converted: { label: "已转化", color: "bg-green-100 text-green-700" },
  }

  return (
    <div className="space-y-6">
      {/* 顶部 Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">营销推广中心</h1>
            <p className="mt-1 text-sm opacity-80">评估公司 · 品牌推广 · 获客工具套件</p>
          </div>
          <div className="rounded-xl bg-white/20 p-3">
            <Megaphone className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: "微官网", icon: Globe, action: () => handleShare(microsite?.micrositeUrl ?? "", "分享我的微官网", "poster") },
            { label: "生成海报", icon: Image, action: () => {} },
            { label: "发优惠券", icon: Gift, action: () => {} },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="flex flex-col items-center gap-2 rounded-xl bg-white/15 p-3 hover:bg-white/25 transition-colors"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <SalesStatCard key={s.title} {...s} />
        ))}
      </div>

      {/* 主功能 Tabs */}
      <Tabs defaultValue="microsite">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="microsite">微官网</TabsTrigger>
          <TabsTrigger value="poster">海报生成</TabsTrigger>
          <TabsTrigger value="leads">客户线索</TabsTrigger>
          <TabsTrigger value="coupon">优惠券</TabsTrigger>
        </TabsList>

        {/* ── 微官网 ── */}
        <TabsContent value="microsite" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-5 w-5 text-teal-600" />
                我的微官网
              </CardTitle>
              <CardDescription>一键生成专属展示页，展示公司资质和服务</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 微官网预览卡片 */}
              <div className="rounded-2xl border-2 border-dashed border-teal-200 bg-teal-50/30 p-5">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-teal-100 flex items-center justify-center">
                    <Building2 className="h-7 w-7 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base">{microsite?.org?.name ?? "我的评估公司"}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {microsite?.org?.address ?? "地址待完善"}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(microsite?.stats?.certifications ?? ["CMA认证", "CNAS认证"]).map((cert: string) => (
                        <Badge key={cert} variant="secondary" className="bg-teal-100 text-teal-700 text-xs">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-white p-2.5">
                    <p className="text-lg font-bold text-teal-700">{microsite?.stats?.totalProjects ?? 0}</p>
                    <p className="text-xs text-muted-foreground">完成项目</p>
                  </div>
                  <div className="rounded-lg bg-white p-2.5">
                    <p className="text-lg font-bold text-teal-700">{microsite?.stats?.totalReports ?? 0}</p>
                    <p className="text-xs text-muted-foreground">评估报告</p>
                  </div>
                  <div className="rounded-lg bg-white p-2.5">
                    <p className="text-lg font-bold text-teal-700">{microsite?.stats?.establishedYears ?? 8}</p>
                    <p className="text-xs text-muted-foreground">从业年限</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(microsite?.stats?.serviceAreas ?? ["住宅评估", "商业地产评估"]).map((area: string) => (
                    <Badge key={area} variant="outline" className="text-xs">{area}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                  onClick={() => handleShare(microsite?.micrositeUrl ?? "", "分享我的评估公司微官网", "poster")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  分享微官网
                </Button>
                <Button variant="outline">
                  <Sparkles className="mr-2 h-4 w-4" />
                  编辑信息
                </Button>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>微官网地址：</strong>
                  <span className="font-mono text-teal-600 ml-1">{microsite?.micrositeUrl ?? "加载中..."}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 海报生成 ── */}
        <TabsContent value="poster" className="space-y-4 mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(templates ?? []).map((tpl: any) => (
              <Card
                key={tpl.id}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedTemplate === tpl.id ? "ring-2 ring-teal-500" : ""}`}
                onClick={() => setSelectedTemplate(tpl.id)}
              >
                <CardContent className="p-4">
                  <div className="aspect-video rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 mb-3 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{tpl.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
                    </div>
                    {selectedTemplate === tpl.id && (
                      <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
                    )}
                  </div>
                  <Badge variant="secondary" className="mt-2 text-xs">{tpl.category}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          {selectedTemplate && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">填写海报内容</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(templates?.find((t: any) => t.id === selectedTemplate)?.variables ?? []).map((v: string) => (
                  <div key={v}>
                    <Label className="text-sm capitalize">{v}</Label>
                    <Input
                      className="mt-1"
                      placeholder={`请输入 ${v}`}
                      value={posterVars[v] ?? ""}
                      onChange={(e) => setPosterVars((prev) => ({ ...prev, [v]: e.target.value }))}
                    />
                  </div>
                ))}
                <Button
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  onClick={handleGeneratePoster}
                  disabled={generatePoster.isPending}
                >
                  <Image className="mr-2 h-4 w-4" />
                  {generatePoster.isPending ? "生成中..." : "生成海报并分享"}
                </Button>
              </CardContent>
            </Card>
          )}
          {/* 历史营销活动 */}
          {(campaigns ?? []).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">历史营销活动</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(campaigns ?? []).map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{c.name ?? c.id}</p>
                        <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{c.views}</span>
                          <span className="flex items-center gap-1"><MousePointerClick className="h-3 w-3" />{c.clicks}</span>
                          <span className="flex items-center gap-1"><UserPlus className="h-3 w-3" />{c.leads}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">活跃</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── 客户线索 ── */}
        <TabsContent value="leads" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">营销线索列表</h3>
              <p className="text-sm text-muted-foreground">通过营销活动获取的潜在客户</p>
            </div>
            <Badge variant="secondary">共 {leadsData?.total ?? 0} 条</Badge>
          </div>
          <div className="space-y-2">
            {(leadsData?.items ?? []).map((lead: any) => {
              const status = leadStatusMap[lead.status] ?? { label: lead.status, color: "bg-gray-100 text-gray-700" }
              return (
                <Card key={lead.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                          {lead.id}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">访客 #{lead.visitorId?.slice(-4)}</p>
                            <Badge className={`text-xs ${status.color}`}>{status.label}</Badge>
                          </div>
                          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                            <span>来源：{lead.source}</span>
                            <span>{lead.propertyType}</span>
                            <span>{lead.cityName}</span>
                          </div>
                          {lead.phone && (
                            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <Phone className="h-3 w-3" />{lead.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* ── 优惠券 ── */}
        <TabsContent value="coupon" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="h-5 w-5 text-orange-500" />
                发放优惠券
              </CardTitle>
              <CardDescription>向潜在客户定向发放优惠券，提升转化率</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>优惠券类型</Label>
                  <Select
                    value={couponForm.type}
                    onValueChange={(v) => setCouponForm((p) => ({ ...p, type: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free_estimate">免费初估体验券</SelectItem>
                      <SelectItem value="discount">折扣优惠券</SelectItem>
                      <SelectItem value="vip">VIP 专属服务券</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>折扣力度（%）</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={couponForm.discount}
                    onChange={(e) => setCouponForm((p) => ({ ...p, discount: Number(e.target.value) }))}
                    min={1}
                    max={100}
                  />
                </div>
                <div>
                  <Label>发放数量</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={couponForm.quantity}
                    onChange={(e) => setCouponForm((p) => ({ ...p, quantity: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label>有效天数</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={couponForm.expireDays}
                    onChange={(e) => setCouponForm((p) => ({ ...p, expireDays: Number(e.target.value) }))}
                  />
                </div>
              </div>
              {/* 优惠券预览 */}
              <div className="rounded-2xl bg-gradient-to-r from-orange-400 to-red-500 p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">gujia.app 评估优惠券</span>
                  <Badge className="bg-white/20 text-white text-xs">限量 {couponForm.quantity} 张</Badge>
                </div>
                <p className="text-3xl font-bold mb-1">
                  {couponForm.type === "free_estimate" ? "免费初估" : `${couponForm.discount}% OFF`}
                </p>
                <p className="text-xs opacity-80">有效期 {couponForm.expireDays} 天 · 房产评估服务专用</p>
              </div>
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={handleIssueCoupon}
                disabled={issueCoupon.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                {issueCoupon.isPending ? "生成中..." : "生成并分享优惠券"}
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
        description="选择平台分享，扩大品牌影响力"
        contentType={shareContentType}
      />
    </div>
  )
}
