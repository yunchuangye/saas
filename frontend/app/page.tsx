import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { GuestValuationWidget } from "@/components/home/guest-valuation-widget"
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  Star,
  Landmark,
  Building,
  TrendingUp,
  Shield,
  Zap,
  Users,
  FileText,
  ChevronRight,
  Calculator,
  Database,
  Clock,
} from "lucide-react"

export const metadata = {
  title: "gujia.app - 房产免费估价平台",
  description: "一键免费估价，基于217万+真实成交案例，AI智能估价引擎，精准评估您的房产价值",
}

const stats = [
  { label: "真实成交案例", value: "217万+", icon: Database },
  { label: "合作银行机构", value: "50+", icon: Landmark },
  { label: "认证评估公司", value: "200+", icon: Building2 },
  { label: "估价准确率", value: "92%", icon: TrendingUp },
]

const serviceSteps = [
  { step: "01", title: "免费估价", desc: "填写房产信息，AI 引擎秒出精准估价", icon: Calculator, color: "bg-blue-100 text-blue-600" },
  { step: "02", title: "选择服务", desc: "按需选择贷款银行或评估机构", icon: Building, color: "bg-purple-100 text-purple-600" },
  { step: "03", title: "注册发起", desc: "免费注册，在线发起需求申请", icon: Users, color: "bg-green-100 text-green-600" },
  { step: "04", title: "全程跟踪", desc: "实时查看进度，在线沟通协作", icon: Clock, color: "bg-orange-100 text-orange-600" },
]

const advantages = [
  { icon: Zap, title: "秒级出价", desc: "基于 217 万+ 真实成交案例，AI 引擎毫秒级计算，告别漫长等待", color: "text-yellow-500", bg: "bg-yellow-50" },
  { icon: Shield, title: "精准可信", desc: "三大评估方法综合加权，市场比较法+收益法+成本法，92% 准确率", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: Building2, title: "机构直连", desc: "直连 50+ 银行、200+ 评估公司，一键发起需求，省去中间环节", color: "text-green-500", bg: "bg-green-50" },
  { icon: FileText, title: "全程数字化", desc: "从估价到报告交付，全流程在线，进度实时可见，资料永久存档", color: "text-purple-500", bg: "bg-purple-50" },
]

const bankPartners = [
  { name: "中国银行", abbr: "BOC" },
  { name: "工商银行", abbr: "ICBC" },
  { name: "建设银行", abbr: "CCB" },
  { name: "农业银行", abbr: "ABC" },
  { name: "招商银行", abbr: "CMB" },
  { name: "浦发银行", abbr: "SPDB" },
  { name: "民生银行", abbr: "CMBC" },
  { name: "光大银行", abbr: "CEB" },
]

const appraiserPartners = [
  { name: "中诚信评估", specialty: "住宅评估", rating: 4.9 },
  { name: "戴德梁行", specialty: "商业地产", rating: 4.8 },
  { name: "世联评估", specialty: "综合评估", rating: 4.9 },
  { name: "高力国际", specialty: "写字楼", rating: 4.7 },
  { name: "第一太平戴维斯", specialty: "商业综合体", rating: 4.8 },
  { name: "仲量联行", specialty: "工业地产", rating: 4.7 },
]

