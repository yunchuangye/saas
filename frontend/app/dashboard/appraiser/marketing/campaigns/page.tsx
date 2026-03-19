"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Megaphone, Plus, Users, TrendingUp, Gift, Calendar, Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: "进行中", color: "bg-green-500" },
  ended: { label: "已结束", color: "bg-gray-400" },
  scheduled: { label: "待开始", color: "bg-blue-500" },
  draft: { label: "草稿", color: "bg-yellow-500" },
}

export default function AppraiserCampaignsPage() {
  const { toast } = useToast()
  const { data, isLoading } = trpc.sales.appraiser_getCampaigns.useQuery()
  const campaigns = (data as any)?.campaigns ?? []

  const issueMutation = trpc.sales.appraiser_issueCoupon.useMutation({
    onSuccess: () => toast({ title: "优惠券已发放", description: "优惠券已成功发放给用户" }),
    onError: (err) => toast({ title: "发放失败", description: err.message, variant: "destructive" }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">营销活动</h1>
          <p className="text-muted-foreground">管理优惠活动和推广方案，吸引更多客户</p>
        </div>
        <Button onClick={() => toast({ title: "创建活动", description: "活动创建功能即将上线" })}>
          <Plus className="mr-2 h-4 w-4" />创建活动
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}</div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Megaphone className="h-14 w-14 mb-4 opacity-30" />
            <p className="text-lg font-medium mb-1">暂无营销活动</p>
            <p className="text-sm mb-4">创建营销活动，吸引更多客户委托评估</p>
            <Button onClick={() => toast({ title: "创建活动", description: "活动创建功能即将上线" })}>
              <Plus className="mr-2 h-4 w-4" />创建第一个活动
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((campaign: any) => {
            const status = statusMap[campaign.status] ?? { label: campaign.status, color: "bg-gray-400" }
            return (
              <Card key={campaign.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <CardDescription>{campaign.description}</CardDescription>
                    </div>
                    <Badge className={`${status.color} text-white`}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg bg-muted p-2">
                      <p className="text-lg font-bold">{campaign.participantCount ?? 0}</p>
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Users className="h-3 w-3" />参与人数
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted p-2">
                      <p className="text-lg font-bold">{campaign.conversionCount ?? 0}</p>
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <TrendingUp className="h-3 w-3" />转化数
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted p-2">
                      <p className="text-lg font-bold">{campaign.couponCount ?? 0}</p>
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Gift className="h-3 w-3" />优惠券
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : "即日起"} —
                      {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : "长期有效"}
                    </span>
                    {campaign.status === "active" && (
                      <Button size="sm" variant="outline"
                        onClick={() => issueMutation.mutate({ campaignId: campaign.id, userId: 0 })}
                        disabled={issueMutation.isPending}>
                        {issueMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Gift className="h-3 w-3" />}
                        <span className="ml-1">发放优惠券</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
