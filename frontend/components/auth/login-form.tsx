"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { roles, type UserRole } from "@/lib/config/roles"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { trpc } from "@/lib/trpc"

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  appraiser: "/dashboard/appraiser",
  bank: "/dashboard/bank",
  investor: "/dashboard/investor",
  customer: "/dashboard/customer",
  admin: "/dashboard/admin",
}

// 验证码 Hook
function useCaptcha() {
  const [captchaId, setCaptchaId] = React.useState("")
  const [captchaSvg, setCaptchaSvg] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/captcha', { cache: 'no-store' })
      const data = await res.json()
      setCaptchaId(data.id)
      setCaptchaSvg(data.svg)
    } catch (e) {
      console.error("验证码加载失败", e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  return { captchaId, captchaSvg, loading, refresh }
}

export function LoginForm() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = React.useState<UserRole>("customer")
  const [showPassword, setShowPassword] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState("")
  const [formData, setFormData] = React.useState({
    username: "",
    password: "",
    captchaCode: "",
  })

  const { captchaId, captchaSvg, loading: captchaLoading, refresh: refreshCaptcha } = useCaptcha()

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      const token = (data as any)?.token
      const role = (data as any)?.user?.role ?? ""
      if (token) {
        document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
      }
      const dashboardPath = ROLE_DASHBOARD_MAP[role] || "/dashboard/appraiser"
      router.push(dashboardPath)
    },
    onError: (error) => {
      setErrorMsg(error.message || "用户名或密码错误，请重试")
      refreshCaptcha()
      setFormData(prev => ({ ...prev, captchaCode: "" }))
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    if (!formData.username || !formData.password) {
      setErrorMsg("请输入用户名和密码")
      return
    }
    if (!formData.captchaCode) {
      setErrorMsg("请输入验证码")
      return
    }
    loginMutation.mutate({
      username: formData.username,
      password: formData.password,
      captchaId,
      captchaCode: formData.captchaCode,
    })
  }

  return (
    <div className="w-full space-y-8">
      {/* 标题区 */}
      <div className="space-y-2">
        <h1 className="text-3xl xl:text-4xl font-bold tracking-tight text-foreground">
          欢迎登录
        </h1>
        <p className="text-base xl:text-lg text-muted-foreground">
          选择您的身份，登录 GuJia.App 平台
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 角色选择 */}
        <div className="space-y-3">
          <Label className="text-base font-semibold text-foreground">选择身份</Label>
          <div className="grid grid-cols-5 gap-2.5">
            {[...roles.filter(r => r.id === "customer"), ...roles.filter(r => r.id !== "customer" && r.id !== "admin")].map((role) => {
              const Icon = role.icon
              const isSelected = selectedRole === role.id
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-3 xl:p-4 transition-all duration-200",
                    "hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm",
                    isSelected
                      ? "border-primary bg-primary/8 shadow-sm"
                      : "border-border bg-background"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-13 w-13 xl:h-14 xl:w-14 items-center justify-center rounded-xl transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground"
                    )}
                    style={{ width: '52px', height: '52px' }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-center space-y-0.5">
                    <p className={cn(
                      "text-base font-semibold leading-tight",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {role.name}
                    </p>
                    <p className="text-xs text-muted-foreground leading-tight hidden xl:block">
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
          <Label htmlFor="username" className="text-base font-medium">
            用户名 / 手机号
          </Label>
          <Input
            id="username"
            type="text"
            placeholder="请输入用户名或手机号"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            disabled={loginMutation.isPending}
            className="h-12 text-base px-4"
          />
        </div>

        {/* 密码 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-base font-medium">
              密码
            </Label>
            <a
              href="/forgot-password"
              className="text-sm text-primary hover:underline font-medium"
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
              className="h-12 text-base px-4 pr-12"
              disabled={loginMutation.isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* 数字验证码 */}
        <div className="space-y-2">
          <Label htmlFor="captchaCode" className="text-base font-medium">
            验证码
          </Label>
          <div className="flex gap-3 items-center">
            <Input
              id="captchaCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="请输入验证码"
              value={formData.captchaCode}
              onChange={(e) => setFormData({ ...formData, captchaCode: e.target.value.replace(/\D/g, '') })}
              required
              maxLength={4}
              className="flex-1 h-12 text-xl font-bold tracking-[0.5em] px-4"
              disabled={loginMutation.isPending}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={refreshCaptcha}
              title="点击刷新验证码"
              className="relative group shrink-0 p-0 border-0 bg-transparent"
              disabled={captchaLoading}
            >
              {captchaLoading ? (
                <div className="h-12 w-[140px] rounded-lg border-2 border-input bg-muted flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : captchaSvg ? (
                <div className="relative h-12 w-[140px]">
                  <div
                    className="h-12 w-[140px] rounded-lg border-2 border-input overflow-hidden bg-white group-hover:border-primary group-hover:shadow-md transition-all"
                    dangerouslySetInnerHTML={{ __html: captchaSvg }}
                    style={{ lineHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  />
                  <div className="absolute inset-0 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity">
                    <RefreshCw className="h-5 w-5 text-primary drop-shadow" />
                  </div>
                </div>
              ) : (
                <div className="h-12 w-[140px] rounded-lg border-2 border-dashed border-input bg-muted/50 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">点击验证码图片可刷新</p>
        </div>

        {/* 错误提示 */}
        {errorMsg && (
          <div className="flex items-center gap-3 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* 登录按钮 */}
        <Button
          type="submit"
          className="w-full h-13 text-base font-semibold rounded-xl"
          style={{ height: '52px' }}
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              登录中...
            </>
          ) : (
            "登 录"
          )}
        </Button>

        {/* 注册链接 */}
        <div className="text-center text-base">
          <span className="text-muted-foreground">还没有账号？</span>{" "}
          <a href="/register" className="text-primary hover:underline font-semibold">
            立即注册
          </a>
        </div>
      </form>
    </div>
  )
}
