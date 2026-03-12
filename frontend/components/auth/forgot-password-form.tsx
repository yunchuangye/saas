"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react"

type Step = "input" | "sent"

export function ForgotPasswordForm() {
  const [step, setStep] = React.useState<Step>("input")
  const [isLoading, setIsLoading] = React.useState(false)
  const [phone, setPhone] = React.useState("")
  const [verifyCode, setVerifyCode] = React.useState("")
  const [countdown, setCountdown] = React.useState(0)

  // 发送验证码倒计时
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendCode = async () => {
    if (!phone || countdown > 0) return
    
    setIsLoading(true)
    // 模拟发送验证码
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setCountdown(60)
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // 模拟验证
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    setStep("sent")
    setIsLoading(false)
  }

  if (step === "sent") {
    return (
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold">密码重置成功</h2>
            <p className="text-sm text-muted-foreground">
              新密码已发送至您的手机 {phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}
            </p>
            <p className="text-sm text-muted-foreground">
              请使用新密码登录，登录后建议立即修改密码
            </p>
            <Link href="/login">
              <Button className="w-full mt-4">
                返回登录
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-xl">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center gap-2">
          <Link 
            href="/login" 
            className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <CardTitle className="text-2xl font-bold">忘记密码</CardTitle>
        </div>
        <CardDescription>
          请输入您注册时使用的手机号，我们将发送验证码帮助您重置密码
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 手机号 */}
          <div className="space-y-2">
            <Label htmlFor="phone">手机号</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              maxLength={11}
            />
          </div>

          {/* 验证码 */}
          <div className="space-y-2">
            <Label htmlFor="code">验证码</Label>
            <div className="flex gap-3">
              <Input
                id="code"
                type="text"
                placeholder="请输入验证码"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                required
                maxLength={6}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSendCode}
                disabled={!phone || phone.length !== 11 || countdown > 0 || isLoading}
                className="shrink-0 w-28"
              >
                {countdown > 0 ? `${countdown}s` : "获取验证码"}
              </Button>
            </div>
          </div>

          {/* 提交按钮 */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg" 
            disabled={isLoading || !phone || !verifyCode}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                验证中...
              </>
            ) : (
              "重置密码"
            )}
          </Button>

          {/* 返回登录 */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">想起密码了？</span>{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              返回登录
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
