"use client"
import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, CheckCircle2, Mail, AlertCircle } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

type Step = "input" | "sent"

export function ForgotPasswordForm() {
  const { toast } = useToast()
  const [step, setStep] = React.useState<Step>("input")
  const [email, setEmail] = React.useState("")
  const [devResetUrl, setDevResetUrl] = React.useState<string | undefined>()

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: (data) => {
      setStep("sent")
      if (data.devResetUrl) setDevResetUrl(data.devResetUrl)
    },
    onError: (err) => {
      toast({ title: "请求失败", description: err.message, variant: "destructive" })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    forgotMutation.mutate({ email })
  }

  if (step === "sent") {
    return (
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold">邮件已发送</h2>
            <p className="text-sm text-muted-foreground">
              如果 <span className="font-medium text-foreground">{email}</span> 已注册，
              密码重置链接将发送到该邮箱，请查收
            </p>
            <p className="text-xs text-muted-foreground">链接有效期为 1 小时，过期后需重新申请</p>
            {devResetUrl && (
              <Alert className="text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <span className="font-medium">开发模式链接：</span>
                  <Link href={devResetUrl} className="text-primary hover:underline break-all ml-1">点击重置密码</Link>
                </AlertDescription>
              </Alert>
            )}
            <Link href="/login">
              <Button className="w-full mt-4">返回登录</Button>
            </Link>
            <button type="button" className="text-sm text-muted-foreground hover:text-foreground underline" onClick={() => { setStep("input"); setDevResetUrl(undefined) }}>
              重新发送
            </button>
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
          <CardTitle className="text-2xl font-bold">忘记密码</CardTitle>
        </div>
        <CardDescription>请输入您注册时使用的邮箱地址，我们将发送密码重置链接</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱地址</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="pl-9"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={forgotMutation.isPending || !email}>
            {forgotMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />发送中...</>
            ) : "发送重置链接"}
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
