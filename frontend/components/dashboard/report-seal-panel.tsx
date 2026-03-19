"use client"

/**
 * 报告签章操作面板
 * 嵌入到报告详情页中，提供：
 * 1. 申请签章（评估师）
 * 2. 审批签章（机构负责人）
 * 3. 执行签章（系统）
 * 4. 查看签章状态和审计日志
 * 5. 下载已签章 PDF
 */

import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Stamp, CheckCircle, XCircle, Clock, Download, QrCode, Shield,
  FileText, AlertCircle, Loader2, ChevronDown, ChevronUp, History,
  Play, Eye
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

interface ReportSealPanelProps {
  reportId: number
  reportStatus: string
  sealStatus?: string
  role: "appraiser" | "bank" | "investor" | "customer" | "admin"
}

const sealStatusConfig: Record<string, { label: string; color: string; icon: any; desc: string }> = {
  none: { label: "未签章", color: "text-gray-500", icon: FileText, desc: "报告尚未申请电子签章" },
  pending: { label: "待审批", color: "text-yellow-600", icon: Clock, desc: "签章申请已提交，等待机构负责人审批" },
  approved: { label: "审批通过", color: "text-blue-600", icon: CheckCircle, desc: "签章申请已通过，可执行签章" },
  signed: { label: "已签章", color: "text-green-600", icon: Shield, desc: "报告已加盖电子签章，具有法律效力" },
}

const actionLogMap: Record<string, string> = {
  apply: "提交签章申请",
  approve: "审批通过",
  reject: "审批拒绝",
  sign_start: "开始执行签章",
  sign_success: "签章成功",
  sign_failed: "签章失败",
  verify: "验证签章",
  download: "下载签章PDF",
  revoke: "撤销签章",
}

