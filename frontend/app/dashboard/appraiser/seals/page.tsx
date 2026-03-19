"use client"

import { useState, useRef } from "react"
import { trpc } from "@/lib/trpc"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Stamp, Plus, Upload, CheckCircle, XCircle, Clock, Trash2,
  Star, StarOff, Shield, FileText, AlertCircle, Loader2, Eye
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

const sealTypeMap: Record<string, { label: string; color: string }> = {
  org_seal: { label: "机构公章", color: "bg-blue-100 text-blue-700" },
  personal_seal: { label: "个人执业章", color: "bg-purple-100 text-purple-700" },
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: any }> = {
  pending: { label: "待审核", variant: "secondary", icon: Clock },
  approved: { label: "已通过", variant: "default", icon: CheckCircle },
  rejected: { label: "已拒绝", variant: "destructive", icon: XCircle },
  disabled: { label: "已禁用", variant: "outline", icon: AlertCircle },
}

export default function AppraiserSealsPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [previewSeal, setPreviewSeal] = useState<any>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const [form, setForm] = useState({
    name: "",
    type: "personal_seal" as "org_seal" | "personal_seal",
    imageUrl: "",
    certificateNo: "",
    validFrom: "",
    validUntil: "",
  })

  const { data: seals, isLoading, refetch } = trpc.seals.getMySeals.useQuery()

  const createMutation = trpc.seals.createSeal.useMutation({
    onSuccess: () => {
      toast({ title: "签章已提交", description: "等待管理员审核后即可使用" })
      setShowCreateDialog(false)
      setForm({ name: "", type: "personal_seal", imageUrl: "", certificateNo: "", validFrom: "", validUntil: "" })
      setUploadedImageUrl("")
      refetch()
    },
    onError: (err: any) => toast({ title: "提交失败", description: err.message, variant: "destructive" }),
  })

  const setDefaultMutation = trpc.seals.setDefault.useMutation({
    onSuccess: () => { toast({ title: "已设为默认签章" }); refetch() },
    onError: (err: any) => toast({ title: "操作失败", description: err.message, variant: "destructive" }),
  })

  const deleteMutation = trpc.seals.deleteSeal.useMutation({
    onSuccess: () => { toast({ title: "签章已删除" }); refetch() },
    onError: (err: any) => toast({ title: "删除失败", description: err.message, variant: "destructive" }),
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast({ title: "请上传图片文件（PNG/JPG）", variant: "destructive" })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "图片大小不能超过 2MB", variant: "destructive" })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" })
      const data = await res.json()
      if (data.url) {
        setUploadedImageUrl(data.url)
        setForm(f => ({ ...f, imageUrl: data.url }))
        toast({ title: "图片上传成功" })
      } else {
        throw new Error(data.error || "上传失败")
      }
    } catch (err: any) {
      toast({ title: "上传失败", description: err.message, variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreate = () => {
    if (!form.name.trim()) { toast({ title: "请填写签章名称", variant: "destructive" }); return }
    if (!form.imageUrl) { toast({ title: "请上传签章图片", variant: "destructive" }); return }
    createMutation.mutate(form)
  }

  const formatDate = (d: any) => {
    if (!d) return "—"
    try { return format(new Date(d), "yyyy-MM-dd", { locale: zhCN }) } catch { return "—" }
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Stamp className="h-6 w-6 text-primary" />
            我的签章
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            管理机构公章和个人执业章，用于为评估报告加盖电子签章
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          添加签章
        </Button>
      </div>

      {/* 说明卡片 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">电子签章说明</p>
              <ul className="space-y-1 text-blue-700">
                <li>• 签章图片需为 PNG 格式，建议使用透明背景，尺寸 200×200 像素以上</li>
                <li>• 机构公章由机构管理员上传，个人执业章绑定到您的账号</li>
                <li>• 所有签章需经管理员审核通过后方可使用</li>
                <li>• 签章后的 PDF 报告含防篡改二维码和可信时间戳，具有法律效力</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 签章列表 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !seals || (seals as any[]).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Stamp className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">暂无签章</p>
            <p className="text-sm mt-1">点击"添加签章"上传您的机构公章或个人执业章</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(seals as any[]).map((seal) => {
            const status = statusMap[seal.status] || statusMap.pending
            const StatusIcon = status.icon
            const typeInfo = sealTypeMap[seal.type] || { label: seal.type, color: "bg-gray-100 text-gray-700" }

            return (
              <Card key={seal.id} className={`relative ${seal.is_default ? "border-primary ring-1 ring-primary" : ""}`}>
                {seal.is_default && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary text-primary-foreground text-xs">默认</Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    {/* 签章图片预览 */}
                    <div
                      className="w-16 h-16 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setPreviewSeal(seal)}
                    >
                      {seal.image_url ? (
                        <img src={seal.image_url} alt={seal.name} className="w-full h-full object-contain" />
                      ) : (
                        <Stamp className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{seal.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">状态</span>
                    <Badge variant={status.variant} className="flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                  {seal.certificate_no && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">证书编号</span>
                      <span className="font-mono text-xs">{seal.certificate_no}</span>
                    </div>
                  )}
                  {seal.valid_until && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">有效期至</span>
                      <span>{formatDate(seal.valid_until)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">使用次数</span>
                    <span>{seal.use_count || 0} 次</span>
                  </div>
                  {seal.review_comment && seal.status === "rejected" && (
                    <div className="text-xs text-red-600 bg-red-50 rounded p-2">
                      拒绝原因：{seal.review_comment}
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setPreviewSeal(seal)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      预览
                    </Button>
                    {seal.status === "approved" && !seal.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setDefaultMutation.mutate({ id: seal.id, type: seal.type })}
                        disabled={setDefaultMutation.isPending}
                      >
                        <Star className="h-3 w-3 mr-1" />
                        设为默认
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("确定删除此签章吗？")) {
                          deleteMutation.mutate({ id: seal.id })
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 添加签章对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加签章</DialogTitle>
            <DialogDescription>上传机构公章或个人执业章图片，提交后等待管理员审核</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>签章类型 *</Label>
              <Select
                value={form.type}
                onValueChange={(v: any) => setForm(f => ({ ...f, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="org_seal">机构公章</SelectItem>
                  <SelectItem value="personal_seal">个人执业章</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>签章名称 *</Label>
              <Input
                placeholder="如：XX评估机构公章"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>签章图片 *</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadedImageUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={uploadedImageUrl} alt="签章预览" className="w-24 h-24 object-contain" />
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      图片已上传，点击重新选择
                    </p>
                  </div>
                ) : isUploading ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-sm">上传中...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <p className="text-sm font-medium">点击上传签章图片</p>
                    <p className="text-xs">PNG 格式，透明背景，建议 200×200px 以上，最大 2MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <div className="space-y-2">
              <Label>执业证书编号（选填）</Label>
              <Input
                placeholder="如：沪房估字第XXXXXX号"
                value={form.certificateNo}
                onChange={(e) => setForm(f => ({ ...f, certificateNo: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>有效期开始（选填）</Label>
                <Input
                  type="date"
                  value={form.validFrom}
                  onChange={(e) => setForm(f => ({ ...f, validFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>有效期结束（选填）</Label>
                <Input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => setForm(f => ({ ...f, validUntil: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              提交审核
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 签章预览对话框 */}
      {previewSeal && (
        <Dialog open={!!previewSeal} onOpenChange={() => setPreviewSeal(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{previewSeal.name}</DialogTitle>
              <DialogDescription>
                {sealTypeMap[previewSeal.type]?.label} · {statusMap[previewSeal.status]?.label}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-48 h-48 border rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                {previewSeal.image_url ? (
                  <img src={previewSeal.image_url} alt={previewSeal.name} className="w-full h-full object-contain" />
                ) : (
                  <Stamp className="h-16 w-16 text-gray-300" />
                )}
              </div>
              <div className="w-full space-y-2 text-sm">
                {previewSeal.certificate_no && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">证书编号</span>
                    <span className="font-mono">{previewSeal.certificate_no}</span>
                  </div>
                )}
                {previewSeal.valid_until && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">有效期至</span>
                    <span>{formatDate(previewSeal.valid_until)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">使用次数</span>
                  <span>{previewSeal.use_count || 0} 次</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">添加时间</span>
                  <span>{formatDate(previewSeal.created_at)}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
