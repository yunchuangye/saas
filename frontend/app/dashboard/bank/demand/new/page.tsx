"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Send, Save } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { useState } from "react"
import { FileUploader, type UploadedFile } from "@/components/ui/file-uploader"

export default function BankDemandNewPage() {
  const [deadline, setDeadline] = useState<Date>()
  const [attachments, setAttachments] = useState<UploadedFile[]>([])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">发起需求</h1>
        <p className="text-muted-foreground">创建新的评估项目需求</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>填写评估项目的基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">项目名称</Label>
                  <Input id="title" placeholder="请输入项目名称" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">评估类型</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="选择评估类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">住宅评估</SelectItem>
                      <SelectItem value="commercial">商业评估</SelectItem>
                      <SelectItem value="industrial">工业评估</SelectItem>
                      <SelectItem value="land">土地评估</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">物业地址</Label>
                <Input id="address" placeholder="请输入详细地址" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="area">建筑面积 (㎡)</Label>
                  <Input id="area" type="number" placeholder="请输入面积" />
                </div>
                <div className="space-y-2">
                  <Label>截止日期</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deadline ? format(deadline, "PPP", { locale: zhCN }) : "选择日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={deadline}
                        onSelect={setDeadline}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>竞价设置</CardTitle>
              <CardDescription>设置项目竞价参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="budget-min">预算下限 (¥)</Label>
                  <Input id="budget-min" type="number" placeholder="最低预算" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget-max">预算上限 (¥)</Label>
                  <Input id="budget-max" type="number" placeholder="最高预算" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bidding-deadline">竞价截止时间</Label>
                <Input id="bidding-deadline" type="datetime-local" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>详细要求</CardTitle>
              <CardDescription>填写其他评估要求</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="requirements">评估要求</Label>
                <Textarea
                  id="requirements"
                  placeholder="请描述评估的具体要求..."
                  className="min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <Label>附件上传</Label>
                <FileUploader
                  value={attachments}
                  onChange={setAttachments}
                  maxFiles={10}
                  maxSize={10 * 1024 * 1024}
                />
                {attachments.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    已上传 {attachments.length} 个附件，将随需求一并提交
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => {
                const attachmentInfo = attachments.length > 0
                  ? `\n\n已附上 ${attachments.length} 个附件：\n${attachments.map(f => `• ${f.originalName}`).join('\n')}`
                  : ''
                alert(`需求发布成功！\n\n系统将自动推送给所有合作评估公司，请在"竞价项目"中查看报价情况。${attachmentInfo}`)
                window.location.href = '/dashboard/bank/bidding'
              }}>
                <Send className="mr-2 h-4 w-4" />
                发布需求
              </Button>
              <Button variant="outline" className="w-full" onClick={() => {
                alert('草稿已保存！')
              }}>
                <Save className="mr-2 h-4 w-4" />
                保存草稿
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>提示</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• 需求发布后将自动推送给所有合作评估公司</li>
                <li>• 评估公司可在竞价截止前提交报价</li>
                <li>• 您可以在竞价结束后选择中标方</li>
                <li>• 详细完整的需求描述有助于获得更准确的报价</li>
              </ul>
            </CardContent>
          </Card>

          {attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>已上传附件</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {attachments.map(f => (
                    <li key={f.url} className="text-muted-foreground truncate">
                      • {f.originalName}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
