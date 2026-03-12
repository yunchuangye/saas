import { RegisterForm } from "@/components/auth/register-form"
import { Logo } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Building2, Shield, Zap, FileCheck } from "lucide-react"

export const metadata = {
  title: "注册",
  description: "注册 gujia.app 房地产评估平台账号",
}

const features = [
  {
    icon: Building2,
    title: "专业评估",
    description: "覆盖住宅、商业、工业等多种物业类型的专业评估服务",
  },
  {
    icon: Zap,
    title: "高效协同",
    description: "银行、评估公司、客户三方在线协同，大幅提升工作效率",
  },
  {
    icon: Shield,
    title: "安全可靠",
    description: "企业级数据加密，确保评估数据和报告的安全性",
  },
  {
    icon: FileCheck,
    title: "合规标准",
    description: "符合行业规范和监管要求，报告标准化、可追溯",
  },
]

export default function RegisterPage() {
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
              加入专业的估价平台
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              免费注册，立即体验高效、透明、专业的房地产评估数字化解决方案
            </p>
          </div>
          
          {/* 底部特性 */}
          <div className="grid grid-cols-2 gap-6 max-w-lg">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 右侧注册表单区 */}
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

        {/* 注册表单 */}
        <main className="flex-1 flex items-center justify-center p-6">
          <RegisterForm />
        </main>

        {/* 底部版权 */}
        <footer className="p-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} gujia.app 版权所有</p>
        </footer>
      </div>
    </div>
  )
}
