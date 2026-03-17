"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { roles, type UserRole } from "@/lib/config/roles"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { trpc, BACKEND_URL } from "@/lib/trpc"

// 验证码 Hook
function useCaptcha() {
  const [captchaId, setCaptchaId] = React.useState("")
  const [captchaSvg, setCaptchaSvg] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/captcha`)
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

export function RegisterForm() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = React.useState<UserRole>("appraiser")
  const [showPassword, setShowPassword] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState("")
  const [formData, setFormData] = React.useState({
    username: "",
    contactName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    captchaCode: "",
  })
  const [agreed, setAgreed] = React.useState(false)

  const { captchaId, captchaSvg, loading: captchaLoading, refresh: refreshCaptcha } = useCaptcha()

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      const token = (data as any)?.token
      if (token) {
        document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
      }
      // 注册成功后跳转到登录页
      router.push("/login?registered=1")
    },
    onError: (error) => {
      setErrorMsg(error.message || "注册失败，请重试")
      // 注册失败时刷新验证码
      refreshCaptcha()
      setFormData(prev => ({ ...prev, captchaCode: "" }))
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("两次输入的密码不一致")
      return
    }

    if (!agreed) {
      setErrorMsg("请阅读并同意服务协议和隐私政策")
      return
    }

    if (!formData.captchaCode) {
      setErrorMsg("请输入验证码")
      return
    }

    if (!formData.username || formData.username.length < 2) {
      setErrorMsg("用户名至少需要2个字符")
      return
    }

    registerMutation.mutate({
      username: formData.username,
      password: formData.password,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      displayName: formData.contactName || formData.username,
      role: selectedRole as "appraiser" | "bank" | "investor" | "customer",
      captchaId,
      captchaCode: formData.captchaCode,
    })
  }

  const isLoading = registerMutation.isPending

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

          {/* 用户名 */}
          <div className="space-y-2">
            <Label htmlFor="username">用户名 <span className="text-destructive">*</span></Label>
            <Input
              id="username"
              type="text"
              placeholder="请输入登录用户名（至少2个字符）"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              minLength={2}
              maxLength={50}
              disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 邮箱 */}
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="请输入邮箱（可选）"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isLoading}
            />
          </div>

          {/* 密码 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">设置密码 <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="至少6位密码"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="pr-10"
                  disabled={isLoading}
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
              <Label htmlFor="confirmPassword">确认密码 <span className="text-destructive">*</span></Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 图形验证码 */}
          <div className="space-y-2">
            <Label htmlFor="captchaCode">图形验证码 <span className="text-destructive">*</span></Label>
            <div className="flex items-center gap-3">
              <Input
                id="captchaCode"
                type="text"
                placeholder="请输入验证码"
                value={formData.captchaCode}
                onChange={(e) => setFormData({ ...formData, captchaCode: e.target.value })}
                required
                maxLength={6}
                className="flex-1 tracking-widest text-base uppercase"
                disabled={isLoading}
                autoComplete="off"
              />
              <div
                className="flex items-center gap-1 cursor-pointer select-none"
                onClick={refreshCaptcha}
                title="点击刷新验证码"
              >
                {captchaLoading ? (
                  <div className="w-[120px] h-[40px] rounded border border-border bg-muted flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : captchaSvg ? (
                  <div
                    className="w-[120px] h-[40px] rounded border border-border overflow-hidden bg-white"
                    dangerouslySetInnerHTML={{ __html: captchaSvg }}
                  />
                ) : null}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); refreshCaptcha() }}
                  className="p-1 text-muted-foreground hover:text-primary transition-colors"
                  title="刷新验证码"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">验证码不区分大小写，点击图片可刷新</p>
          </div>

          {/* 服务协议 */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              disabled={isLoading}
            />
            <label htmlFor="agree" className="text-sm text-muted-foreground">
              我已阅读并同意
              <a href="/terms" className="text-primary hover:underline">《服务协议》</a>
              和
              <a href="/privacy" className="text-primary hover:underline">《隐私政策》</a>
            </label>
          </div>

          {/* 错误提示 */}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

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
