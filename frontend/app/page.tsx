import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { InstantValuation } from "@/components/home/instant-valuation"
import {
  CheckCircle2,
  ArrowRight,
  Star,
  MapPin,
  Landmark,
  Building,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "GuJia.App - 一键免费估价 | 房产评估专业平台",
  description: "免费获取房产精准估值，对接银行贷款和专业评估机构，让房产交易更简单",
}

// 左侧 AI 三大核心能力（显示为数字+单行描述）
const aiStats = [
  { value: "98.6%", label: "AI估价准确率" },
  { value: "12+",   label: "专业数据模型" },
  { value: "50K+",  label: "日处理房产数" },
  { value: "<3s",   label: "秒级返回结果" },
]

// 合作评估公司
const appraisalCompanies = [
  { name: "中诚信评估", location: "北京", projects: 2580, rating: 4.9, specialty: "住宅评估" },
  { name: "戴德梁行",   location: "上海", projects: 3420, rating: 4.8, specialty: "商业地产" },
  { name: "世联评估",   location: "深圳", projects: 4150, rating: 4.9, specialty: "综合评估" },
  { name: "仲量联行",   location: "广州", projects: 2890, rating: 4.7, specialty: "工业地产" },
  { name: "第一太平戴维斯", location: "成都", projects: 1680, rating: 4.8, specialty: "商业综合体" },
  { name: "高力国际",   location: "杭州", projects: 2210, rating: 4.6, specialty: "写字楼评估" },
]

// 合作银行
const bankPartners = [
  { name: "中国银行", projects: 12500 },
  { name: "工商银行", projects: 18900 },
  { name: "建设银行", projects: 15600 },
  { name: "农业银行", projects: 11200 },
  { name: "交通银行", projects: 7800 },
  { name: "招商银行", projects: 9500 },
  { name: "浦发银行", projects: 6200 },
  { name: "民生银行", projects: 5400 },
]

