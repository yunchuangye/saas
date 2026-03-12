"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { roles, type UserRole } from "@/lib/config/roles"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = React.useState<UserRole>("appraiser")
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [formData, setFormData] = React.useState({
    username: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // 模拟登录延迟
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    // 根据选择的角色跳转到对应的仪表盘
    const role = roles.find((r) => r.id === selectedRole)
    if (role) {
      router.push(role.dashboardPath)
    }
    
    setIsLoading(false)
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

          {/* 登录按钮 */}
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
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
