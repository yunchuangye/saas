"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { roles, type UserRole } from "@/lib/config/roles"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react"

export function RegisterForm() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = React.useState<UserRole>("appraiser")
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [formData, setFormData] = React.useState({
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [agreed, setAgreed] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      alert("两次输入的密码不一致")
      return
    }
    
    if (!agreed) {
      alert("请阅读并同意服务协议和隐私政策")
      return
    }
    
    setIsLoading(true)
    
    // 模拟注册延迟
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    // 注册成功后跳转到登录页
    router.push("/login")
    
    setIsLoading(false)
  }

  return (
    <Card className="w-full max-w-lg border-0 shadow-xl">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold text-center">注册账号</CardTitle>
        <CardDescription className="text-center">
          填写信息，开启专业估价之旅
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 角色选择 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">注册身份</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {roles.filter(r => r.id !== "admin").map((role) => {
                const Icon = role.icon
                const isSelected = selectedRole === role.id
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border-2 p-2.5 transition-all text-center",
                      "hover:border-primary/50 hover:bg-accent",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className={cn(
                      "text-xs font-medium",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {role.name}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 公司名称 */}
          <div className="space-y-2">
            <Label htmlFor="companyName">公司名称</Label>
            <Input
              id="companyName"
              type="text"
              placeholder="请输入公司全称"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
            />
          </div>

          {/* 联系人和手机号 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">联系人</Label>
              <Input
                id="contactName"
                type="text"
                placeholder="请输入姓名"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">手机号</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="请输入手机号"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          {/* 邮箱 */}
          <div className="space-y-2">
            <Label htmlFor="email">企业邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="请输入企业邮箱"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {/* 密码 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">设置密码</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>
          </div>

          {/* 服务协议 */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="agree" className="text-sm text-muted-foreground">
              我已阅读并同意
              <a href="/terms" className="text-primary hover:underline">《服务协议》</a>
              和
              <a href="/privacy" className="text-primary hover:underline">《隐私政策》</a>
            </label>
          </div>

          {/* 注册按钮 */}
          <Button type="submit" className="w-full" size="lg" disabled={isLoading || !agreed}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                注册中...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                立即注册
              </>
            )}
          </Button>

          {/* 登录链接 */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">已有账号？</span>{" "}
            <a href="/login" className="text-primary hover:underline font-medium">
              立即登录
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
