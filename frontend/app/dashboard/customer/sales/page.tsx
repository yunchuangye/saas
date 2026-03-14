"use client"

import { useState } from "react"
import {
  Gift, Users, Share2, ShoppingCart, Copy, Check,
  QrCode, Star, Clock, MapPin, ChevronRight, Sparkles,
  ArrowRight, Trophy, Wallet
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesStatCard } from "@/components/sales/sales-stat-card"
import { ShareDialog } from "@/components/sales/share-dialog"
import {
  useCustomerInviteCode,
  useCustomerInviteStats,
  useCustomerGroupBuying,
  useCustomerJoinGroup,
} from "@/hooks/use-sales"

export default function CustomerSalesPage() {
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [shareTitle, setShareTitle] = useState("")
  const [joinedGroups, setJoinedGroups] = useState<number[]>([])

  const { data: inviteCode, isLoading: loadingCode } = useCustomerInviteCode()
  const { data: inviteStats } = useCustomerInviteStats()
  const { data: groups } = useCustomerGroupBuying()
  const joinGroup = useCustomerJoinGroup()

  const handleShare = (url: string, title: string) => {
    setShareUrl(url)
    setShareTitle(title)
    setShareOpen(true)
  }

  const handleJoinGroup = async (groupId: number) => {
    await joinGroup.mutateAsync({ groupId, propertyAddress: "待填写" })
    setJoinedGroups((prev) => [...prev, groupId])
  }

  const statCards = [
    { title: "已邀请好友", value: inviteStats?.totalInvited ?? 0, icon: Users, color: "blue" as const },
    { title: "累计奖励", value: `¥${inviteStats?.totalReward ?? 0}`, icon: Wallet, color: "green" as const },
    { title: "待结算奖励", value: `¥${inviteStats?.pendingReward ?? 0}`, icon: Gift, color: "orange" as const },
    { title: "参与活动", value: joinedGroups.length, icon: ShoppingCart, color: "purple" as const },
  ]

  return (
    <div className="space-y-6">
      {/* 顶部 Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">我的营销中心</h1>
            <p className="mt-1 text-sm opacity-80">邀请好友 · 拼团优惠 · 分享赚佣金</p>
          </div>
          <div className="rounded-xl bg-white/20 p-3">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-white/15 p-4">
          <div className="flex-1">
            <p className="text-xs opacity-75">我的专属邀请码</p>
            <p className="mt-0.5 font-mono text-lg font-bold tracking-wider">
              {loadingCode ? "加载中..." : (inviteCode?.code ?? "---")}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="bg-white text-blue-700 hover:bg-white/90"
            onClick={() => handleShare(inviteCode?.inviteUrl ?? "", "分享我的邀请码")}
          >
            <Share2 className="mr-1.5 h-3.5 w-3.5" />
            立即分享
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <SalesStatCard key={s.title} {...s} />
        ))}
      </div>

      {/* 主功能 Tabs */}
      <Tabs defaultValue="invite">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invite">邀请返佣</TabsTrigger>
          <TabsTrigger value="group">拼团评估</TabsTrigger>
          <TabsTrigger value="share">分享赚钱</TabsTrigger>
        </TabsList>

        {/* ── 邀请返佣 ── */}
        <TabsContent value="invite" className="space-y-4 mt-4">
          {/* 邀请规则说明 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-5 w-5 text-yellow-500" />
                邀请奖励规则
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { step: "1", title: "分享邀请链接", desc: "将您的专属链接发送给朋友", color: "bg-blue-50 border-blue-100" },
                  { step: "2", title: "好友注册下单", desc: "好友通过链接注册并完成评估订单", color: "bg-green-50 border-green-100" },
                  { step: "3", title: "获得佣金奖励", desc: "每单成功获得 50 元优惠券奖励", color: "bg-orange-50 border-orange-100" },
                ].map((item) => (
                  <div key={item.step} className={`rounded-xl border p-4 ${item.color}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold shadow-sm">
                        {item.step}
                      </span>
                      <span className="font-medium text-sm">{item.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 邀请码卡片 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">我的邀请链接</CardTitle>
              <CardDescription>分享给朋友，好友注册即可获得奖励</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground mb-1">专属邀请链接</p>
                <p className="font-mono text-sm text-blue-600 break-all">
                  {inviteCode?.inviteUrl ?? "加载中..."}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => handleShare(inviteCode?.inviteUrl ?? "", "邀请好友使用 gujia.app")}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  分享邀请链接
                </Button>
                <Button variant="outline" onClick={() => handleShare(inviteCode?.inviteUrl ?? "", "扫码邀请")}>
                  <QrCode className="mr-2 h-4 w-4" />
                  生成二维码
                </Button>
              </div>
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                <p className="text-xs text-blue-700">
                  <strong>奖励说明：</strong>{inviteCode?.reward ?? "每成功邀请1人注册并下单，获得50元优惠券"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 邀请记录 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">邀请记录</CardTitle>
            </CardHeader>
            <CardContent>
              {(inviteStats?.totalInvited ?? 0) === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">还没有邀请记录</p>
                  <p className="text-xs text-muted-foreground mt-1">快去分享你的邀请链接吧！</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.from({ length: Math.min(inviteStats?.totalInvited ?? 0, 5) }, (_, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold">
                          {String.fromCharCode(65 + i)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">用户 {String.fromCharCode(65 + i)}</p>
                          <p className="text-xs text-muted-foreground">已完成评估订单</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">+¥50</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 拼团评估 ── */}
        <TabsContent value="group" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">拼团评估活动</h3>
              <p className="text-sm text-muted-foreground">多人拼团享受评估费用折扣</p>
            </div>
          </div>
          {(groups ?? []).map((group: any) => {
            const progress = (group.currentPeople / group.minPeople) * 100
            const isJoined = joinedGroups.includes(group.id)
            const isClosed = group.status === "closed"
            const daysLeft = Math.ceil((new Date(group.deadline).getTime() - Date.now()) / 86400000)
            return (
              <Card key={group.id} className={isClosed ? "opacity-60" : ""}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{group.title}</h4>
                        {isClosed && <Badge variant="secondary">已结束</Badge>}
                        {isJoined && <Badge className="bg-green-100 text-green-700">已参与</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{group.cityName}</span>
                        <span>{group.propertyType}</span>
                        {!isClosed && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />剩余 {daysLeft} 天</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">¥{group.groupPrice}</p>
                      <p className="text-xs text-muted-foreground line-through">¥{group.originalPrice}</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>已参与 {group.currentPeople} 人</span>
                      <span>目标 {group.minPeople} 人</span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={isClosed || isJoined}
                      onClick={() => handleJoinGroup(group.id)}
                    >
                      {isJoined ? "已参与" : isClosed ? "已结束" : "立即参团"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare(`https://gujia.app/group/${group.id}`, `邀请参与拼团：${group.title}`)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        {/* ── 分享赚钱 ── */}
        <TabsContent value="share" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="h-5 w-5 text-yellow-500" />
                分享估值结果
              </CardTitle>
              <CardDescription>将您的房产估值结果生成精美卡片，分享到朋友圈</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 估值卡片预览 */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-xs font-bold">G</span>
                  </div>
                  <span className="text-sm font-semibold">gujia.app 房产估值</span>
                </div>
                <p className="text-xs opacity-60 mb-1">某住宅 · 约 89㎡</p>
                <p className="text-3xl font-bold mb-1">约 <span className="text-yellow-400">285</span> 万</p>
                <p className="text-xs opacity-60">参考区间：265万 ~ 305万</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs opacity-50">数据来源：gujia.app</p>
                  <div className="h-8 w-8 rounded bg-white/20 flex items-center justify-center">
                    <QrCode className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                卡片已自动隐藏精确地址，保护您的隐私
              </p>
              <Button
                className="w-full"
                onClick={() => handleShare("https://gujia.app/share/valuation/demo", "分享我的房产估值")}
              >
                <Share2 className="mr-2 h-4 w-4" />
                生成并分享估值卡片
              </Button>
            </CardContent>
          </Card>

          {/* 分享奖励说明 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">分享奖励说明</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { action: "好友通过分享链接注册", reward: "获得 20 元优惠券", icon: "🎁" },
                  { action: "好友完成首次评估订单", reward: "额外获得 50 元奖励", icon: "💰" },
                  { action: "好友邀请新用户注册", reward: "三级奖励 10 元/人", icon: "🔗" },
                ].map((item) => (
                  <div key={item.action} className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <p className="text-sm">{item.action}</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 shrink-0">
                      {item.reward}
                    </Badge>
                  </div>
                ))}
              </div>
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
        description="复制链接或扫描二维码分享给好友"
        qrUrl={shareUrl}
      />
    </div>
  )
}
