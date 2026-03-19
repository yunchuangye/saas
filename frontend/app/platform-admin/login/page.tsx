"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Eye, EyeOff, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function PlatformAdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState("")

  const loginMutation = trpc.platformAdmin.login.useMutation({
    onSuccess: (data) => {
      // 存储平台超管 Token（独立 key，与 SaaS 租户 Token 完全隔离）
      localStorage.setItem("platform_admin_token", data.token)
      localStorage.setItem("platform_admin_info", JSON.stringify(data.admin))
      toast.success(`欢迎回来，${data.admin.name || data.admin.username}`)
      if (data.isFirstLogin) {
        toast.warning("首次登录，请立即修改密码！")
      }
      router.push("/platform-admin/dashboard")
    },
    onError: (e) => {
      setError(e.message)
    },
  })

  const handleLogin = () => {
    setError("")
    if (!username || !password) { setError("请输入用户名和密码"); return; }
    loginMutation.mutate({ username, password })
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo 区域 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">平台运营管理中心</h1>
          <p className="text-gray-400 text-sm mt-2">Platform Operations Center</p>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-1 rounded-full">
            <AlertCircle className="w-3 h-3" />
            仅限平台运营人员访问，与租户系统完全隔离
          </div>
        </div>

        {/* 登录表单 */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <div className="space-y-5">
            <div>
              <Label className="text-gray-300">管理员账号</Label>
              <Input
                className="mt-1.5 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                placeholder="输入管理员用户名或邮箱"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div>
              <Label className="text-gray-300">登录密码</Label>
              <div className="relative mt-1.5">
                <Input
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 pr-10"
                  type={showPwd ? "text" : "password"}
                  placeholder="输入密码"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  onClick={() => setShowPwd(!showPwd)}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
              onClick={handleLogin}
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  验证中...
                </span>
              ) : "安全登录"}
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800 text-center">
            <p className="text-xs text-gray-500">
              此入口为平台内部管理系统，所有操作均有完整审计日志记录
            </p>
          </div>
        </div>

        {/* 底部提示 */}
        <p className="text-center text-xs text-gray-600 mt-6">
          如忘记密码，请联系系统管理员重置
        </p>
      </div>
    </div>
  )
}
