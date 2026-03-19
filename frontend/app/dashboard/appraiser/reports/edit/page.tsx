"use client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FileEdit, Save, Send, Bot, Loader2, CheckCircle2, AlertCircle,
  ArrowLeft, Plus, FolderOpen, TrendingUp, FileText, Clock
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "secondary" },
  submitted: { label: "已提交", color: "default" },
  reviewing: { label: "审核中", color: "default" },
  approved: { label: "已通过", color: "default" },
  rejected: { label: "已驳回", color: "destructive" },
  archived: { label: "已归档", color: "secondary" },
}

function EditorView({ reportId, onBack }: { reportId: number | null; onBack: () => void }) {
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState({
    title: "", content: "", valuationResult: "", valuationMin: "", valuationMax: "",
    propertyAddress: "", propertyType: "", propertyArea: "", projectId: "",
  })
  const [initialized, setInitialized] = useState(false)
  const [aiResult, setAiResult] = useState<{ score: number; issues: string[]; suggestions: string } | null>(null)

  const { data: activeProjectsData } = trpc.projects.listActive.useQuery(
    { page: 1, pageSize: 50 }, { enabled: !reportId }
  )
  const activeProjects = (activeProjectsData as any)?.items ?? []

  const { data: reportDetail, isLoading: detailLoading } = trpc.reports.get.useQuery(
    { id: reportId! }, { enabled: !!reportId }
  )

  useEffect(() => {
    if (reportDetail && !initialized) {
      setForm({
        title: reportDetail.title || "",
        content: reportDetail.content || "",
        valuationResult: reportDetail.valuationResult ? String(reportDetail.valuationResult) : "",
        valuationMin: reportDetail.valuationMin ? String(reportDetail.valuationMin) : "",
        valuationMax: reportDetail.valuationMax ? String(reportDetail.valuationMax) : "",
        propertyAddress: (reportDetail as any).propertyAddress || "",
        propertyType: (reportDetail as any).propertyType || "",
        propertyArea: (reportDetail as any).propertyArea ? String((reportDetail as any).propertyArea) : "",
        projectId: String(reportDetail.projectId),
      })
      if (reportDetail.aiReviewResult) {
        try { setAiResult(JSON.parse(reportDetail.aiReviewResult)) } catch {}
      }
      setInitialized(true)
    }
  }, [reportDetail, initialized])

  const createMutation = trpc.reports.create.useMutation({
    onSuccess: (data) => {
      toast({ title: "报告已创建", description: "草稿已保存，可继续编辑" })
      router.push(`/dashboard/appraiser/reports/edit?id=${data.id}`)
    },
    onError: (err) => toast({ title: "创建失败", description: err.message, variant: "destructive" }),
  })

  const updateMutation = trpc.reports.update.useMutation({
    onSuccess: () => toast({ title: "已保存", description: "报告草稿已更新" }),
    onError: (err) => toast({ title: "保存失败", description: err.message, variant: "destructive" }),
  })

  const submitMutation = trpc.reports.submit.useMutation({
    onSuccess: () => {
      toast({ title: "已提交审核", description: "报告已进入审核队列" })
      router.push("/dashboard/appraiser/reports/review")
    },
    onError: (err) => toast({ title: "提交失败", description: err.message, variant: "destructive" }),
  })

  const aiMutation = trpc.reports.aiAssist.useMutation({
    onSuccess: (data) => {
      setAiResult(data)
      toast({ title: "AI 分析完成", description: `质量评分：${data.score} 分` })
    },
    onError: (err) => toast({ title: "AI 分析失败", description: err.message, variant: "destructive" }),
  })

  const handleSave = () => {
    if (!form.title.trim()) { toast({ title: "请填写报告标题", variant: "destructive" }); return }
    if (reportId) {
      updateMutation.mutate({
        id: reportId, title: form.title, content: form.content,
        valuationResult: form.valuationResult ? Number(form.valuationResult) : undefined,
        valuationMin: form.valuationMin ? Number(form.valuationMin) : undefined,
        valuationMax: form.valuationMax ? Number(form.valuationMax) : undefined,
      })
    } else {
      if (!form.projectId) { toast({ title: "请选择关联项目", variant: "destructive" }); return }
      createMutation.mutate({
        projectId: Number(form.projectId), title: form.title, content: form.content,
        valuationResult: form.valuationResult ? Number(form.valuationResult) : undefined,
        valuationMin: form.valuationMin ? Number(form.valuationMin) : undefined,
        valuationMax: form.valuationMax ? Number(form.valuationMax) : undefined,
      })
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isEditable = !reportDetail || reportDetail.status === "draft" || reportDetail.status === "rejected"

  if (reportId && detailLoading) {
    return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-1 h-4 w-4" />返回列表
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div>
            <h1 className="text-xl font-bold">{reportId ? "编辑报告" : "新建报告"}</h1>
            {reportDetail && <p className="text-xs text-muted-foreground font-mono">{reportDetail.reportNo}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {reportDetail && (
            <Badge variant={statusMap[reportDetail.status]?.color as any || "secondary"}>
              {statusMap[reportDetail.status]?.label}
            </Badge>
          )}
          {isEditable && (
            <>
              <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? "保存中..." : "保存草稿"}
              </Button>
              {reportId && (
                <Button onClick={() => submitMutation.mutate({ id: reportId })} disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  {submitMutation.isPending ? "提交中..." : "提交审核"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />基本信息</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {!reportId && (
                <div className="space-y-2">
                  <Label>关联项目 <span className="text-destructive">*</span></Label>
                  <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                    <SelectTrigger><SelectValue placeholder="请选择关联的评估项目" /></SelectTrigger>
                    <SelectContent>
                      {activeProjects.map((p: any) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.title}（{p.projectNo}）</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>报告标题 <span className="text-destructive">*</span></Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="例：深圳市南山区XX楼盘X栋X号房产价值评估报告" disabled={!isEditable} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>物业类型</Label>
                  <Select value={form.propertyType} onValueChange={(v) => setForm({ ...form, propertyType: v })} disabled={!isEditable}>
                    <SelectTrigger><SelectValue placeholder="请选择物业类型" /></SelectTrigger>
                    <SelectContent>
                      {["住宅","商业","工业","办公","其他"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>建筑面积（㎡）</Label>
                  <Input type="number" value={form.propertyArea}
                    onChange={(e) => setForm({ ...form, propertyArea: e.target.value })}
                    placeholder="例：89.5" disabled={!isEditable} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>物业地址</Label>
                <Input value={form.propertyAddress}
                  onChange={(e) => setForm({ ...form, propertyAddress: e.target.value })}
                  placeholder="例：深圳市南山区科技园XX路XX号" disabled={!isEditable} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>报告正文</CardTitle>
              <CardDescription>详细描述评估依据、方法和结论</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder={`请填写报告正文内容，建议包含以下章节：\n\n一、估价目的\n二、估价对象描述\n三、价值时点\n四、估价依据\n五、估价原则\n六、估价方法\n  1. 市场比较法\n  2. 收益法（如适用）\n  3. 成本法（如适用）\n七、估价结果\n八、估价师声明\n九、附件清单`}
                className="min-h-[400px] font-mono text-sm" disabled={!isEditable} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />估价结果</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>评估价值（元）<span className="text-destructive">*</span></Label>
                <Input type="number" value={form.valuationResult}
                  onChange={(e) => setForm({ ...form, valuationResult: e.target.value })}
                  placeholder="例：3500000" disabled={!isEditable} />
                {form.valuationResult && (
                  <p className="text-xs text-muted-foreground">≈ ¥{Number(form.valuationResult).toLocaleString()} 元</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>价值下限</Label>
                  <Input type="number" value={form.valuationMin}
                    onChange={(e) => setForm({ ...form, valuationMin: e.target.value })}
                    placeholder="例：3300000" disabled={!isEditable} />
                </div>
                <div className="space-y-2">
                  <Label>价值上限</Label>
                  <Input type="number" value={form.valuationMax}
                    onChange={(e) => setForm({ ...form, valuationMax: e.target.value })}
                    placeholder="例：3700000" disabled={!isEditable} />
                </div>
              </div>
              {form.valuationResult && form.propertyArea && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="text-muted-foreground">单价参考</p>
                  <p className="text-lg font-bold">
                    ¥{Math.round(Number(form.valuationResult) / Number(form.propertyArea)).toLocaleString()}/㎡
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {reportId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />AI 质量检查</CardTitle>
                <CardDescription>AI 自动分析报告质量并给出建议</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full" onClick={() => aiMutation.mutate({ reportId })} disabled={aiMutation.isPending}>
                  {aiMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />AI 分析中...</> : <><Bot className="mr-2 h-4 w-4" />运行 AI 质量检查</>}
                </Button>
                {aiResult && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">质量评分</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${aiResult.score >= 90 ? "bg-green-500" : aiResult.score >= 75 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${aiResult.score}%` }} />
                        </div>
                        <span className={`text-lg font-bold ${aiResult.score >= 90 ? "text-green-600" : aiResult.score >= 75 ? "text-yellow-600" : "text-red-600"}`}>{aiResult.score}</span>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">检查项目</p>
                      {aiResult.issues.map((issue, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" /><span>{issue}</span>
                        </div>
                      ))}
                    </div>
                    {aiResult.suggestions && (
                      <Alert><AlertCircle className="h-4 w-4" /><AlertDescription className="text-xs">{aiResult.suggestions}</AlertDescription></Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {isEditable && reportId && (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">提交审核前请确认：</p>
                  {[
                    { done: !!form.title, label: "报告标题已填写" },
                    { done: !!form.valuationResult, label: "估价结果已填写" },
                    { done: form.content.length > 100, label: "报告正文已完善" },
                    { done: !!aiResult, label: "AI 质量检查已通过" },
                  ].map(({ done, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${done ? "bg-green-500" : "bg-muted"}`} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AppraiserReportsEditPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reportId = searchParams.get("id") ? Number(searchParams.get("id")) : null
  const { toast } = useToast()
  const [view, setView] = useState<"list" | "editor">(reportId ? "editor" : "list")
  const [editingId, setEditingId] = useState<number | null>(reportId)

  const { data, isLoading, refetch } = trpc.reports.list.useQuery(
    { page: 1, pageSize: 20, status: "draft" }, { enabled: view === "list" }
  )
  const reports = data?.items ?? []

  if (view === "editor") {
    return <EditorView reportId={editingId} onBack={() => { setView("list"); setEditingId(null); refetch() }} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">报告编制</h1>
          <p className="text-muted-foreground">编辑和管理评估报告草稿</p>
        </div>
        <Button onClick={() => { setEditingId(null); setView("editor") }}>
          <Plus className="mr-2 h-4 w-4" />新建报告
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-40 w-full" />)}</div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FileEdit className="h-14 w-14 mb-4 opacity-30" />
            <p className="text-lg font-medium mb-1">暂无草稿报告</p>
            <p className="text-sm mb-4">点击"新建报告"开始编制评估报告</p>
            <Button onClick={() => { setEditingId(null); setView("editor") }}><Plus className="mr-2 h-4 w-4" />新建报告</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report: any) => (
            <Card key={report.id} className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => { setEditingId(report.id); setView("editor") }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription className="font-mono text-xs">{report.reportNo}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.aiScore && <Badge variant="outline" className="text-xs"><Bot className="mr-1 h-3 w-3" />AI {report.aiScore}分</Badge>}
                    <Badge variant="secondary">草稿</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><FolderOpen className="h-3.5 w-3.5" />项目 #{report.projectId}</span>
                  {report.valuationResult && (
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <TrendingUp className="h-3.5 w-3.5" />¥{Number(report.valuationResult).toLocaleString()}
                    </span>
                  )}
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(report.updatedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
