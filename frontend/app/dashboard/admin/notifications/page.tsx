"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  BellRing,
  Plus,
  Search,
  Trash2,
  Users,
  Globe,
  Info,
  AlertCircle,
  CheckCircle2,
  Bell,
  CheckCheck,
  Calendar,
  User,
  BookOpen,
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"

const TYPE_MAP: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  system: { label: "系统通知", icon: Bell, color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-800" },
  project: { label: "项目通知", icon: Info, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
  report: { label: "报告通知", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" },
  warning: { label: "预警通知", icon: AlertCircle, color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
}

const emptyForm = {
  target: "all" as "all" | "specific",
  userIds: [] as number[],
  title: "",
  content: "",
  type: "system" as "system" | "project" | "report" | "warning",
}

export default function NotificationsPage() {
  const { toast } = useToast()
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [userIdsInput, setUserIdsInput] = useState("")
  // 详情弹窗状态
  const [viewItem, setViewItem] = useState<any>(null)
  const [viewOpen, setViewOpen] = useState(false)

  const { data, isLoading, refetch } = trpc.notifications.adminList.useQuery({
    page,
    pageSize: 20,
    keyword: keyword || undefined,
    type: typeFilter || undefined,
  })

  const { data: statsData } = trpc.notifications.adminStats.useQuery()

  const sendMutation = trpc.notifications.adminSend.useMutation({
    onSuccess: (res) => {
      toast({ title: `通知已发送`, description: `成功发送给 ${res.sentCount} 位用户` })
      setSendDialogOpen(false)
      setForm({ ...emptyForm })
      setUserIdsInput("")
      refetch()
    },
    onError: (err) => toast({ title: "发送失败", description: err.message, variant: "destructive" }),
  })

  const deleteMutation = trpc.notifications.adminDelete.useMutation({
    onSuccess: () => {
      toast({ title: "通知已删除" })
      setDeleteId(null)
      refetch()
    },
    onError: (err) => toast({ title: "删除失败", description: err.message, variant: "destructive" }),
  })

  const handleSend = () => {
    if (!form.title.trim()) {
      toast({ title: "请填写通知标题", variant: "destructive" })
      return
    }
    const userIds =
      form.target === "specific"
        ? userIdsInput
            .split(/[,，\s]+/)
            .map((s) => parseInt(s.trim()))
            .filter((n) => !isNaN(n) && n > 0)
        : undefined

    if (form.target === "specific" && (!userIds || userIds.length === 0)) {
      toast({ title: "请填写有效的用户 ID", variant: "destructive" })
      return
    }

    sendMutation.mutate({
      target: form.target,
      userIds,
      title: form.title,
      content: form.content || undefined,
      type: form.type,
    })
  }

  const handleOpenView = (item: any) => {
    setViewItem(item)
    setViewOpen(true)
  }

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BellRing className="h-6 w-6" />
            通知管理
          </h1>
          <p className="text-sm text-muted-foreground mt-1">向用户发送系统通知，管理通知记录</p>
        </div>
        <Button onClick={() => setSendDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          发送通知
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2 text-blue-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statsData?.total ?? 0}</p>
              <p className="text-xs text-muted-foreground">全部通知</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2 text-orange-500">
              <CheckCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{statsData?.unread ?? 0}</p>
              <p className="text-xs text-muted-foreground">未读通知</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索通知标题或内容..."
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter || "all"} onValueChange={(v) => { setTypeFilter(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="通知类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="system">系统通知</SelectItem>
                <SelectItem value="project">项目通知</SelectItem>
                <SelectItem value="report">报告通知</SelectItem>
                <SelectItem value="warning">预警通知</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 通知列表 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35%]">标题</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>接收用户</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>发送时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    暂无通知记录，点击右上角「发送通知」向用户推送通知
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const typeInfo = TYPE_MAP[item.type ?? "system"]
                  const TypeIcon = typeInfo?.icon ?? Bell
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell>
                        {/* 点击标题区域打开详情 */}
                        <div
                          className="cursor-pointer group"
                          onClick={() => handleOpenView(item)}
                        >
                          <p className="font-medium line-clamp-1 group-hover:text-primary group-hover:underline transition-colors">
                            {item.title}
                          </p>
                          {item.content && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.content}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={cn("flex items-center gap-1.5 text-sm", typeInfo?.color)}>
                          <TypeIcon className="h-4 w-4" />
                          <span>{typeInfo?.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        用户 #{item.userId}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.isRead ? "secondary" : "default"}>
                          {item.isRead ? "已读" : "未读"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.createdAt ? format(new Date(item.createdAt), "MM-dd HH:mm", { locale: zhCN }) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="查看详情"
                            onClick={() => handleOpenView(item)}
                          >
                            <BookOpen className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="删除"
                            onClick={() => setDeleteId(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">共 {total} 条记录</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
            </div>
          </div>
        )}
      </Card>

      {/* ===== 通知详情弹窗 ===== */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          {viewItem && (() => {
            const typeInfo = TYPE_MAP[viewItem.type ?? "system"]
            const TypeIcon = typeInfo?.icon ?? Bell
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", typeInfo?.bg)}>
                      <TypeIcon className={cn("h-5 w-5", typeInfo?.color)} />
                    </div>
                    <div>
                      <DialogTitle className="text-lg leading-tight">{viewItem.title}</DialogTitle>
                      <p className={cn("text-xs font-medium mt-0.5", typeInfo?.color)}>{typeInfo?.label}</p>
                    </div>
                  </div>
                </DialogHeader>

                <Separator />

                {/* 通知内容 */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">通知内容</p>
                  {viewItem.content ? (
                    <div className="rounded-lg border bg-card p-4 text-sm leading-relaxed whitespace-pre-wrap min-h-[80px]">
                      {viewItem.content}
                    </div>
                  ) : (
                    <div className="rounded-lg border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                      暂无详细内容
                    </div>
                  )}
                </div>

                {/* 元信息 */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4 shrink-0" />
                    <span>接收用户：用户 #{viewItem.userId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCheck className="h-4 w-4 shrink-0" />
                    <span>
                      状态：
                      <Badge variant={viewItem.isRead ? "secondary" : "default"} className="ml-1 text-xs">
                        {viewItem.isRead ? "已读" : "未读"}
                      </Badge>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>
                      发送时间：{viewItem.createdAt
                        ? format(new Date(viewItem.createdAt), "yyyy年MM月dd日 HH:mm:ss", { locale: zhCN })
                        : "-"}
                    </span>
                  </div>
                  {viewItem.readAt && (
                    <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                      <span>
                        阅读时间：{format(new Date(viewItem.readAt), "yyyy年MM月dd日 HH:mm:ss", { locale: zhCN })}
                      </span>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setViewOpen(false)}>关闭</Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setViewOpen(false)
                      setDeleteId(viewItem.id)
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除此通知
                  </Button>
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== 发送通知弹窗 ===== */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              发送系统通知
            </DialogTitle>
            <DialogDescription>向指定用户或全体用户推送系统通知</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* 发送对象 */}
            <div className="space-y-2">
              <Label>发送对象</Label>
              <RadioGroup
                value={form.target}
                onValueChange={(v: any) => setForm({ ...form, target: v })}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="all" id="target-all" />
                  <Label htmlFor="target-all" className="flex items-center gap-1.5 cursor-pointer font-normal">
                    <Globe className="h-4 w-4 text-blue-500" />
                    全体用户
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="specific" id="target-specific" />
                  <Label htmlFor="target-specific" className="flex items-center gap-1.5 cursor-pointer font-normal">
                    <Users className="h-4 w-4 text-purple-500" />
                    指定用户
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 指定用户 ID */}
            {form.target === "specific" && (
              <div className="space-y-1.5">
                <Label>用户 ID <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="输入用户 ID，多个用逗号分隔，如：1, 2, 3"
                  value={userIdsInput}
                  onChange={(e) => setUserIdsInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">可在用户管理页面查看用户 ID</p>
              </div>
            )}

            {/* 通知类型 */}
            <div className="space-y-1.5">
              <Label>通知类型</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">🔔 系统通知</SelectItem>
                  <SelectItem value="project">📋 项目通知</SelectItem>
                  <SelectItem value="report">✅ 报告通知</SelectItem>
                  <SelectItem value="warning">⚠️ 预警通知</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 标题 */}
            <div className="space-y-1.5">
              <Label>通知标题 <span className="text-destructive">*</span></Label>
              <Input
                placeholder="请输入通知标题"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            {/* 内容 */}
            <div className="space-y-1.5">
              <Label>通知内容</Label>
              <Textarea
                placeholder="请输入通知详细内容（可选）"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={3}
              />
            </div>

            {/* 预览 */}
            {form.title && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                <p className="text-xs text-muted-foreground font-medium">预览效果</p>
                <div className="flex gap-2.5 pt-1">
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", TYPE_MAP[form.type]?.bg)}>
                    {(() => {
                      const TypeIcon = TYPE_MAP[form.type]?.icon ?? Bell
                      return <TypeIcon className={cn("h-4 w-4", TYPE_MAP[form.type]?.color)} />
                    })()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{form.title}</p>
                    {form.content && <p className="text-xs text-muted-foreground mt-0.5">{form.content}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>取消</Button>
            <Button onClick={handleSend} disabled={sendMutation.isPending} className="gap-2">
              <BellRing className="h-4 w-4" />
              {sendMutation.isPending ? "发送中..." : "立即发送"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== 删除确认弹窗 ===== */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>此操作不可撤销，通知记录将被永久删除。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
