"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Settings, Eye, EyeOff, Lock, Loader2, ShieldCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { trpc } from "@/lib/trpc"

export function AccountSettingsPage() {
  const { toast } = useToast()
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwForm, setPwForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [pwError, setPwError] = useState("")

  const changePwMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast({ title: "密码修改成功", description: "请使用新密码重新登录" })
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" })
      setPwError("")
    },
    onError: (err) => {
      toast({ title: "修改失败", description: err.message, variant: "destructive" })
    },
  })

  const handleChangePassword = () => {
    setPwError("")
    if (!pwForm.oldPassword) { setPwError("请输入原密码"); return }
    if (!pwForm.newPassword) { setPwError("请输入新密码"); return }
    if (pwForm.newPassword.length < 6) { setPwError("新密码至少 6 位"); return }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError("两次输入的新密码不一致"); return }
    changePwMutation.mutate({
      oldPassword: pwForm.oldPassword,
      newPassword: pwForm.newPassword,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">账户设置</h1>
        <p className="text-muted-foreground">管理您的账户安全设置</p>
      </div>

      {/* 修改密码 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>修改密码</CardTitle>
          </div>
          <CardDescription>定期更换密码有助于保护账户安全</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 max-w-lg">
            {/* 原密码 */}
            <div className="space-y-2">
              <Label htmlFor="oldPassword">原密码</Label>
              <div className="relative">
                <Input
                  id="oldPassword"
                  type={showOld ? "text" : "password"}
                  value={pwForm.oldPassword}
                  onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })}
                  placeholder="请输入原密码"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Separator />

            {/* 新密码 */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  placeholder="请输入新密码（至少 6 位）"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 确认新密码 */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  placeholder="请再次输入新密码"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 错误提示 */}
            {pwError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                {pwError}
              </p>
            )}

            <Button
              onClick={handleChangePassword}
              disabled={changePwMutation.isPending}
              className="w-fit"
            >
              {changePwMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />修改中...</>
              ) : (
                <><ShieldCheck className="mr-2 h-4 w-4" />确认修改密码</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
