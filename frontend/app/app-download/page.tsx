import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Smartphone,
  Bell,
  FileText,
  MapPin,
  Shield,
  Zap,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Download,
  Star,
} from "lucide-react"

export const metadata = {
  title: "APP下载 - gujia.app",
  description: "下载估价APP，随时随地查看项目进度、接收通知提醒、在线审批报告",
}

// APP功能特性
const features = [
  {
    icon: Bell,
    title: "实时消息推送",
    description: "项目状态变更、报告审批等重要通知即时推送",
  },
  {
    icon: FileText,
    title: "在线查看报告",
    description: "随时随地查看评估报告，支持放大、批注",
  },
  {
    icon: MapPin,
    title: "现场勘察导航",
    description: "一键导航到物业地址，支持拍照上传",
  },
  {
    icon: Shield,
    title: "安全数据保护",
    description: "端到端加密传输，数据安全有保障",
  },
  {
    icon: Zap,
    title: "快速审批流程",
    description: "移动端一键审批，提升工作效率",
  },
  {
    icon: Clock,
    title: "项目进度追踪",
    description: "实时查看项目进度，历史记录清晰",
  },
]

export default function AppDownloadPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* 导航栏 */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-20 items-center justify-between">
          <Link href="/">
            <Logo size="lg" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-base font-medium">返回首页</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero区域 - 居中布局 */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-20 lg:py-28">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            {/* 标题区域 */}
            <Badge className="mb-6 text-sm px-4 py-1.5 bg-primary/10 text-primary border-primary/20">
              估价APP - 随身的估价专家
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-balance">
              移动办公
              <span className="text-primary"> 触手可及</span>
            </h1>
            <p className="mt-6 text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              下载估价APP，随时随地查看项目进度、接收通知提醒、在线审批报告，让估价工作不再受限于办公室
            </p>

            {/* 下载按钮区域 */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                className="text-base font-semibold w-full sm:w-auto min-w-[200px] px-8 py-6 h-auto bg-black text-white hover:bg-black/90"
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                App Store
              </Button>
              <Button 
                size="lg" 
                className="text-base font-semibold w-full sm:w-auto min-w-[200px] px-8 py-6 h-auto bg-[#3DDC84] text-white hover:bg-[#34c276]"
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                </svg>
                Android
              </Button>
            </div>

            {/* 二维码和版本信息 */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-8">
              <div className="flex items-center gap-4">
                <div className="bg-white border-2 border-muted rounded-xl p-3 shadow-sm">
                  <svg className="w-20 h-20" viewBox="0 0 100 100">
                    <rect x="5" y="5" width="25" height="25" fill="currentColor"/>
                    <rect x="70" y="5" width="25" height="25" fill="currentColor"/>
                    <rect x="5" y="70" width="25" height="25" fill="currentColor"/>
                    <rect x="10" y="10" width="15" height="15" fill="white"/>
                    <rect x="75" y="10" width="15" height="15" fill="white"/>
                    <rect x="10" y="75" width="15" height="15" fill="white"/>
                    <rect x="13" y="13" width="9" height="9" fill="currentColor"/>
                    <rect x="78" y="13" width="9" height="9" fill="currentColor"/>
                    <rect x="13" y="78" width="9" height="9" fill="currentColor"/>
                    <rect x="35" y="5" width="5" height="5" fill="currentColor"/>
                    <rect x="45" y="5" width="5" height="5" fill="currentColor"/>
                    <rect x="55" y="5" width="5" height="5" fill="currentColor"/>
                    <rect x="35" y="15" width="5" height="5" fill="currentColor"/>
                    <rect x="50" y="15" width="5" height="5" fill="currentColor"/>
                    <rect x="35" y="25" width="5" height="5" fill="currentColor"/>
                    <rect x="45" y="25" width="5" height="5" fill="currentColor"/>
                    <rect x="55" y="25" width="5" height="5" fill="currentColor"/>
                    <rect x="35" y="35" width="30" height="30" fill="currentColor"/>
                    <rect x="40" y="40" width="20" height="20" fill="white"/>
                    <rect x="45" y="45" width="10" height="10" fill="currentColor"/>
                    <rect x="5" y="35" width="5" height="5" fill="currentColor"/>
                    <rect x="15" y="35" width="5" height="5" fill="currentColor"/>
                    <rect x="25" y="35" width="5" height="5" fill="currentColor"/>
                    <rect x="5" y="45" width="5" height="5" fill="currentColor"/>
                    <rect x="20" y="45" width="5" height="5" fill="currentColor"/>
                    <rect x="5" y="55" width="5" height="5" fill="currentColor"/>
                    <rect x="15" y="55" width="5" height="5" fill="currentColor"/>
                    <rect x="25" y="55" width="5" height="5" fill="currentColor"/>
                    <rect x="70" y="35" width="5" height="5" fill="currentColor"/>
                    <rect x="80" y="35" width="5" height="5" fill="currentColor"/>
                    <rect x="90" y="35" width="5" height="5" fill="currentColor"/>
                    <rect x="70" y="45" width="5" height="5" fill="currentColor"/>
                    <rect x="85" y="45" width="5" height="5" fill="currentColor"/>
                    <rect x="70" y="55" width="5" height="5" fill="currentColor"/>
                    <rect x="80" y="55" width="5" height="5" fill="currentColor"/>
                    <rect x="90" y="55" width="5" height="5" fill="currentColor"/>
                    <rect x="70" y="70" width="25" height="25" fill="currentColor"/>
                    <rect x="75" y="75" width="15" height="15" fill="white"/>
                    <rect x="78" y="78" width="9" height="9" fill="currentColor"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">扫码下载</p>
                  <p className="text-xs text-muted-foreground mt-1">支持 iOS / Android</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>v2.5.0</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                <span>68.5MB</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                <span>2024-01-15</span>
              </div>
            </div>

            {/* APP评分 */}
            <div className="mt-8 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <span className="text-sm font-medium">4.9</span>
                <span className="text-sm text-muted-foreground">App Store</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">10万+</span> 下载量
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 功能特性 */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">
              强大功能 随身携带
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              专为估价从业者设计，让移动办公更高效
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary shrink-0">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* 下载CTA */}
      <section className="py-20 bg-primary">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl lg:text-4xl font-bold">
              立即下载 开启移动办公
            </h2>
            <p className="mt-4 text-lg text-white/80">
              支持 iOS 和 Android 双平台
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                className="text-base font-semibold min-w-[180px] px-8 py-5 h-auto bg-white text-primary hover:bg-gray-100"
              >
                <Download className="mr-2 h-5 w-5" />
                立即下载
              </Button>
            </div>
            <p className="mt-6 text-sm text-white/60">
              <CheckCircle2 className="inline h-4 w-4 mr-1" />
              免费下载 · 注册即用 · 数据同步
            </p>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="py-10 border-t">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="md" />
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} gujia.app 版权所有
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">返回首页</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">登录</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
