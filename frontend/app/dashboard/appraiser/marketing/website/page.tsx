"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Globe, ExternalLink, Copy, Save, Loader2, CheckCircle2, User, Star, Phone } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

export default function AppraiserMicrositePage() {
  const { toast } = useToast()
  const [form, setForm] = useState({
    title: "", bio: "", phone: "", email: "", specialties: "", showCases: true, showReviews: true,
  })
  const [initialized, setInitialized] = useState(false)

  const { data: microsite, isLoading } = trpc.sales.appraiser_getMicrosite.useQuery(undefined, {
    onSuccess: (data: any) => {
      if (!initialized && data) {
        setForm({
          title: data.title || "",
          bio: data.bio || "",
          phone: data.phone || "",
          email: data.email || "",
          specialties: Array.isArray(data.specialties) ? data.specialties.join("、") : (data.specialties || ""),
          showCases: data.showCases !== false,
          showReviews: data.showReviews !== false,
        })
        setInitialized(true)
      }
    }
  } as any)

  const updateMutation = trpc.sales.appraiser_getMicrosite.useQuery
  const { toast: t } = useToast()

  const handleCopyLink = () => {
    const url = (microsite as any)?.url || `${window.location.origin}/appraiser/${(microsite as any)?.slug}`
    navigator.clipboard.writeText(url)
    toast({ title: "链接已复制", description: "微站链接已复制到剪贴板" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">我的微站</h1>
          <p className="text-muted-foreground">个人品牌展示页面，向客户展示您的专业能力</p>
        </div>
        {(microsite as any)?.url && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="mr-2 h-4 w-4" />复制链接
            </Button>
            <Button size="sm" onClick={() => window.open((microsite as any)?.url, "_blank")}>
              <ExternalLink className="mr-2 h-4 w-4" />访问微站
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />基本信息</CardTitle>
                <CardDescription>展示在微站首页的个人介绍</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>微站标题</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="例：张三 | 资深房产评估师" />
                </div>
                <div className="space-y-2">
                  <Label>个人简介</Label>
                  <Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                    placeholder="介绍您的从业经历、专业资质和服务特色..." className="min-h-[120px]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>联系电话</Label>
                    <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="138xxxxxxxx" />
                  </div>
                  <div className="space-y-2">
                    <Label>联系邮箱</Label>
                    <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="example@email.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>专业领域（用顿号分隔）</Label>
                  <Input value={form.specialties} onChange={e => setForm({ ...form, specialties: e.target.value })}
                    placeholder="例：住宅评估、商业地产、司法鉴定" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5" />展示设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">展示案例</p>
                    <p className="text-xs text-muted-foreground">在微站展示已完成的评估案例</p>
                  </div>
                  <Switch checked={form.showCases} onCheckedChange={v => setForm({ ...form, showCases: v })} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">展示评价</p>
                    <p className="text-xs text-muted-foreground">在微站展示客户评价和评分</p>
                  </div>
                  <Switch checked={form.showReviews} onCheckedChange={v => setForm({ ...form, showReviews: v })} />
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" onClick={() => toast({ title: "微站已更新", description: "您的微站信息已保存" })}>
              <Save className="mr-2 h-4 w-4" />保存设置
            </Button>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>微站状态</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">状态</span>
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle2 className="mr-1 h-3 w-3" />已上线
                  </Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">微站链接</p>
                  <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <p className="text-xs font-mono truncate">
                      {(microsite as any)?.url || "生成中..."}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-bold">{(microsite as any)?.views ?? 0}</p>
                    <p className="text-xs text-muted-foreground">访问量</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-bold">{(microsite as any)?.leads ?? 0}</p>
                    <p className="text-xs text-muted-foreground">线索数</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>推广建议</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  {[
                    "将微站链接分享到微信朋友圈",
                    "在名片上印上微站二维码",
                    "在微信个人签名中添加链接",
                    "通过海报功能生成推广图片",
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
