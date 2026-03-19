"use client"
import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Megaphone, Plus, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

const TYPE_MAP: Record<string, { label: string; color: string }> = {
  notice: { label: "通知", color: "bg-blue-500/20 text-blue-400" },
  maintenance: { label: "维护", color: "bg-yellow-500/20 text-yellow-400" },
  feature: { label: "新功能", color: "bg-green-500/20 text-green-400" },
  urgent: { label: "紧急", color: "bg-red-500/20 text-red-400" },
}

export default function PlatformAdminAnnouncementsPage() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: "", content: "", type: "notice", targetRole: "all",
    publishAt: "", expiresAt: "",
  })

  const { data, isLoading, refetch } = trpc.platformAdmin.listAnnouncements.useQuery({ page: 1, pageSize: 20 })

  const createMutation = trpc.platformAdmin.createAnnouncement.useMutation({
    onSuccess: () => { toast.success("公告发布成功"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  })

  const toggleMutation = trpc.platformAdmin.toggleAnnouncement.useMutation({
    onSuccess: () => { toast.success("状态已更新"); refetch(); },
    onError: (e) => toast.error(e.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">公告运营</h1>
          <p className="text-gray-400 text-sm mt-1">向全平台租户或特定角色发布公告通知</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1" />发布公告
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg">
            <DialogHeader><DialogTitle>发布平台公告</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-gray-300">公告标题 *</Label>
                <Input className="mt-1 bg-gray-800 border-gray-700 text-white" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <Label className="text-gray-300">公告内容 *</Label>
                <Textarea className="mt-1 bg-gray-800 border-gray-700 text-white" rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300">公告类型</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger className="mt-1 bg-gray-800 border-gray-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="notice">通知</SelectItem>
                      <SelectItem value="maintenance">系统维护</SelectItem>
                      <SelectItem value="feature">新功能上线</SelectItem>
                      <SelectItem value="urgent">紧急通知</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">目标角色</Label>
                  <Select value={form.targetRole} onValueChange={v => setForm(f => ({ ...f, targetRole: v }))}>
                    <SelectTrigger className="mt-1 bg-gray-800 border-gray-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all">全部用户</SelectItem>
                      <SelectItem value="appraiser">评估师</SelectItem>
                      <SelectItem value="bank">银行机构</SelectItem>
                      <SelectItem value="investor">投资机构</SelectItem>
                      <SelectItem value="broker">经纪机构</SelectItem>
                      <SelectItem value="customer">个人客户</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300">发布时间（空=立即）</Label>
                  <Input className="mt-1 bg-gray-800 border-gray-700 text-white" type="datetime-local" value={form.publishAt} onChange={e => setForm(f => ({ ...f, publishAt: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-gray-300">过期时间（空=永久）</Label>
                  <Input className="mt-1 bg-gray-800 border-gray-700 text-white" type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
                </div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => createMutation.mutate({
                title: form.title, content: form.content, type: form.type as any,
                targetRole: form.targetRole as any,
                publishAt: form.publishAt || undefined,
                expiresAt: form.expiresAt || undefined,
              })} disabled={createMutation.isPending}>
                {createMutation.isPending ? "发布中..." : "确认发布"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 公告列表 */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>
      ) : (
        <div className="space-y-3">
          {(data?.items as any[])?.map((ann: any) => (
            <Card key={ann.id} className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Megaphone className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{ann.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_MAP[ann.type]?.color}`}>
                          {TYPE_MAP[ann.type]?.label}
                        </span>
                        {!ann.is_active && <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full">已隐藏</span>}
                      </div>
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{ann.content}</p>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        <span>目标：{ann.target_role === "all" ? "全部用户" : ann.target_role}</span>
                        {ann.publish_at && <span>发布：{new Date(ann.publish_at).toLocaleDateString("zh-CN")}</span>}
                        {ann.expires_at && <span>到期：{new Date(ann.expires_at).toLocaleDateString("zh-CN")}</span>}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="border-gray-700 text-gray-300" onClick={() => toggleMutation.mutate({ id: ann.id, isActive: !ann.is_active })}>
                    {ann.is_active ? <><EyeOff className="w-3 h-3 mr-1" />隐藏</> : <><Eye className="w-3 h-3 mr-1" />显示</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!data?.items || data.items.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无公告，点击"发布公告"开始</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