export function ReportSealPanel({ reportId, reportStatus, sealStatus = "none", role }: ReportSealPanelProps) {
  const { toast } = useToast()
  const [showApplyDialog, setShowApplyDialog] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showLogsDialog, setShowLogsDialog] = useState(false)
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [reviewComment, setReviewComment] = useState("")
  const [applyReason, setApplyReason] = useState("")
  const [selectedOrgSealId, setSelectedOrgSealId] = useState<string>("")
  const [selectedPersonalSealId, setSelectedPersonalSealId] = useState<string>("")
  const [sealPosition, setSealPosition] = useState("bottom_right")
  const [sealPage, setSealPage] = useState("last")
  const [expanded, setExpanded] = useState(true)

  // 获取报告的签章申请
  const { data: application, refetch: refetchApp } = trpc.seals.getApplicationByReport.useQuery(
    { reportId },
    { enabled: !!reportId }
  )

  // 获取我的签章列表（评估师用）
  const { data: mySeals } = trpc.seals.getMySeals.useQuery(undefined, {
    enabled: role === "appraiser",
  })

  // 获取审计日志
  const { data: auditLogs, refetch: refetchLogs } = trpc.seals.getAuditLogs.useQuery(
    { reportId, pageSize: 20 },
    { enabled: showLogsDialog }
  )

  // 提交签章申请
  const applyMutation = trpc.seals.applyForSeal.useMutation({
    onSuccess: () => {
      toast({ title: "签章申请已提交", description: "等待机构负责人审批" })
      setShowApplyDialog(false)
      refetchApp()
    },
    onError: (err: any) => toast({ title: "申请失败", description: err.message, variant: "destructive" }),
  })

  // 审批签章申请
  const reviewMutation = trpc.seals.reviewApplication.useMutation({
    onSuccess: (_, vars) => {
      toast({ title: vars.approved ? "已批准签章申请" : "已拒绝签章申请" })
      setShowReviewDialog(false)
      refetchApp()
    },
    onError: (err: any) => toast({ title: "操作失败", description: err.message, variant: "destructive" }),
  })

  // 执行签章
  const executeMutation = trpc.seals.executeSeal.useMutation({
    onSuccess: (data: any) => {
      toast({
        title: "签章成功！",
        description: `验证码：${data.verifyCode}，已生成签章 PDF`,
      })
      refetchApp()
    },
    onError: (err: any) => toast({ title: "签章失败", description: err.message, variant: "destructive" }),
  })

  // 记录下载
  const downloadMutation = trpc.seals.recordDownload.useMutation({
    onSuccess: (data: any) => {
      if (data.signedPdfUrl) {
        window.open(data.signedPdfUrl, "_blank")
      }
    },
    onError: (err: any) => toast({ title: "下载失败", description: err.message, variant: "destructive" }),
  })

  const handleApply = () => {
    if (!selectedOrgSealId && !selectedPersonalSealId) {
      toast({ title: "请至少选择一个签章", variant: "destructive" })
      return
    }
    applyMutation.mutate({
      reportId,
      orgSealId: selectedOrgSealId ? Number(selectedOrgSealId) : undefined,
      personalSealId: selectedPersonalSealId ? Number(selectedPersonalSealId) : undefined,
      sealPosition: sealPage as any,
      sealPage: sealPage as any,
      applyReason,
    })
  }

  const handleReview = (approved: boolean) => {
    if (!application) return
    if (!approved && !reviewComment.trim()) {
      toast({ title: "请填写拒绝原因", variant: "destructive" })
      return
    }
    reviewMutation.mutate({ id: (application as any).id, approved, comment: reviewComment })
  }

  const handleExecute = () => {
    if (!application) return
    if (confirm("确认执行签章？签章后将生成带有电子签章的 PDF 报告。")) {
      executeMutation.mutate({ applicationId: (application as any).id })
    }
  }

  const formatDate = (d: any) => {
    if (!d) return "—"
    try { return format(new Date(d), "yyyy-MM-dd HH:mm", { locale: zhCN }) } catch { return "—" }
  }

  const currentSealStatus = (application as any)?.status === "signed" ? "signed"
    : (application as any)?.status === "approved" ? "approved"
    : (application as any)?.status === "pending" ? "pending"
    : sealStatus || "none"

  const statusConfig = sealStatusConfig[currentSealStatus] || sealStatusConfig.none
  const StatusIcon = statusConfig.icon

  const approvedSeals = (mySeals as any[])?.filter(s => s.status === "approved") ?? []
  const orgSeals = approvedSeals.filter(s => s.type === "org_seal")
  const personalSeals = approvedSeals.filter(s => s.type === "personal_seal")

  // 只有审核通过的报告才显示签章面板
  if (reportStatus !== "approved" && reportStatus !== "archived" && currentSealStatus === "none") {
    return null
  }

  return (
    <Card className={`${currentSealStatus === "signed" ? "border-green-200" : ""}`}>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stamp className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">电子签章</CardTitle>
            <Badge
              variant={currentSealStatus === "signed" ? "default" : "secondary"}
              className={`ml-1 ${currentSealStatus === "signed" ? "bg-green-600" : ""}`}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
        {!expanded && (
          <CardDescription className="mt-1">{statusConfig.desc}</CardDescription>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* 状态说明 */}
          <div className={`flex items-start gap-3 p-3 rounded-lg ${
            currentSealStatus === "signed" ? "bg-green-50 border border-green-200" :
            currentSealStatus === "approved" ? "bg-blue-50 border border-blue-200" :
            currentSealStatus === "pending" ? "bg-yellow-50 border border-yellow-200" :
            "bg-gray-50"
          }`}>
            <StatusIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${statusConfig.color}`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{statusConfig.desc}</p>
            </div>
          </div>

          {/* 已签章信息 */}
          {currentSealStatus === "signed" && application && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">签章时间</p>
                  <p className="font-medium">{formatDate((application as any).signed_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">验证码</p>
                  <p className="font-mono font-bold text-primary">{(application as any).verify_code}</p>
                </div>
              </div>
              {(application as any).sign_hash && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">文件哈希（防篡改）</p>
                  <p className="font-mono text-xs bg-gray-50 p-2 rounded break-all">
                    {(application as any).sign_hash}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => downloadMutation.mutate({ applicationId: (application as any).id })}
                  disabled={downloadMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  下载签章 PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVerifyDialog(true)}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  验证
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowLogsDialog(true); refetchLogs() }}
                >
                  <History className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* 待审批状态 */}
          {currentSealStatus === "pending" && application && (
            <div className="space-y-3">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">申请人</span>
                  <span>{(application as any).applicant_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">申请时间</span>
                  <span>{formatDate((application as any).created_at)}</span>
                </div>
                {(application as any).apply_reason && (
                  <div>
                    <span className="text-muted-foreground">申请说明：</span>
                    <span>{(application as any).apply_reason}</span>
                  </div>
                )}
              </div>
              {/* 机构负责人可以审批 */}
              {(role === "appraiser" || role === "admin") && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => { setShowReviewDialog(true); setReviewComment("") }}
                >
                  审批签章申请
                </Button>
              )}
            </div>
          )}

          {/* 审批通过，可执行签章 */}
          {currentSealStatus === "approved" && application && (
            <div className="space-y-3">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">审批人</span>
                  <span>{(application as any).reviewer_name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">审批时间</span>
                  <span>{formatDate((application as any).reviewed_at)}</span>
                </div>
              </div>
              {(role === "appraiser" || role === "admin") && (
                <Button
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleExecute}
                  disabled={executeMutation.isPending}
                >
                  {executeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  执行签章
                </Button>
              )}
            </div>
          )}

          {/* 未签章，评估师可申请 */}
          {currentSealStatus === "none" && reportStatus === "approved" && role === "appraiser" && (
            <Button
              size="sm"
              className="w-full"
              onClick={() => setShowApplyDialog(true)}
            >
              <Stamp className="h-4 w-4 mr-2" />
              申请电子签章
            </Button>
          )}

          {/* 审计日志入口 */}
          {currentSealStatus !== "none" && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => { setShowLogsDialog(true); refetchLogs() }}
            >
              <History className="h-4 w-4 mr-2" />
              查看操作记录
            </Button>
          )}
        </CardContent>
      )}

      {/* 申请签章对话框 */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>申请电子签章</DialogTitle>
            <DialogDescription>选择签章并提交申请，经机构负责人审批后执行签章</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {approvedSeals.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Stamp className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无可用签章</p>
                <p className="text-xs mt-1">请先在"我的签章"页面上传并通过审核</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>机构公章（选填）</Label>
                  <Select value={selectedOrgSealId} onValueChange={setSelectedOrgSealId}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择机构公章..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">不使用机构公章</SelectItem>
                      {orgSeals.map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>个人执业章（选填）</Label>
                  <Select value={selectedPersonalSealId} onValueChange={setSelectedPersonalSealId}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择个人执业章..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">不使用个人执业章</SelectItem>
                      {personalSeals.map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>签章位置</Label>
                    <Select value={sealPosition} onValueChange={setSealPosition}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom_right">右下角</SelectItem>
                        <SelectItem value="bottom_center">底部居中</SelectItem>
                        <SelectItem value="bottom_left">左下角</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>签章页面</Label>
                    <Select value={sealPage} onValueChange={setSealPage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last">仅最后一页</SelectItem>
                        <SelectItem value="first_and_last">首尾两页</SelectItem>
                        <SelectItem value="all">所有页面</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>申请说明（选填）</Label>
                  <Textarea
                    placeholder="说明签章用途，如：用于银行抵押贷款..."
                    value={applyReason}
                    onChange={(e) => setApplyReason(e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyDialog(false)}>取消</Button>
            <Button
              onClick={handleApply}
              disabled={applyMutation.isPending || approvedSeals.length === 0}
            >
              {applyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              提交申请
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 审批对话框 */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>审批签章申请</DialogTitle>
            <DialogDescription>请确认签章信息后进行审批</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {application && (
              <div className="text-sm space-y-2 bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">申请人</span>
                  <span className="font-medium">{(application as any).applicant_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">机构公章</span>
                  <span>{(application as any).org_seal_name || "未选择"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">个人执业章</span>
                  <span>{(application as any).personal_seal_name || "未选择"}</span>
                </div>
                {(application as any).apply_reason && (
                  <div>
                    <span className="text-muted-foreground">申请说明：</span>
                    <span>{(application as any).apply_reason}</span>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label>审批意见（拒绝时必填）</Label>
              <Textarea
                placeholder="填写审批意见..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>取消</Button>
            <Button
              variant="destructive"
              onClick={() => handleReview(false)}
              disabled={reviewMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" />
              拒绝
            </Button>
            <Button
              onClick={() => handleReview(true)}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              批准
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 审计日志对话框 */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>签章操作记录</DialogTitle>
            <DialogDescription>记录所有签章相关操作，保障可追溯性</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto py-2">
            {!auditLogs || (auditLogs.items as any[]).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无操作记录</p>
              </div>
            ) : (
              (auditLogs.items as any[]).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{actionLogMap[log.action] || log.action}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(log.created_at)}</span>
                    </div>
                    <p className="text-muted-foreground text-xs mt-0.5">{log.description}</p>
                    <p className="text-xs text-muted-foreground">操作人：{log.operator_name || log.operator_username || "系统"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 签章验证对话框 */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>签章验证信息</DialogTitle>
            <DialogDescription>扫描报告上的二维码或输入验证码可验证签章真实性</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {application && (
              <>
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="text-green-700 font-medium text-sm">签章验证通过</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">验证码</span>
                    <span className="font-mono font-bold text-lg text-primary tracking-widest">
                      {(application as any).verify_code}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">签章时间</span>
                    <span>{formatDate((application as any).signed_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">机构公章</span>
                    <span>{(application as any).org_seal_name || "未使用"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">个人执业章</span>
                    <span>{(application as any).personal_seal_name || "未使用"}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground bg-gray-50 rounded p-2">
                  <p className="font-medium mb-1">验证方式：</p>
                  <p>1. 扫描 PDF 报告上的二维码</p>
                  <p>2. 访问 /verify-seal?code={(application as any).verify_code}</p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
