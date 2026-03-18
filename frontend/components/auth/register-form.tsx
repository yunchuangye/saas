"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { roles, type UserRole } from "@/lib/config/roles"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { trpc } from "@/lib/trpc"

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
      router.push("/login?registered=1")
    },
    onError: (error) => {
      setErrorMsg(error.message || "注册失败，请重试")
      refreshCaptcha()
      setFormData(prev => ({ ...prev, captchaCode: "" }))
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!formData.username || formData.username.length < 2) {
      setErrorMsg("用户名至少需要2个字符")
      return
    }
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
    <div className="w-full space-y-7">
      {/* 标题区 — 与登录页一致的大字号 */}
      <div className="space-y-2">
        <h1 className="text-3xl xl:text-4xl font-bold tracking-tight text-foreground">
          免费注册
        </h1>
        <p className="text-base xl:text-lg text-muted-foreground">
          填写信息，开启专业估价之旅
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 角色选择 — 与登录页一致的样式 */}
        <div className="space-y-3">
          <Label className="text-base font-semibold text-foreground">注册身份</Label>
          <div className="grid grid-cols-4 gap-2.5">
            {roles.filter(r => r.id !== "admin").map((role) => {
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
                      "flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      "text-xs font-semibold leading-tight",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {role.name}
                    </p>
                    {role.description && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight hidden xl:block">
                        {role.description}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 用户名 */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-base font-medium">
            用户名 <span className="text-destructive">*</span>
          </Label>
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
            className="h-12 text-base px-4"
          />
        </div>

        {/* 联系人和手机号 — 两列布局 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactName" className="text-base font-medium">联系人</Label>
            <Input
              id="contactName"
              type="text"
              placeholder="请输入姓名"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              disabled={isLoading}
              className="h-12 text-base px-4"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-base font-medium">手机号</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="请输入手机号"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isLoading}
              className="h-12 text-base px-4"
            />
          </div>
        </div>

        {/* 邮箱 */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-base font-medium">
            邮箱 <span className="text-muted-foreground text-sm font-normal">（可选）</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="请输入邮箱"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={isLoading}
            className="h-12 text-base px-4"
          />
        </div>

        {/* 密码和确认密码 — 两列布局 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-base font-medium">
              设置密码 <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="至少6位密码"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                className="h-12 text-base px-4 pr-12"
                disabled={isLoading}
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
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-base font-medium">
              确认密码 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              disabled={isLoading}
              className="h-12 text-base px-4"
            />
          </div>
        </div>

        {/* 图形验证码 — 与登录页一致的大尺寸 */}
        <div className="space-y-2">
          <Label htmlFor="captchaCode" className="text-base font-medium">
            验证码 <span className="text-destructive">*</span>
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
              disabled={isLoading}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={refreshCaptcha}
              title="点击刷新验证码"
              className="relative group shrink-0 p-0 border-0 bg-transparent"
              disabled={captchaLoading || isLoading}
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

        {/* 服务协议 */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            disabled={isLoading}
          />
          <label htmlFor="agree" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
            我已阅读并同意{" "}
            <a href="/terms" className="text-primary hover:underline font-medium">《服务协议》</a>
            {" "}和{" "}
            <a href="/privacy" className="text-primary hover:underline font-medium">《隐私政策》</a>
          </label>
        </div>

        {/* 错误提示 */}
        {errorMsg && (
          <div className="flex items-center gap-3 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* 注册按钮 — 与登录页一致的大按钮 */}
        <Button
          type="submit"
          className="w-full text-base font-semibold rounded-xl"
          style={{ height: '52px' }}
          disabled={isLoading || !agreed}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              注册中...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              立即注册
            </>
          )}
        </Button>

        {/* 登录链接 */}
        <div className="text-center text-base">
          <span className="text-muted-foreground">已有账号？</span>{" "}
          <a href="/login" className="text-primary hover:underline font-semibold">
            立即登录
          </a>
        </div>
      </form>
    </div>
  )
}
