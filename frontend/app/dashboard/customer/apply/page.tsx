"use client"

import { useState } from "react"
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
import { Send, Upload, Home, Building2, Factory, MapPin } from "lucide-react"

export default function CustomerApplyPage() {
  const [step, setStep] = useState(1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">申请评估</h1>
        <p className="text-muted-foreground">提交房产评估申请</p>
      </div>

      {/* 进度指示 */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
          <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>1</span>
          <span>选择类型</span>
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
          <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>2</span>
          <span>填写信息</span>
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className={`flex items-center gap-2 ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>
          <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>3</span>
          <span>提交申请</span>
        </div>
      </div>

      {step === 1 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStep(2)}>
            <CardHeader className="text-center">
              <Home className="h-12 w-12 mx-auto text-primary" />
              <CardTitle>住宅评估</CardTitle>
              <CardDescription>公寓、别墅、住宅小区等</CardDescription>
            </CardHeader>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStep(2)}>
            <CardHeader className="text-center">
              <Building2 className="h-12 w-12 mx-auto text-primary" />
              <CardTitle>商业评估</CardTitle>
              <CardDescription>办公楼、商铺、综合体等</CardDescription>
            </CardHeader>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStep(2)}>
            <CardHeader className="text-center">
              <Factory className="h-12 w-12 mx-auto text-primary" />
              <CardTitle>工业评估</CardTitle>
              <CardDescription>厂房、仓库、工业园等</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>房产信息</CardTitle>
                <CardDescription>请填写待评估房产的详细信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">房产地址</Label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="address" placeholder="请输入详细地址" className="pl-8" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="area">建筑面积 (㎡)</Label>
                    <Input id="area" type="number" placeholder="请输入面积" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">建成年份</Label>
                    <Input id="year" type="number" placeholder="例如: 2015" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="floor">所在楼层</Label>
                    <Input id="floor" placeholder="例如: 15/28" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purpose">评估目的</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择评估目的" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mortgage">抵押贷款</SelectItem>
                        <SelectItem value="sale">交易买卖</SelectItem>
                        <SelectItem value="inheritance">继承分割</SelectItem>
                        <SelectItem value="other">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">补充说明</Label>
                  <Textarea id="description" placeholder="其他需要说明的情况..." />
                </div>
                <div className="space-y-2">
                  <Label>上传资料</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">拖拽文件到此处或点击上传</p>
                    <p className="text-xs text-muted-foreground mt-1">支持房产证、身份证等资料</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>联系方式</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input id="name" placeholder="请输入姓名" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">手机号码</Label>
                  <Input id="phone" placeholder="请输入手机号" />
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                上一步
              </Button>
              <Button className="flex-1" onClick={() => setStep(3)}>
                下一步
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-success" />
            </div>
            <CardTitle>确认提交</CardTitle>
            <CardDescription>请确认以上信息无误后提交申请</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">房产类型:</span> 住宅</p>
              <p><span className="text-muted-foreground">房产地址:</span> 北京市朝阳区望京街道XX小区X号楼</p>
              <p><span className="text-muted-foreground">建筑面积:</span> 120 ㎡</p>
              <p><span className="text-muted-foreground">评估目的:</span> 抵押贷款</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                返回修改
              </Button>
              <Button className="flex-1">
                <Send className="mr-2 h-4 w-4" />
                提交申请
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
