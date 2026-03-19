"use client"
import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Share2, Plus, Copy, Eye, QrCode, TrendingUp, Link2 } from "lucide-react"
import { toast } from "sonner"

export default function BrokerMarketingLinksPage() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    linkType: "listing", listingId: "", title: "", description: "",
    expiresInDays: "30", maxClicks: "",
  })

  const { data, isLoading, refetch } = trpc.broker.listMarketingLinks.useQuery({ page: 1, pageSize: 20 })
  const { data: listings } = trpc.broker.listListings.useQuery({ page: 1, pageSize: 100, status: "active" })

  const createMutation = trpc.broker.createMarketingLink.useMutation({
    onSuccess: (data) => {
      toast.success("分享链接创建成功！")
      navigator.clipboard?.writeText(`${window.location.origin}${data.shareUrl}`)
      toast.info("链接已复制到剪贴板")
      setOpen(false)
      refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  const copyLink = (url: string) => {
    navigator.clipboard?.writeText(`${window.location.origin}${url}`)
    toast.success("链接已复制")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">营销分享链接</h1>
          <p className="text-sm text-gray-500 mt-1">生成房源分享链接，追踪访客意向，获取留资线索</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" />生成分享链接</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>生成营销分享链接</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>链接类型</Label>
                <Select value={form.linkType} onValueChange={v => setForm(f => ({ ...f, linkType: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="listing">单个房源</SelectItem>
                    <SelectItem value="profile">经纪人主页</SelectItem>
                    <SelectItem value="collection">房源合集</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.linkType === "listing" && (
                <div>
                  <Label>选择房源</Label>
                  <Select value={form.listingId} onValueChange={v => setForm(f => ({ ...f, listingId: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="选择房源" /></SelectTrigger>
                    <SelectContent>
                      {(listings?.items as any[])?.map((l: any) => (
                        <SelectItem key={l.id} value={String(l.id)}>{l.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>链接标题</Label>
                <Input className="mt-1" placeholder="如：精品南山3房，业主急售" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <Label>链接描述</Label>
                <Input className="mt-1" placeholder="分享给客户时显示的描述文字" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>有效天数</Label>
                  <Select value={form.expiresInDays} onValueChange={v => setForm(f => ({ ...f, expiresInDays: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7天</SelectItem>
                      <SelectItem value="30">30天</SelectItem>
                      <SelectItem value="90">90天</SelectItem>
                      <SelectItem value="365">1年</SelectItem>
                      <SelectItem value="0">永久</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>最大点击次数（空=不限）</Label>
                  <Input className="mt-1" type="number" placeholder="不限" value={form.maxClicks} onChange={e => setForm(f => ({ ...f, maxClicks: e.target.value }))} />
                </div>
              </div>
              <Button className="w-full" onClick={() => createMutation.mutate({
                linkType: form.linkType as any,
                listingId: form.listingId ? Number(form.listingId) : undefined,
                title: form.title || undefined,
                description: form.description || undefined,
                expiresInDays: form.expiresInDays ? Number(form.expiresInDays) : undefined,
                maxClicks: form.maxClicks ? Number(form.maxClicks) : undefined,
              })} disabled={createMutation.isPending}>
                {createMutation.isPending ? "生成中..." : "生成链接"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{data?.items?.length ?? 0}</p>
            <p className="text-sm text-gray-500">活跃链接</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {(data?.items as any[])?.reduce((sum: number, l: any) => sum + (l.click_count || 0), 0) ?? 0}
            </p>
            <p className="text-sm text-gray-500">总访问次数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">
              {(data?.items as any[])?.reduce((sum: number, l: any) => sum + (l.lead_count || 0), 0) ?? 0}
            </p>
            <p className="text-sm text-gray-500">获取线索数</p>
          </CardContent>
        </Card>
      </div>

      {/* 链接列表 */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <div className="space-y-3">
          {(data?.items as any[])?.map((link: any) => (
            <Card key={link.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Link2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{link.title || link.link_code}</span>
                        <Badge variant="outline" className="text-xs">
                          {link.link_type === "listing" ? "房源" : link.link_type === "profile" ? "主页" : "合集"}
                        </Badge>
                        {link.is_active ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">有效</span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">已失效</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 font-mono">{window?.location?.origin}{link.share_url}</p>
                      <div className="flex gap-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{link.click_count} 次访问</span>
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{link.lead_count} 条线索</span>
                        {link.expires_at && <span>到期：{new Date(link.expires_at).toLocaleDateString("zh-CN")}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => copyLink(link.share_url)}>
                      <Copy className="w-3 h-3 mr-1" />复制
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!data?.items || data.items.length === 0) && (
            <div className="text-center py-12 text-gray-400">
              <Share2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无分享链接，点击"生成分享链接"开始</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
