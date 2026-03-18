import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { Logo } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { KeyRound, ShieldCheck, Clock, Smartphone } from "lucide-react"

export const metadata = {
  title: "忘记密码",
  description: "重置您的 GuJia.App 账户密码",
}

const tips = [
  {
    icon: Smartphone,
    title: "手机验证",
    description: "通过注册手机号接收验证码，安全快捷",
  },
  {
    icon: ShieldCheck,
    title: "安全保障",
    description: "多重验证机制，确保账户安全",
  },
  {
    icon: Clock,
    title: "即时生效",
    description: "密码重置后立即生效，无需等待",
  },
  {
    icon: KeyRound,
    title: "建议修改",
    description: "重置后请及时修改为强密码",
  },
]

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌展示区 */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-primary relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
        
        {/* 内容 */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* 顶部 Logo */}
          <div>
            <Logo variant="light" size="lg" />
          </div>
          
          {/* 中间口号 */}
          <div className="space-y-6 max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight text-balance">
              找回您的账户
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              别担心，我们将帮助您安全地重置密码。只需通过手机验证，即可快速恢复账户访问权限。
            </p>
          </div>
          
          {/* 底部提示 */}
          <div className="grid grid-cols-2 gap-6 max-w-lg">
            {tips.map((tip) => {
              const Icon = tip.icon
              return (
                <div key={tip.title} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold">{tip.title}</h3>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {tip.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 右侧表单区 */}
      <div className="flex-1 flex flex-col bg-background">
        {/* 顶部导航 */}
        <header className="flex items-center justify-between p-6">
          <div className="lg:hidden">
            <Logo size="sm" />
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        {/* 表单 */}
        <main className="flex-1 flex items-center justify-center p-6">
          <ForgotPasswordForm />
        </main>

        {/* 底部版权 */}
        <footer className="p-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} GuJia.App 版权所有</p>
        </footer>
      </div>
    </div>
  )
}
