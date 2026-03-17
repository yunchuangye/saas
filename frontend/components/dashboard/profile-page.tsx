"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Save, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { trpc } from "@/lib/trpc"

const ROLE_LABEL: Record<string, string> = {
  admin: "系统管理员",
  appraiser: "评估公司",
  bank: "银行机构",
  investor: "投资机构",
  customer: "个人客户",
}

export function ProfilePage() {
  const { toast } = useToast()
  const { data: profile, isLoading, refetch } = trpc.auth.profile.useQuery()
  const updateMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast({ title: "保存成功", description: "个人信息已更新" })
      refetch()
    },
    onError: (err) => {
      toast({ title: "保存失败", description: err.message, variant: "destructive" })
    },
  })

  const [form, setForm] = useState({ displayName: "", email: "", phone: "" })
  const [initialized, setInitialized] = useState(false)

  // 数据加载后初始化表单
  if (profile && !initialized) {
    setForm({
      displayName: profile.displayName || "",
      email: profile.email || "",
      phone: profile.phone || "",
    })
    setInitialized(true)
  }

  const handleSave = () => {
    const payload: { displayName?: string; email?: string; phone?: string } = {}
    if (form.displayName) payload.displayName = form.displayName
    if (form.email) payload.email = form.email
    if (form.phone) payload.phone = form.phone
    updateMutation.mutate(payload)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">个人中心</h1>
        <p className="text-muted-foreground">查看和管理您的个人信息</p>
      </div>

      {/* 用户信息卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>基本信息</CardTitle>
          </div>
          <CardDescription>您的账号基本信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 mb-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar || ""} alt={profile?.displayName || ""} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {(profile?.displayName || profile?.username || "U").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold">{profile?.displayName || profile?.username}</span>
                <Badge variant="secondary">{ROLE_LABEL[profile?.role || ""] || profile?.role}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">用户名：{profile?.username}</p>
              {profile?.organization && (
                <p className="text-sm text-muted-foreground">所属机构：{profile.organization.name}</p>
              )}
            </div>
          </div>

          <Separator className="mb-6" />

          <div className="grid gap-4 max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="displayName">显示名称</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="请输入显示名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />邮箱地址</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="请输入邮箱地址"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />手机号码</span>
              </Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="请输入手机号码"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="w-fit"
            >
              {updateMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />保存中...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" />保存修改</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
