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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Newspaper, Plus, Search, MoreHorizontal, Pencil, Trash2,
  Pin, Eye, Globe, FileText, Archive, Calendar, Tag, BookOpen
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  industry: { label: "行业资讯", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  policy: { label: "政策法规", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  company: { label: "公司动态", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "草稿", variant: "secondary" },
  published: { label: "已发布", variant: "default" },
  archived: { label: "已归档", variant: "outline" },
}

const emptyForm = {
  title: "",
  summary: "",
  content: "",
  coverImage: "",
  category: "industry" as "industry" | "policy" | "company",
  status: "draft" as "draft" | "published" | "archived",
  isPinned: false,
}

export default function NewsPage() {
  const { toast } = useToast()
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  // 详情弹窗状态
  const [viewItem, setViewItem] = useState<any>(null)
  const [viewOpen, setViewOpen] = useState(false)

  const { data, isLoading, refetch } = trpc.news.list.useQuery({
    page,
    pageSize: 20,
    keyword: keyword || undefined,
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
  })

  const createMutation = trpc.news.create.useMutation({
    onSuccess: () => {
      toast({ title: "新闻已创建" })
      setDialogOpen(false)
      setForm({ ...emptyForm })
      refetch()
    },
    onError: (err) => toast({ title: "创建失败", description: err.message, variant: "destructive" }),
  })

  const updateMutation = trpc.news.update.useMutation({
    onSuccess: () => {
      toast({ title: "新闻已更新" })
      setDialogOpen(false)
      setEditItem(null)
      refetch()
    },
    onError: (err) => toast({ title: "更新失败", description: err.message, variant: "destructive" }),
  })

  const deleteMutation = trpc.news.delete.useMutation({
    onSuccess: () => {
      toast({ title: "新闻已删除" })
      setDeleteId(null)
      refetch()
    },
    onError: (err) => toast({ title: "删除失败", description: err.message, variant: "destructive" }),
  })

  const togglePinMutation = trpc.news.togglePin.useMutation({
    onSuccess: () => { toast({ title: "置顶状态已更新" }); refetch() },
    onError: (err) => toast({ title: "操作失败", description: err.message, variant: "destructive" }),
  })

  const handleOpenCreate = () => {
    setEditItem(null)
    setForm({ ...emptyForm })
    setDialogOpen(true)
  }

  const handleOpenEdit = (item: any) => {
    setEditItem(item)
    setForm({
      title: item.title,
      summary: item.summary || "",
      content: item.content || "",
      coverImage: item.coverImage || "",
      category: item.category || "industry",
      status: item.status || "draft",
      isPinned: item.isPinned || false,
    })
    setDialogOpen(true)
  }

  const handleOpenView = (item: any) => {
    setViewItem(item)
    setViewOpen(true)
  }

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast({ title: "请填写新闻标题", variant: "destructive" })
      return
    }
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, ...form })
    } else {
      createMutation.mutate(form)
    }
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
            <Newspaper className="h-6 w-6" />
            新闻管理
          </h1>
          <p className="text-sm text-muted-foreground mt-1">管理平台新闻资讯内容</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          新建新闻
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "全部新闻", value: total, icon: FileText, color: "text-blue-600" },
          { label: "已发布", value: items.filter((i) => i.status === "published").length, icon: Globe, color: "text-green-600" },
          { label: "草稿", value: items.filter((i) => i.status === "draft").length, icon: Archive, color: "text-yellow-600" },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-muted p-2 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索标题或摘要..."
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="published">已发布</SelectItem>
                <SelectItem value="archived">已归档</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter || "all"} onValueChange={(v) => { setCategoryFilter(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                <SelectItem value="industry">行业资讯</SelectItem>
                <SelectItem value="policy">政策法规</SelectItem>
                <SelectItem value="company">公司动态</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 新闻列表 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">标题</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>浏览量</TableHead>
                <TableHead>创建时间</TableHead>
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
                    暂无新闻，点击右上角「新建新闻」创建第一篇
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell>
                      {/* 点击标题区域打开详情 */}
                      <div
                        className="flex items-start gap-2 cursor-pointer group"
                        onClick={() => handleOpenView(item)}
                      >
                        {item.isPinned && (
                          <Pin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-orange-500" />
                        )}
                        <div>
                          <p className="font-medium line-clamp-1 group-hover:text-primary group-hover:underline transition-colors">
                            {item.title}
                          </p>
                          {item.summary && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.summary}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_MAP[item.category ?? "industry"]?.color}`}>
                        {CATEGORY_MAP[item.category ?? "industry"]?.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_MAP[item.status ?? "draft"]?.variant}>
                        {STATUS_MAP[item.status ?? "draft"]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Eye className="h-3.5 w-3.5" />
                        {item.viewCount ?? 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.createdAt ? format(new Date(item.createdAt), "MM-dd HH:mm", { locale: zhCN }) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenView(item)}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenEdit(item)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => togglePinMutation.mutate({ id: item.id, isPinned: !item.isPinned })}>
                            <Pin className="mr-2 h-4 w-4" />
                            {item.isPinned ? "取消置顶" : "置顶"}
                          </DropdownMenuItem>
                          {item.status !== "published" && (
                            <DropdownMenuItem onClick={() => updateMutation.mutate({ id: item.id, status: "published" })}>
                              <Globe className="mr-2 h-4 w-4" />
                              发布
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteId(item.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
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

      {/* ===== 详情查看弹窗 ===== */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewItem && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3 pr-6">
                  {viewItem.isPinned && (
                    <Pin className="h-4 w-4 mt-1 shrink-0 text-orange-500" />
                  )}
                  <DialogTitle className="text-xl leading-tight">{viewItem.title}</DialogTitle>
                </div>
                {/* 元信息行 */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_MAP[viewItem.category ?? "industry"]?.color}`}>
                    <Tag className="mr-1 h-3 w-3" />
                    {CATEGORY_MAP[viewItem.category ?? "industry"]?.label}
                  </span>
                  <Badge variant={STATUS_MAP[viewItem.status ?? "draft"]?.variant}>
                    {STATUS_MAP[viewItem.status ?? "draft"]?.label}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    {viewItem.viewCount ?? 0} 次浏览
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {viewItem.createdAt ? format(new Date(viewItem.createdAt), "yyyy年MM月dd日 HH:mm", { locale: zhCN }) : "-"}
                  </span>
                </div>
              </DialogHeader>

              <Separator />

              {/* 封面图片 */}
              {viewItem.coverImage && (
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={viewItem.coverImage}
                    alt={viewItem.title}
                    className="w-full max-h-64 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                  />
                </div>
              )}

              {/* 摘要 */}
              {viewItem.summary && (
                <div className="rounded-lg bg-muted/50 border-l-4 border-primary/40 px-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground mb-1">摘要</p>
                  <p className="text-sm leading-relaxed">{viewItem.summary}</p>
                </div>
              )}

              {/* 正文内容 */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">正文内容</p>
                {viewItem.content ? (
                  <div className="rounded-lg border bg-card p-4 text-sm leading-relaxed whitespace-pre-wrap min-h-[100px]">
                    {viewItem.content}
                  </div>
                ) : (
                  <div className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                    暂无正文内容
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setViewOpen(false)}>关闭</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewOpen(false)
                    handleOpenEdit(viewItem)
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  编辑此新闻
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== 创建/编辑弹窗 ===== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "编辑新闻" : "新建新闻"}</DialogTitle>
            <DialogDescription>填写新闻内容，发布后将展示在平台前台</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>标题 <span className="text-destructive">*</span></Label>
              <Input
                placeholder="请输入新闻标题"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>分类</Label>
                <Select value={form.category} onValueChange={(v: any) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="industry">行业资讯</SelectItem>
                    <SelectItem value="policy">政策法规</SelectItem>
                    <SelectItem value="company">公司动态</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>状态</Label>
                <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="published">立即发布</SelectItem>
                    <SelectItem value="archived">归档</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>摘要</Label>
              <Textarea
                placeholder="请输入新闻摘要（可选，用于列表展示）"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>正文内容</Label>
              <Textarea
                placeholder="请输入新闻正文内容"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>封面图片 URL</Label>
              <Input
                placeholder="https://example.com/image.jpg（可选）"
                value={form.coverImage}
                onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editItem ? "保存修改" : "创建新闻"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== 删除确认弹窗 ===== */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>此操作不可撤销，新闻将被永久删除。</AlertDialogDescription>
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
