"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { roles, type UserRole } from "@/lib/config/roles"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import { trpc } from "@/lib/trpc"

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  appraiser: "/dashboard/appraiser",
  bank: "/dashboard/bank",
  investor: "/dashboard/investor",
  customer: "/dashboard/customer",
  admin: "/dashboard/admin",
}

export function LoginForm() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = React.useState<UserRole>("appraiser")
  const [showPassword, setShowPassword] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState("")
  const [formData, setFormData] = React.useState({
    username: "",
    password: "",
  })

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      const token = (data as any)?.token
      const role = (data as any)?.user?.role ?? ""
      // 将 token 存入前端域名的 Cookie，供前端 middleware (proxy.ts) 读取鉴权
      // 解决前后端不同域名时 Cookie 无法共享的问题
      if (token) {
        document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
      }
      const dashboardPath = ROLE_DASHBOARD_MAP[role] || "/dashboard/appraiser"
      router.push(dashboardPath)
    },
    onError: (error) => {
      setErrorMsg(error.message || "用户名或密码错误，请重试")
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    if (!formData.username || !formData.password) {
      setErrorMsg("请输入用户名和密码")
      return
    }
    loginMutation.mutate({
      username: formData.username,
      password: formData.password,
    })
  }

  return (
    <Card className="w-full max-w-2xl border-0 shadow-xl">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold text-center">登录</CardTitle>
        <CardDescription className="text-center">
          选择您的身份并登录系统
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 角色选择 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">选择身份</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {roles.map((role) => {
                const Icon = role.icon
                const isSelected = selectedRole === role.id
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all",
                      "hover:border-primary/50 hover:bg-accent",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-center">
                      <p className={cn(
                        "text-sm font-medium",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        {role.name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1 hidden sm:block">
                        {role.description.split("、")[0]}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 用户名 */}
          <div className="space-y-2">
            <Label htmlFor="username">用户名 / 手机号</Label>
            <Input
              id="username"
              type="text"
              placeholder="请输入用户名或手机号"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={loginMutation.isPending}
            />
          </div>

          {/* 密码 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">密码</Label>
              <a
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                忘记密码？
              </a>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="请输入密码"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="pr-10"
                disabled={loginMutation.isPending}
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

          {/* 错误提示 */}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 登录按钮 */}
          <Button type="submit" className="w-full" size="lg" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登录中...
              </>
            ) : (
              "登录"
            )}
          </Button>

          {/* 注册链接 */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">还没有账号？</span>{" "}
            <a href="/register" className="text-primary hover:underline font-medium">
              立即注册
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
