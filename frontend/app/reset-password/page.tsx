"use client"
import React, { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const token = searchParams.get("token") ?? ""

  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [success, setSuccess] = React.useState(false)

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: (data) => {
      setSuccess(true)
      toast({ title: "密码重置成功", description: data.message })
    },
    onError: (err) => {
      toast({ title: "重置失败", description: err.message, variant: "destructive" })
    },
  })

  const passwordStrength = React.useMemo(() => {
    if (!newPassword) return { score: 0, label: "", color: "" }
    let score = 0
    if (newPassword.length >= 8) score++
    if (/[A-Z]/.test(newPassword)) score++
    if (/[0-9]/.test(newPassword)) score++
    if (/[^A-Za-z0-9]/.test(newPassword)) score++
    const levels = [
      { score: 0, label: "", color: "" },
      { score: 1, label: "弱", color: "bg-red-500" },
      { score: 2, label: "中", color: "bg-yellow-500" },
      { score: 3, label: "强", color: "bg-blue-500" },
      { score: 4, label: "非常强", color: "bg-green-500" },
    ]
    return levels[score] ?? levels[0]
  }, [newPassword])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      toast({ title: "无效链接", description: "重置链接无效，请重新申请", variant: "destructive" })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "密码不匹配", description: "两次输入的密码不一致", variant: "destructive" })
      return
    }
    if (newPassword.length < 6) {
      toast({ title: "密码太短", description: "密码至少需要 6 个字符", variant: "destructive" })
      return
    }
    resetMutation.mutate({ token, newPassword })
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold">链接无效</h2>
            <p className="text-sm text-muted-foreground">此重置链接无效或已过期，请重新申请密码重置</p>
            <Link href="/forgot-password">
              <Button className="w-full mt-4">重新申请</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold">密码重置成功</h2>
            <p className="text-sm text-muted-foreground">您的密码已成功重置，请使用新密码登录</p>
            <Button className="w-full mt-4" onClick={() => router.push("/login")}>
              前往登录
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-xl">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center gap-2">
          <Link href="/login" className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-accent transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <CardTitle className="text-2xl font-bold">重置密码</CardTitle>
        </div>
        <CardDescription>请输入您的新密码</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="newPassword">新密码</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="至少 6 个字符"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* 密码强度指示器 */}
            {newPassword && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= passwordStrength.score ? passwordStrength.color : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                {passwordStrength.label && (
                  <p className="text-xs text-muted-foreground">密码强度：{passwordStrength.label}</p>
                )}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">确认新密码</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="再次输入新密码"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">两次输入的密码不一致</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={resetMutation.isPending || !newPassword || !confirmPassword || newPassword !== confirmPassword}
          >
            {resetMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />重置中...</>
            ) : "确认重置密码"}
          </Button>
          <div className="text-center text-sm">
            <span className="text-muted-foreground">想起密码了？</span>{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">返回登录</Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between p-6">
        <Logo size="sm" />
        <ThemeToggle />
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <Suspense fallback={<div className="w-full max-w-md h-64 animate-pulse bg-muted rounded-xl" />}>
          <ResetPasswordForm />
        </Suspense>
      </main>
      <footer className="p-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} GuJia.App 版权所有</p>
      </footer>
    </div>
  )
}
