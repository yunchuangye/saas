import Link from "next/link"
import { GuestValuationWidget } from "@/components/home/guest-valuation-widget"
import {
  Building2, TrendingUp, Shield, Users, Star, ArrowRight,
  CheckCircle, Landmark, FileText, BarChart3, Clock, Award,
  ChevronRight, MapPin, Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── 导航栏 ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">估价云</span>
              <span className="hidden sm:inline-block text-xs text-muted-foreground ml-1">专业房产估价平台</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">功能特色</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">使用流程</a>
              <a href="#partners" className="text-sm text-muted-foreground hover:text-foreground transition-colors">合作机构</a>
            </nav>
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-sm">登录</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="text-sm rounded-lg shadow-sm">免费注册</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero 区域 ─────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* 背景图片 + 渐变遮罩 */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&q=80&auto=format&fit=crop"
            alt="城市建筑背景"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/30" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* 左侧文案 */}
            <div className="text-white space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-sm font-medium backdrop-blur-sm">
                <Zap className="h-3.5 w-3.5 text-yellow-300" />
                AI 驱动 · 秒级出价 · 精准到元
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                房产估价
                <span className="block text-yellow-300">一键搞定</span>
              </h1>
              <p className="text-lg text-white/80 leading-relaxed max-w-lg">
                基于 <strong className="text-white">217万+</strong> 真实成交案例，AI 智能估价引擎为您的房产出具精准估值，
                并对接全国 <strong className="text-white">银行贷款</strong> 与 <strong className="text-white">专业评估机构</strong>，一站式服务。
              </p>
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: CheckCircle, text: "游客免费估价" },
                  { icon: CheckCircle, text: "精准到元，非区间" },
                  { icon: CheckCircle, text: "对接银行贷款" },
                  { icon: CheckCircle, text: "权威评估报告" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-1.5 text-sm text-white/90">
                    <item.icon className="h-4 w-4 text-emerald-400 shrink-0" />
                    {item.text}
                  </div>
                ))}
              </div>
              {/* 数据指标 */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
                {[
                  { value: "217万+", label: "真实案例" },
                  { value: "92%", label: "估价准确率" },
                  { value: "3秒", label: "出价速度" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-white/60 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧估价工具卡片 */}
            <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
              <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-3xl shadow-2xl shadow-black/20 p-6 border border-white/50">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground">一键免费估价</h2>
                      <p className="text-xs text-muted-foreground">填写信息，秒出精准估价</p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200">
                    免费
                  </span>
                </div>
                <GuestValuationWidget />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 功能特色 ─────────────────────────────────────── */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">为什么选择估价云</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              专业、精准、高效的房产估价服务，让每一笔房产交易都有据可依
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                color: "bg-yellow-100 text-yellow-600",
                title: "秒级精准估价",
                desc: "AI 算法实时分析周边成交数据，3 秒内输出精准估价数字，不是区间，是精确到元的数值。",
              },
              {
                icon: Building2,
                color: "bg-blue-100 text-blue-600",
                title: "楼盘级精准匹配",
                desc: "支持按楼盘名称搜索，基于该楼盘的真实成交案例进行估价，准确率高达 92%。",
              },
              {
                icon: Landmark,
                color: "bg-primary/10 text-primary",
                title: "对接银行贷款",
                desc: "估价完成后可直接对接平台合作银行，在线发起贷款申请，全程跟踪审批进度。",
              },
              {
                icon: FileText,
                color: "bg-emerald-100 text-emerald-600",
                title: "权威评估报告",
                desc: "平台认证的专业评估机构，可出具具有法律效力的房产评估报告，满足银行、法院等需求。",
              },
              {
                icon: Shield,
                color: "bg-purple-100 text-purple-600",
                title: "数据安全可靠",
                desc: "所有估价数据来源于真实成交记录，经过多重验证，确保数据的真实性和可靠性。",
              },
              {
                icon: Users,
                color: "bg-orange-100 text-orange-600",
                title: "一站式服务",
                desc: "从免费估价到贷款申请、评估报告，全流程在线完成，注册会员享受更多专属服务。",
              },
            ].map((feature) => (
              <div key={feature.title}
                className="bg-card rounded-2xl p-6 border border-border/50 hover:shadow-md hover:border-primary/20 transition-all group">
                <div className={`h-12 w-12 rounded-2xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 使用流程 ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">简单三步，完成估价</h2>
            <p className="text-muted-foreground mt-3">无需注册，游客即可免费使用</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* 连接线 */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30" />
            {[
              {
                step: "01",
                icon: MapPin,
                title: "填写房产信息",
                desc: "选择城市、区域，搜索楼盘名称，填写面积、楼层等基本信息",
                color: "bg-blue-50 border-blue-200",
                iconColor: "bg-blue-100 text-blue-600",
              },
              {
                step: "02",
                icon: BarChart3,
                title: "AI 智能估价",
                desc: "系统自动匹配周边成交案例，AI 算法综合计算，3 秒输出精准估价",
                color: "bg-primary/5 border-primary/20",
                iconColor: "bg-primary/10 text-primary",
              },
              {
                step: "03",
                icon: ArrowRight,
                title: "对接专业服务",
                desc: "根据需求选择银行贷款或评估报告，注册会员后一键发起申请",
                color: "bg-emerald-50 border-emerald-200",
                iconColor: "bg-emerald-100 text-emerald-600",
              },
            ].map((step, idx) => (
              <div key={step.step} className={`relative rounded-2xl border-2 ${step.color} p-6 text-center`}>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow-md">
                  {idx + 1}
                </div>
                <div className={`h-14 w-14 rounded-2xl ${step.iconColor} flex items-center justify-center mx-auto mb-4 mt-2`}>
                  <step.icon className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 合作机构展示 ─────────────────────────────────── */}
      <section id="partners" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">合作机构</h2>
            <p className="text-muted-foreground mt-3">与全国主要银行及专业评估机构深度合作</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* 合作银行 */}
            <div className="bg-card rounded-2xl border border-border/50 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Landmark className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">合作银行</h3>
                  <p className="text-xs text-muted-foreground">提供房产抵押贷款服务</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {["工商银行", "中国银行", "建设银行", "农业银行", "招商银行", "兴业银行"].map((bank) => (
                  <div key={bank} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border/50">
                    <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">{bank[0]}</span>
                    </div>
                    <span className="text-sm font-medium truncate">{bank}</span>
                  </div>
                ))}
              </div>
              <Link href="/register?role=customer" className="mt-4 flex items-center justify-center gap-1 text-sm text-primary hover:underline">
                查看全部合作银行 <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            {/* 评估机构 */}
            <div className="bg-card rounded-2xl border border-border/50 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">认证评估机构</h3>
                  <p className="text-xs text-muted-foreground">出具权威评估报告</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { name: "中企华资产评估", rating: 4.9, cases: "2,300+" },
                  { name: "戴德梁行评估", rating: 4.8, cases: "1,800+" },
                  { name: "仲量联行评估", rating: 4.8, cases: "1,500+" },
                ].map((org) => (
                  <div key={org.name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/50 border border-border/50">
                    <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">{org.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{org.name}</p>
                      <p className="text-xs text-muted-foreground">已完成 {org.cases} 份报告</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold">{org.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/register?role=customer" className="mt-4 flex items-center justify-center gap-1 text-sm text-primary hover:underline">
                查看全部评估机构 <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 用户评价 ─────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">用户真实评价</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "张先生",
                role: "房产投资者",
                avatar: "张",
                rating: 5,
                comment: "估价结果非常准确，和我最终成交价只差了 2 万元。对接银行贷款也很方便，全程在线完成。",
              },
              {
                name: "李女士",
                role: "首套房购房者",
                avatar: "李",
                rating: 5,
                comment: "第一次买房，不知道该出多少价。用估价云一查，心里有底了。推荐给了好几个朋友。",
              },
              {
                name: "王总",
                role: "企业主",
                avatar: "王",
                rating: 5,
                comment: "公司需要出具评估报告用于融资，平台对接的评估机构很专业，报告出具速度也快。",
              },
            ].map((review) => (
              <div key={review.name} className="bg-card rounded-2xl border border-border/50 p-6 hover:shadow-md transition-all">
                <div className="flex items-center gap-0.5 mb-4">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{review.comment}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {review.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{review.name}</p>
                    <p className="text-xs text-muted-foreground">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA 区域 ─────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80&auto=format&fit=crop"
            alt="房产背景"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/85" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">立即体验免费估价</h2>
          <p className="text-white/80 mb-8 text-lg">
            无需注册，填写房产信息即可获得精准估价。注册会员后可对接银行贷款和评估机构。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#top">
              <Button size="lg" variant="secondary" className="h-12 px-8 text-base font-semibold rounded-xl shadow-lg">
                立即免费估价
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </a>
            <Link href="/register">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold rounded-xl border-white/30 text-white hover:bg-white/10">
                注册会员
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 页脚 ─────────────────────────────────────────── */}
      <footer className="border-t border-border/50 bg-muted/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">估价云</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                专业的房产估价平台，基于 AI 技术和海量真实成交数据，为您提供精准、快速的房产估价服务。
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">快速入口</h4>
              <ul className="space-y-2">
                {["免费估价", "银行贷款", "评估报告", "注册会员"].map((item) => (
                  <li key={item}>
                    <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm">机构入驻</h4>
              <ul className="space-y-2">
                {["银行机构入驻", "评估机构入驻", "投资机构入驻", "联系我们"].map((item) => (
                  <li key={item}>
                    <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 mt-8 pt-6 text-center text-xs text-muted-foreground">
            © 2026 估价云. 保留所有权利. 估价结果仅供参考，不构成投资建议。
          </div>
        </div>
      </footer>
    </div>
  )
}
