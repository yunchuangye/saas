"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Plus,
  FileText,
  Edit2,
  Trash2,
  Loader2,
  BookOpen,
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

const CATEGORY_LABELS: Record<string, string> = {
  field_survey: "现场勘察记录",
  comparable_analysis: "可比案例分析",
  valuation_calc: "估价计算过程",
  compliance_check: "合规性检查",
  other: "其他",
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  draft:     { label: "草稿",   variant: "secondary" },
  submitted: { label: "已提交", variant: "default" },
  approved:  { label: "已审批", variant: "outline" },
}

export default function WorkSheetsPage() {
  const { toast } = useToast()
  const [createDialog, setCreateDialog] = useState(false)
  const [editDialog, setEditDialog] = useState<{ open: boolean; sheet: any | null }>({ open: false, sheet: null })
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [form, setForm] = useState({
    reportId: "",
    projectId: "",
    title: "",
    category: "other" as keyof typeof CATEGORY_LABELS,
    content: "",
  })

  const { data: sheets, isLoading, refetch } = trpc.workSheets.list.useQuery({})

  const createMutation = trpc.workSheets.create.useMutation({
    onSuccess: () => {
      toast({ title: "创建成功", description: "工作底稿已保存" })
      setCreateDialog(false)
      setForm({ reportId: "", projectId: "", title: "", category: "other", content: "" })
      refetch()
    },
    onError: (err: any) => toast({ title: "创建失败", description: err.message, variant: "destructive" }),
  })

  const updateMutation = trpc.workSheets.update.useMutation({
    onSuccess: () => {
      toast({ title: "更新成功" })
      setEditDialog({ open: false, sheet: null })
      refetch()
    },
    onError: (err: any) => toast({ title: "更新失败", description: err.message, variant: "destructive" }),
  })

  const deleteMutation = trpc.workSheets.delete.useMutation({
    onSuccess: () => {
      toast({ title: "已删除" })
      setDeleteId(null)
      refetch()
    },
    onError: (err: any) => toast({ title: "删除失败", description: err.message, variant: "destructive" }),
  })

  const handleCreate = () => {
    if (!form.title.trim()) { toast({ title: "请填写底稿标题", variant: "destructive" }); return }
    if (!form.reportId || !form.projectId) { toast({ title: "请填写关联报告ID和项目ID", variant: "destructive" }); return }
    createMutation.mutate({
      reportId: parseInt(form.reportId),
      projectId: parseInt(form.projectId),
      title: form.title,
      category: form.category as any,
      content: form.content || undefined,
    })
  }

  const handleUpdate = () => {
    if (!editDialog.sheet) return
    updateMutation.mutate({
      id: editDialog.sheet.id,
      title: editDialog.sheet.title,
      category: editDialog.sheet.category,
      content: editDialog.sheet.content,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">工作底稿</h1>
          <p className="text-muted-foreground">管理评估过程中的工作底稿，支持现场勘察、可比案例分析等分类</p>
        </div>
        <Button onClick={() => setCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新建底稿
        </Button>
      </div>

      {/* 分类说明 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <Card key={key} className="border-0 bg-muted/30">
            <CardContent className="pt-3 pb-2 text-center">
              <BookOpen className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs font-medium">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 底稿列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            我的工作底稿
            {sheets && sheets.length > 0 && <Badge variant="secondary">{sheets.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !sheets || sheets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-30" />
              <p>暂无工作底稿，点击"新建底稿"创建</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>底稿标题</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>关联报告</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sheets.map((s: any) => {
                  const si = STATUS_MAP[s.status] ?? { label: s.status, variant: "secondary" as const }
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{s.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[s.category] ?? s.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        报告 #{s.report_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant={si.variant} className="text-xs">{si.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString("zh-CN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditDialog({ open: true, sheet: { ...s } })}
                            disabled={s.status === "approved"}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => setDeleteId(s.id)}
                            disabled={s.status === "approved"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 新建底稿弹窗 */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建工作底稿</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>关联报告 ID</Label>
                <Input
                  type="number"
                  placeholder="报告 ID"
                  value={form.reportId}
                  onChange={e => setForm({ ...form, reportId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>关联项目 ID</Label>
                <Input
                  type="number"
                  placeholder="项目 ID"
                  value={form.projectId}
                  onChange={e => setForm({ ...form, projectId: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>底稿标题</Label>
              <Input
                placeholder="请输入工作底稿标题"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>分类</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>底稿内容</Label>
              <Textarea
                placeholder="请输入工作底稿内容..."
                rows={6}
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              保存底稿
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑底稿弹窗 */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑工作底稿</DialogTitle>
          </DialogHeader>
          {editDialog.sheet && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>底稿标题</Label>
                <Input
                  value={editDialog.sheet.title}
                  onChange={e => setEditDialog({ ...editDialog, sheet: { ...editDialog.sheet, title: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label>分类</Label>
                <Select
                  value={editDialog.sheet.category}
                  onValueChange={v => setEditDialog({ ...editDialog, sheet: { ...editDialog.sheet, category: v } })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>底稿内容</Label>
                <Textarea
                  rows={6}
                  value={editDialog.sheet.content || ""}
                  onChange={e => setEditDialog({ ...editDialog, sheet: { ...editDialog.sheet, content: e.target.value } })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, sheet: null })}>取消</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">删除后无法恢复，确认删除此工作底稿吗？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>取消</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