const testimonials = [
  { name: "张先生", role: "购房者", city: "北京", content: "用了 gujia.app 的免费估价，5 秒就出了精准数字，比我自己查二手房网站准多了，最终贷款也顺利通过了。", rating: 5 },
  { name: "李女士", role: "房产投资者", city: "上海", content: "平台上的评估机构都有资质认证，报告质量很高，银行也认可。以前找评估公司要跑好几家，现在一个平台全搞定。", rating: 5 },
  { name: "王总", role: "企业主", city: "深圳", content: "公司厂房需要评估抵押，通过平台找到了专业的工业地产评估机构，3 天出报告，效率比以前快了一倍。", rating: 5 },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* 导航栏 */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex h-14 sm:h-16 items-center justify-between">
          <Logo size="md" />
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">如何使用</Link>
            <Link href="#advantages" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">平台优势</Link>
            <Link href="#partners" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">合作机构</Link>
            <Link href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">用户评价</Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block">
              <Button variant="outline" size="sm" className="text-sm font-medium">登录</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="text-sm font-medium">免费注册</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero 区域 */}
      <section className="w-full bg-gradient-to-b from-primary/5 via-background to-background pt-8 pb-12 sm:pt-12 sm:pb-16">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
            {/* 左侧文案 */}
            <div className="space-y-6">
              <div>
                <Badge variant="outline" className="mb-4 text-xs px-3 py-1">
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                  AI 智能估价引擎 · 实时运行中
                </Badge>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-balance">
                  您的房产，<br />
                  <span className="text-primary">精准估价</span>，免费获取
                </h1>
                <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                  基于 <strong>217万+</strong> 真实成交案例，采用市场比较法、收益法、成本法三重验证，
                  秒级输出精准估价数字，无需注册即可免费使用。
                </p>
              </div>

              {/* 数据统计 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map((s) => {
                  const Icon = s.icon
                  return (
                    <div key={s.label} className="rounded-xl border bg-card p-3 text-center">
                      <Icon className="h-5 w-5 mx-auto mb-1.5 text-primary" />
                      <div className="text-xl font-bold text-primary">{s.value}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                    </div>
                  )
                })}
              </div>

              {/* 特性标签 */}
              <div className="flex flex-wrap gap-2">
                {["无需注册即可估价", "精准数字非区间", "符合国家评估规范", "数据实时更新", "支持全国主要城市"].map((tag) => (
                  <span key={tag} className="flex items-center gap-1 text-xs bg-muted rounded-full px-3 py-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {tag}
                  </span>
                ))}
              </div>

              {/* 机构入口 */}
              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-3">您是机构用户？</p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/register?role=bank">
                    <Button variant="outline" size="sm" className="text-sm gap-1.5">
                      <Landmark className="h-3.5 w-3.5" />银行机构入驻
                    </Button>
                  </Link>
                  <Link href="/register?role=appraiser">
                    <Button variant="outline" size="sm" className="text-sm gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />评估公司入驻
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="text-sm text-muted-foreground">已有账号登录 →</Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* 右侧估价工具 */}
            <div className="lg:sticky lg:top-24">
              <Card className="shadow-2xl border-primary/10">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                      <Calculator className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold">一键免费估价</h2>
                      <p className="text-xs text-muted-foreground">填写信息，秒出精准估价</p>
                    </div>
                    <Badge className="ml-auto text-xs bg-green-100 text-green-700 border-0">免费</Badge>
                  </div>
                  <GuestValuationWidget />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 使用流程 */}
      <section id="how-it-works" className="w-full py-12 sm:py-16 bg-muted/30">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-xs px-3 py-1">使用流程</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">四步完成房产估价与服务申请</h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base">从估价到服务，全程线上，最快当天完成</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceSteps.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.step} className="relative flex flex-col items-center text-center">
                  {i < serviceSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] h-px border-t-2 border-dashed border-border" />
                  )}
                  <div className={`h-20 w-20 rounded-2xl ${s.color} flex items-center justify-center mb-4 relative`}>
                    <Icon className="h-9 w-9" />
                    <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  </div>
                  <h3 className="font-semibold text-base mb-1.5">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 平台优势 */}
      <section id="advantages" className="w-full py-12 sm:py-16">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-xs px-3 py-1">核心优势</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">为什么选择 gujia.app</h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base">专业、精准、高效，重新定义房产估价体验</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {advantages.map((a) => {
              const Icon = a.icon
              return (
                <Card key={a.title} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className={`h-12 w-12 rounded-xl ${a.bg} flex items-center justify-center mb-4`}>
                      <Icon className={`h-6 w-6 ${a.color}`} />
                    </div>
                    <h3 className="font-semibold text-base mb-2">{a.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* 合作机构 */}
      <section id="partners" className="w-full py-12 sm:py-16 bg-muted/30">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-xs px-3 py-1">合作机构</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">与行业顶尖机构深度合作</h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base">50+ 银行机构、200+ 评估公司，覆盖全国主要城市</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Landmark className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-base">合作银行</h3>
                <Badge variant="secondary" className="text-xs">50+</Badge>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {bankPartners.map((b) => (
                  <div key={b.name} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border bg-card hover:border-primary/30 hover:shadow-sm transition-all">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{b.abbr}</span>
                    </div>
                    <span className="text-xs text-center text-muted-foreground leading-tight">{b.name}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-center">
                <Link href="/register?role=bank">
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                    银行机构入驻 <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-base">认证评估机构</h3>
                <Badge variant="secondary" className="text-xs">200+</Badge>
              </div>
              <div className="space-y-2">
                {appraiserPartners.map((a) => (
                  <div key={a.name} className="flex items-center justify-between p-3 rounded-xl border bg-card hover:border-primary/30 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.specialty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{a.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-center">
                <Link href="/register?role=appraiser">
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                    评估公司入驻 <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 用户评价 */}
      <section id="testimonials" className="w-full py-12 sm:py-16">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-xs px-3 py-1">用户评价</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">真实用户的真实反馈</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-0.5 mb-3">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} className={`h-4 w-4 ${i <= t.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.content}"</p>
                  <div className="flex items-center gap-2 pt-3 border-t">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{t.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role} · {t.city}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-12 sm:py-16 bg-primary">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">立即体验免费估价</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto text-sm sm:text-base">
            无需注册，填写房产信息即可获取精准估价。注册后可一键发起贷款或评估申请，享受完整服务。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="font-semibold px-8">
                免费注册，发起申请 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="font-semibold px-8 border-white/30 text-white hover:bg-white/10">
                已有账号登录
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="w-full py-8 border-t bg-muted/30">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/login" className="hover:text-primary transition-colors">登录</Link>
              <Link href="/register" className="hover:text-primary transition-colors">注册</Link>
              <Link href="/register?role=bank" className="hover:text-primary transition-colors">银行入驻</Link>
              <Link href="/register?role=appraiser" className="hover:text-primary transition-colors">评估公司入驻</Link>
            </div>
            <p className="text-xs text-muted-foreground">© 2026 gujia.app · 有态度的估价专业平台</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
