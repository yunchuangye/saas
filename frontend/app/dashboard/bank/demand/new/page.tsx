"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Send, Loader2, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface UploadedFile { name: string; url: string; size?: number }

export default function BankDemandNewPage() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deadline, setDeadline] = useState<Date>()
  const [attachments, setAttachments] = useState<UploadedFile[]>([])
  const [form, setForm] = useState({
    title: "", propertyType: "", propertyAddress: "", area: "",
    floor: "", buildYear: "", purpose: "抵押贷款",
    contactName: "", contactPhone: "", description: "",
  })

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      toast({ title: "需求发布成功", description: `项目编号：${data.projectNo}，系统将自动推送给所有合作评估公司` })
      router.push("/dashboard/bank/bidding")
    },
    onError: (err: any) => {
      toast({ title: "发布失败", description: err.message, variant: "destructive" })
    },
  })

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return
    const newFiles: UploadedFile[] = Array.from(files).map(f => ({ name: f.name, url: "", size: f.size }))
    setAttachments(prev => [...prev, ...newFiles])
  }

  const handleSubmit = () => {
    if (!form.title.trim()) { toast({ title: "请填写项目名称", variant: "destructive" }); return }
    if (!form.propertyAddress.trim()) { toast({ title: "请填写房产地址", variant: "destructive" }); return }
    createMutation.mutate({
      title: form.title,
      propertyType: form.propertyType || undefined,
      propertyAddress: form.propertyAddress,
      area: form.area ? parseFloat(form.area) : undefined,
      floor: form.floor || undefined,
      buildYear: form.buildYear ? parseInt(form.buildYear) : undefined,
      purpose: form.purpose || undefined,
      contactName: form.contactName || undefined,
      contactPhone: form.contactPhone || undefined,
      description: form.description || undefined,
      deadline: deadline ? deadline.toISOString() : undefined,
      attachments: attachments.filter(a => a.name).length > 0 ? attachments.filter(a => a.name) : undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">发起评估需求</h1>
        <p className="text-muted-foreground">创建新的评估项目需求，系统将自动推送给合作评估公司</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>基本信息</CardTitle><CardDescription>填写评估项目的基本信息</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>项目名称 <span className="text-red-500">*</span></Label>
                <Input placeholder="如：深圳南山区某住宅抵押评估" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>评估类型</Label>
                  <Select value={form.propertyType} onValueChange={v => setForm({ ...form, propertyType: v })}>
                    <SelectTrigger><SelectValue placeholder="选择评估类型" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="住宅">住宅评估</SelectItem>
                      <SelectItem value="商业">商业评估</SelectItem>
                      <SelectItem value="工业">工业评估</SelectItem>
                      <SelectItem value="土地">土地评估</SelectItem>
                      <SelectItem value="办公">办公楼评估</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>评估用途</Label>
                  <Select value={form.purpose} onValueChange={v => setForm({ ...form, purpose: v })}>
                    <SelectTrigger><SelectValue placeholder="选择评估用途" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="抵押贷款">抵押贷款</SelectItem>
                      <SelectItem value="司法拍卖">司法拍卖</SelectItem>
                      <SelectItem value="资产处置">资产处置</SelectItem>
                      <SelectItem value="风险管控">风险管控</SelectItem>
                      <SelectItem value="其他">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>房产信息</CardTitle><CardDescription>填写待评估房产的详细信息</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>房产地址 <span className="text-red-500">*</span></Label>
                <Input placeholder="请填写完整地址" value={form.propertyAddress} onChange={e => setForm({ ...form, propertyAddress: e.target.value })} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>建筑面积（㎡）</Label>
                  <Input type="number" placeholder="如：89.5" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>所在楼层</Label>
                  <Input placeholder="如：15/32" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>建成年份</Label>
                  <Input type="number" placeholder="如：2015" value={form.buildYear} onChange={e => setForm({ ...form, buildYear: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>截止日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !deadline && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, "PPP", { locale: zhCN }) : "选择截止日期（可选）"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus disabled={d => d < new Date()} />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>联系人信息</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>联系人姓名</Label>
                  <Input placeholder="请输入联系人姓名" value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>联系电话</Label>
                  <Input placeholder="请输入手机号码" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>详细要求</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>评估要求说明</Label>
                <Textarea placeholder="请描述评估的具体要求..." className="min-h-[100px]" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>附件上传</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors" onClick={() => fileInputRef.current?.click()}>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => handleFileUpload(e.target.files)} />
                  <p className="text-sm text-muted-foreground">点击上传附件（支持 PDF、Word、图片等格式）</p>
                </div>
                {attachments.length > 0 && (
                  <div className="space-y-1">
                    {attachments.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-sm rounded border px-3 py-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="truncate max-w-xs">{f.name}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-red-500" onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}>删除</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>操作</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />发布中...</> : <><Send className="mr-2 h-4 w-4" />发布需求</>}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard/bank/projects")}>取消</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>温馨提示</CardTitle></CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• 需求发布后将自动推送给所有合作评估公司</li>
                <li>• 评估公司可在截止日期前提交报价</li>
                <li>• 您可以在竞价结束后选择中标方</li>
                <li>• 详细完整的需求描述有助于获得更准确的报价</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