// 用户评价
const testimonials = [
  {
    content: "估价非常准确，和最终成交价只差了2%，而且操作很简单，几分钟就出结果了。",
    author: "张先生",
    role: "北京 | 个人用户",
    rating: 5,
    avatar: "/images/avatar-1.jpg",
  },
  {
    content: "通过平台找到了利率最优惠的银行，贷款流程也很顺利，省了不少事。",
    author: "李女士",
    role: "上海 | 个人用户",
    rating: 5,
    avatar: "/images/avatar-2.jpg",
  },
  {
    content: "评估报告出得很快，评估师也很专业，银行一次就通过了。",
    author: "王先生",
    role: "深圳 | 个人用户",
    rating: 5,
    avatar: "/images/avatar-3.jpg",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── 导航栏 ── */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex h-18 lg:h-20 items-center justify-between">
          <Logo size="md" className="lg:hidden" />
          <Logo size="lg" className="hidden lg:flex" />

          <nav className="hidden lg:flex items-center gap-10">
            {[
              { href: "#valuation", label: "免费估价", highlight: true },
              { href: "#partners",  label: "合作机构" },
              { href: "#about",     label: "关于我们" },
            ].map(({ href, label, highlight }) => (
              <Link
                key={href}
                href={href}
                className={`text-base font-semibold transition-colors hover:text-primary ${
                  highlight ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/app-download"
              className="flex items-center gap-1.5 text-base font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 18V6M12 18l-4-4m4 4l4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              APP下载
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block">
              <Button variant="outline" size="lg" className="h-11 px-6 text-base font-semibold">登录</Button>
            </Link>
            <Link href="/register">
              <Button size="lg" className="h-11 px-6 text-base font-semibold">
                <span className="hidden sm:inline">免费注册</span>
                <span className="sm:hidden">注册</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero 区域 ── */}
      <section id="valuation" className="relative overflow-hidden">
        {/* 纯渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A1628] via-[#0D2847] to-[#1a365d]" />
        {/* 装饰性光晕 */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-teal-500/5 blur-[150px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* ── 左侧内容 ── */}
            <div className="text-white">
              {/* 标签行 */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <Badge className="bg-cyan-500/20 text-cyan-100 border-cyan-500/30 text-sm px-4 py-1.5">
                  <Sparkles className="h-4 w-4 mr-2" />
                  OpenClaw AI 驱动
                </Badge>
                <Badge className="bg-white/10 text-white/90 border-white/20 text-sm px-4 py-1.5">
                  98.6% 准确率
                </Badge>
              </div>

              {/* 主标题 */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                一键免费估价
              </h1>
              <p className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-300 to-sky-300 bg-clip-text text-transparent">
                精准到每一平米
              </p>
              <p className="mt-6 text-lg sm:text-xl text-white/65 leading-relaxed max-w-lg">
                输入房产信息，AI秒级返回精准估值，可直接申请银行贷款或委托专业机构出具评估报告。
              </p>

              {/* 三大核心卖点 */}
              <div className="mt-10 grid grid-cols-3 gap-5">
                {[
                  { Icon: Zap,      title: "AI智能估价", sub: "秒级响应" },
                  { Icon: Landmark, title: "银行直连",   sub: "50+合作银行" },
                  { Icon: Shield,   title: "专业评估",   sub: "200+认证机构" },
                ].map(({ Icon, title, sub }) => (
                  <div key={title} className="flex flex-col gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/8 border border-white/12 flex items-center justify-center">
                      <Icon className="h-7 w-7 text-cyan-300" />
                    </div>
                    <div className="text-lg font-semibold text-white">{title}</div>
                    <div className="text-sm text-white/50">{sub}</div>
                  </div>
                ))}
              </div>

              {/* AI 指标数据 — 统一数字格式，避免"全国/每周"混入 */}
              <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-4 gap-6">
                {aiStats.map(({ value, label }) => (
                  <div key={label}>
                    <div className="text-3xl sm:text-4xl font-bold text-white tabular-nums">{value}</div>
                    <div className="mt-2 text-sm text-white/50 leading-snug">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 右侧估价表单 ── */}
            <div className="lg:sticky lg:top-24">
              <InstantValuation />
            </div>
          </div>
        </div>
      </section>

      {/* ── 用户评价 ── */}
      <section className="w-full py-16 sm:py-20 bg-muted/30">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">用户真实评价</h2>
            <p className="mt-3 text-lg text-muted-foreground">听听他们怎么说</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="flex items-center gap-1.5 mb-6">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed">"{t.content}"</p>
                  <div className="mt-8 pt-6 border-t flex items-center gap-4">
                    <img 
                      src={t.avatar} 
                      alt={t.author}
                      className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                    />
                    <div>
                      <div className="text-lg font-bold">{t.author}</div>
                      <div className="text-base text-muted-foreground mt-0.5">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── 合作伙伴 ── */}
      <section id="partners" className="w-full py-16 sm:py-20">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-sm px-4 py-1.5">合作伙伴</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-balance">
              携手行业领军者
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              与全国顶尖金融机构和评估公司建立深度合作
            </p>
          </div>

          {/* 银行 */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <Landmark className="h-6 w-6 text-primary" />
              <h3 className="text-2xl sm:text-3xl font-bold">合作银行机构</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {bankPartners.map((bank) => (
                <Card key={bank.name} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center h-13 w-13 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white font-bold text-lg shrink-0 aspect-square" style={{ width: 52, height: 52 }}>
                        {bank.name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-lg font-bold truncate">{bank.name}</h4>
                        <p className="text-base text-muted-foreground mt-1">
                          {bank.projects.toLocaleString()}+ 项目
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* 评估公司 */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Building className="h-6 w-6 text-primary" />
              <h3 className="text-2xl sm:text-3xl font-bold">认证评估公司</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {appraisalCompanies.map((company) => (
                <Card key={company.name} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white font-bold text-lg shrink-0" style={{ width: 52, height: 52 }}>
                          {company.name.slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold">{company.name}</h4>
                          <div className="flex items-center gap-1.5 text-base text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4" />
                            {company.location}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <span className="text-base font-semibold">{company.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-5 pt-4 border-t">
                      <span className="text-base text-muted-foreground">{company.projects.toLocaleString()}+ 项目</span>
                      <Badge variant="secondary" className="text-sm px-3 py-1">{company.specialty}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 关于我们 ── */}
      <section id="about" className="w-full py-16 sm:py-20 bg-muted/30">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <Badge variant="outline" className="mb-5 text-sm px-4 py-1.5">关于我们</Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-balance leading-tight">
                让房产估价更简单
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                GuJia.App 是专业的房地产评估数字化平台，致力于通过AI技术让房产估价变得简单、精准、高效。我们连接银行、评估公司与个人用户，打造一站式房产服务生态。
              </p>
              <div className="mt-8 space-y-5">
                {[
                  { title: "免费估价服务", desc: "无需注册即可使用AI智能估价，快速了解房产价值" },
                  { title: "银行直连申贷", desc: "注册会员后可向合作银行直接发起贷款申请" },
                  { title: "专业评估报告", desc: "对接认证评估机构，快速出具正式评估报告" },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-lg font-bold">{title}</h4>
                      <p className="text-base text-muted-foreground mt-1">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Link href="/login">
                  <Button size="lg" className="h-12 px-8 text-base font-semibold">
                    立即注册体验
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* 指标卡片 */}
            <div className="grid grid-cols-2 gap-5">
              {[
                { value: "98.6%", label: "AI估价准确率" },
                { value: "<3s",   label: "平均响应时间" },
                { value: "125万+", label: "服务用户数" },
                { value: "800亿+", label: "累计评估金额" },
              ].map(({ value, label }) => (
                <Card key={label} className="p-7 text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-primary">{value}</div>
                  <div className="text-base text-muted-foreground mt-3">{label}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="w-full py-20 sm:py-24 bg-gradient-to-br from-[#0A2540] via-[#0D3158] to-[#1E3A8A]">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-4xl sm:text-5xl font-bold text-balance">
              开始您的房产估价之旅
            </h2>
            <p className="mt-6 text-xl sm:text-2xl text-white/75">
              免费使用AI估价，或注册会员享受更多服务
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link href="#valuation">
                <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-lg font-bold bg-white text-primary hover:bg-white/90">
                  立即估价
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-lg font-bold bg-cyan-500 hover:bg-cyan-400 text-white">
                  注册会员
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 页脚 ── */}
      <footer className="w-full py-12 sm:py-16 border-t">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="col-span-2">
              <Logo size="md" className="sm:hidden" />
              <Logo size="lg" className="hidden sm:flex" />
              <p className="mt-5 text-base text-muted-foreground max-w-md leading-relaxed">
                GuJia.App 是专业的房地产评估数字化协作平台，致力于为银行、评估公司和客户提供高效、透明、专业的评估服务解决方案。
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-5">产品服务</h4>
              <ul className="space-y-4 text-base text-muted-foreground">
                <li><Link href="#valuation" className="hover:text-foreground transition-colors">免费估价</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">银行贷款</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">评估报告</Link></li>
                <li><Link href="/app-download" className="hover:text-foreground transition-colors">APP下载</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-5">关于平台</h4>
              <ul className="space-y-4 text-base text-muted-foreground">
                <li><Link href="#about" className="hover:text-foreground transition-colors">关于我们</Link></li>
                <li><Link href="#partners" className="hover:text-foreground transition-colors">合作伙伴</Link></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">注册登录</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">联系我们</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-base text-muted-foreground text-center">
            © 2024 GuJia.App. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  )
}
