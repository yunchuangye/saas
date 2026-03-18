import { LoginForm } from "@/components/auth/login-form"
import { Logo } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Building2, Shield, Zap, FileCheck, TrendingUp, Users } from "lucide-react"

export const metadata = {
  title: "登录",
  description: "登录 GuJia.App 房地产评估平台",
}

const features = [
  {
    icon: Building2,
    title: "专业评估",
    description: "覆盖住宅、商业、工业等多种物业类型",
  },
  {
    icon: Zap,
    title: "高效协同",
    description: "银行、评估公司、客户三方在线协同",
  },
  {
    icon: Shield,
    title: "安全可靠",
    description: "企业级数据加密，保障数据安全",
  },
  {
    icon: FileCheck,
    title: "合规标准",
    description: "符合行业规范，报告标准化可追溯",
  },
  {
    icon: TrendingUp,
    title: "数据驱动",
    description: "大数据支撑，评估结果更精准",
  },
  {
    icon: Users,
    title: "多方协作",
    description: "多角色权限管理，协作流程清晰",
  },
]

const stats = [
  { value: "10,000+", label: "评估项目" },
  { value: "500+", label: "合作机构" },
  { value: "99.9%", label: "服务可用率" },
]

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌展示区 */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] bg-[#0f1f3d] relative overflow-hidden flex-col">
        {/* 背景装饰层 */}
        <div className="absolute inset-0 overflow-hidden">
          {/* 大圆 */}
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-500/10" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-500/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-blue-400/5" />
          {/* 网格线装饰 */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-transparent to-indigo-900/20" />
        </div>

        {/* 内容区 */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14 text-white">
          {/* Logo */}
          <div className="mb-12">
            <Logo variant="light" size="lg" />
          </div>

          {/* 主标题区 */}
          <div className="flex-1 flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm text-blue-200 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                专业房地产评估平台
              </div>
              <h1 className="text-4xl xl:text-5xl 2xl:text-6xl font-bold leading-tight">
                有态度的
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">
                  估价专业平台
                </span>
              </h1>
              <p className="text-lg xl:text-xl text-white/70 leading-relaxed max-w-sm">
                连接银行、评估公司与客户，提供高效、透明、专业的房地产评估数字化解决方案
              </p>
            </div>

            {/* 数据统计 */}
            <div className="flex gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <div className="text-2xl xl:text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-white/50">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* 特性网格 */}
            <div className="grid grid-cols-2 gap-3 xl:gap-4">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="flex items-start gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/8 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 border border-blue-400/20">
                      <Icon className="h-4 w-4 text-blue-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{feature.title}</p>
                      <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 底部版权 */}
          <div className="mt-10 text-sm text-white/30">
            © {new Date().getFullYear()} GuJia.App 版权所有
          </div>
        </div>
      </div>

      {/* 右侧登录表单区 */}
      <div className="flex-1 flex flex-col bg-background">
        {/* 顶部导航 */}
        <header className="flex items-center justify-between px-8 py-5">
          <div className="lg:hidden">
            <Logo size="sm" />
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        {/* 登录表单 - 垂直居中，水平铺满 */}
        <main className="flex-1 flex items-center justify-center px-8 xl:px-16 2xl:px-24 py-6">
          <div className="w-full max-w-xl">
            <LoginForm />
          </div>
        </main>

        {/* 底部版权（移动端显示） */}
        <footer className="lg:hidden p-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} GuJia.App 版权所有</p>
        </footer>
      </div>
    </div>
  )
}
