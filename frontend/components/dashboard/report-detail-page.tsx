"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft, FileText, Download, Star, CheckCircle, XCircle,
  Building2, BarChart3, Calendar, User, Loader2, Eye
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "草稿", variant: "secondary" },
  submitted: { label: "已提交", variant: "default" },
  reviewing: { label: "审核中", variant: "default" },
  approved: { label: "已通过", variant: "default" },
  rejected: { label: "已拒绝", variant: "destructive" },
  archived: { label: "已归档", variant: "outline" },
}

interface ReportDetailPageProps {
  role: "appraiser" | "bank" | "investor" | "customer" | "admin"
}

export function ReportDetailPage({ role }: ReportDetailPageProps) {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const id = Number(params.id)

  const [reviewComment, setReviewComment] = useState("")
  const [rating, setRating] = useState(0)
  const [ratingComment, setRatingComment] = useState("")
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const { data: report, isLoading, refetch } = trpc.reports.get.useQuery({ id }, { enabled: !!id })

  const reviewMutation = trpc.reports.review.useMutation({
    onSuccess: () => { toast({ title: "审核完成" }); refetch() },
    onError: (err: any) => toast({ title: "操作失败", description: err.message, variant: "destructive" }),
  })

  const handleApprove = () => {
    reviewMutation.mutate({ id, approved: true, comment: reviewComment })
  }

  const handleReject = () => {
    if (!reviewComment.trim()) { toast({ title: "请填写拒绝原因", variant: "destructive" }); return }
    reviewMutation.mutate({ id, approved: false, comment: reviewComment })
  }

  const formatMoney = (val: any) => {
    if (!val) return "未设置"
    const num = parseFloat(String(val))
    if (num >= 10000) return `${(num / 10000).toFixed(2)} 万元`
    return `${num.toFixed(2)} 元`
  }

  const formatDate = (d: any) => {
    if (!d) return "—"
    try { return format(new Date(d), "yyyy-MM-dd HH:mm", { locale: zhCN }) } catch { return "—" }
  }

  const backPath = `/${role === "admin" ? "admin" : `dashboard/${role}`}/reports`

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>报告不存在或无权限查看</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />返回
        </Button>
      </div>
    )
  }

  const statusInfo = statusMap[report.status] || { label: report.status, variant: "secondary" as const }

  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />返回
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-xl font-bold">{report.title}</h1>
            <p className="text-sm text-muted-foreground">{report.reportNo}</p>
          </div>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* 估价结果 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />估价结果
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-primary/5 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">评估价值</p>
                  <p className="text-xl font-bold text-primary">{formatMoney(report.valuationResult)}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">最低估值</p>
                  <p className="text-lg font-semibold">{formatMoney(report.valuationMin)}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">最高估值</p>
                  <p className="text-lg font-semibold">{formatMoney(report.valuationMax)}</p>
                </div>
              </div>
              {report.finalValue && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    <strong>最终确认价值：</strong>{formatMoney(report.finalValue)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 房产信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />房产信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">物业地址</p>
                  <p className="font-medium mt-1">{report.propertyAddress || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">物业类型</p>
                  <p className="font-medium mt-1">{report.propertyType || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">建筑面积</p>
                  <p className="font-medium mt-1">{report.propertyArea ? `${report.propertyArea} ㎡` : "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 报告正文 */}
          {report.content && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />报告正文
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                  {report.content}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI 审核结果 */}
          {report.aiReviewResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-4 w-4" />AI 审核结果
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm text-muted-foreground">AI 评分：</span>
                  <span className="text-2xl font-bold text-primary">{report.aiScore ?? "—"}</span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{report.aiReviewResult}</p>
              </CardContent>
            </Card>
          )}

          {/* 附件文件 */}
          {report.files && report.files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>附件文件</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.files.map((file: any) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{file.fileName}</span>
                        {file.fileSize && (
                          <span className="text-xs text-muted-foreground">
                            ({(file.fileSize / 1024).toFixed(1)} KB)
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {file.fileUrl?.endsWith(".pdf") && (
                          <Button variant="ghost" size="sm" onClick={() => setPdfUrl(file.fileUrl)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <a href={file.fileUrl} download target="_blank" rel="noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* PDF 预览 */}
          {pdfUrl && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>PDF 预览</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setPdfUrl(null)}>关闭</Button>
                </div>
              </CardHeader>
              <CardContent>
                <iframe src={pdfUrl} className="w-full h-[600px] border rounded" title="PDF预览" />
              </CardContent>
            </Card>
          )}

          {/* 审核操作（银行/投资机构/管理员） */}
          {(role === "bank" || role === "investor" || role === "admin") &&
            report.status === "submitted" && (
            <Card>
              <CardHeader>
                <CardTitle>审核操作</CardTitle>
                <CardDescription>请仔细阅读报告内容后进行审核</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>审核意见</Label>
                  <Textarea
                    placeholder="请输入审核意见（拒绝时必填）..."
                    rows={3}
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleApprove} disabled={reviewMutation.isPending} className="flex-1">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {reviewMutation.isPending ? "处理中..." : "通过审核"}
                  </Button>
                  <Button variant="destructive" onClick={handleReject} disabled={reviewMutation.isPending} className="flex-1">
                    <XCircle className="mr-2 h-4 w-4" />拒绝
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 客户评价（报告已通过后） */}
          {role === "customer" && report.status === "approved" && !report.rating && (
            <Card>
              <CardHeader>
                <CardTitle>评价报告</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setRating(s)}
                      className={`text-2xl transition-colors ${s <= rating ? "text-yellow-400" : "text-muted-foreground"}`}>
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground self-center">{rating > 0 ? `${rating} 星` : "请评分"}</span>
                </div>
                <Textarea
                  placeholder="请输入评价内容（选填）..."
                  rows={2}
                  value={ratingComment}
                  onChange={e => setRatingComment(e.target.value)}
                />
                <Button size="sm" disabled={rating === 0}>提交评价</Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右侧信息栏 */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>报告信息</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">报告编号</span>
                <span className="font-mono">{report.reportNo || "—"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">当前状态</span>
                <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">创建时间</span>
                <span>{formatDate(report.createdAt)}</span>
              </div>
              {report.submittedAt && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">提交时间</span>
                    <span>{formatDate(report.submittedAt)}</span>
                  </div>
                </>
              )}
              {report.approvedAt && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">审核时间</span>
                    <span>{formatDate(report.approvedAt)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 客户评价展示 */}
          {report.rating && (
            <Card>
              <CardHeader><CardTitle>客户评价</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-1 mb-2">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={`text-xl ${s <= (report.rating ?? 0) ? "text-yellow-400" : "text-muted-foreground"}`}>★</span>
                  ))}
                </div>
                {report.ratingComment && <p className="text-sm text-muted-foreground">{report.ratingComment}</p>}
              </CardContent>
            </Card>
          )}

          <Button variant="outline" className="w-full" asChild>
            <a href={`/dashboard/appraiser/reports/edit?id=${id}`}>
              <FileText className="mr-2 h-4 w-4" />编辑报告
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
