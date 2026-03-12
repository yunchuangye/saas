import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { HeroCarousel } from "@/components/home/hero-carousel"
import {
  Building2,
  Clock,
  CheckCircle2,
  ArrowRight,
  Star,
  MapPin,
  Calendar,
  Landmark,
  Building,
  ChevronRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "gujia.app - 有态度的估价专业平台",
  description: "连接银行、评估公司与客户，提供高效、透明、专业的房地产评估数字化解决方案",
}

// 平台优势
const advantages = [
  {
    image: "/images/advantage-efficiency.jpg",
    title: "效率提升300%",
    description: "数字化流程替代传统纸质流转，评估周期从15天缩短至5天",
    metric: "5天",
    metricLabel: "平均完成周期",
  },
  {
    image: "/images/advantage-tracking.jpg",
    title: "全程可追溯",
    description: "从需求发起到报告交付，每个环节都有完整的操作记录和时间戳",
    metric: "100%",
    metricLabel: "过程透明度",
  },
  {
    image: "/images/advantage-ai.jpg",
    title: "智能估价引擎",
    description: "基于海量交易数据的AI估价模型，快速生成参考价格区间",
    metric: "92%",
    metricLabel: "估价准确率",
  },
  {
    image: "/images/advantage-collaboration.jpg",
    title: "多方高效协同",
    description: "银行、评估公司、客户三方在线协作，消除信息不对称",
    metric: "50+",
    metricLabel: "合作机构",
  },
]

// 解决的问题
const problems = [
  {
    image: "/images/solution-1.jpg",
    title: "全流程可视化",
    before: "评估流程不透明，进度难以追踪",
    after: "实时掌握项目状态，每个环节清晰可见",
  },
  {
    image: "/images/solution-2.jpg",
    title: "电子报告管理",
    before: "纸质报告传递慢，容易丢失损坏",
    after: "电子报告秒级送达，永久安全存储",
  },
  {
    image: "/images/solution-3.jpg",
    title: "智能择优推荐",
    before: "评估公司选择难，质量参差不齐",
    after: "资质认证体系，评分择优推荐",
  },
  {
    image: "/images/solution-4.jpg",
    title: "在线即时沟通",
    before: "沟通成本高，反复确认耗时",
    after: "消息实时送达，历史记录可查",
  },
  {
    image: "/images/solution-5.jpg",
    title: "智能数据分析",
    before: "数据分散管理，统计分析困难",
    after: "一站式数据中心，智能报表分析",
  },
  {
    image: "/images/solution-6.jpg",
    title: "合规审计保障",
    before: "合规风险大，难以满足监管要求",
    after: "标准化流程，完整审计日志",
  },
]

// 合作评估公司
const appraisalCompanies = [
  { name: "中诚信评估", location: "北京", projects: 2580, rating: 4.9, specialty: "住宅评估" },
  { name: "戴德梁行", location: "上海", projects: 3420, rating: 4.8, specialty: "商业地产" },
  { name: "世联评估", location: "深圳", projects: 4150, rating: 4.9, specialty: "综合评估" },
  { name: "仲量联行", location: "广州", projects: 2890, rating: 4.7, specialty: "工业地产" },
  { name: "第一太平戴维斯", location: "成都", projects: 1680, rating: 4.8, specialty: "商业综合体" },
  { name: "高力国际", location: "杭州", projects: 2210, rating: 4.6, specialty: "写字楼评估" },
]

// 合作银行
const bankPartners = [
  { name: "中国银行", branches: 156, projects: 12500 },
  { name: "工商银行", branches: 203, projects: 18900 },
  { name: "建设银行", branches: 178, projects: 15600 },
  { name: "农业银行", branches: 145, projects: 11200 },
  { name: "交通银行", branches: 89, projects: 7800 },
  { name: "招商银行", branches: 112, projects: 9500 },
  { name: "浦发银行", branches: 76, projects: 6200 },
  { name: "民生银行", branches: 68, projects: 5400 },
]

// 评估案例
const cases = [
  {
    id: "CASE-2024-001",
    title: "北京朝阳区某高端住宅项目",
    type: "住宅评估",
    area: "325.6平方米",
    value: "2,850万元",
    date: "2024-01-15",
    bank: "中国银行",
    company: "中诚信评估",
    duration: "4天",
  },
  {
    id: "CASE-2024-002",
    title: "上海浦东新区商业综合体",
    type: "商业评估",
    area: "12,500平方米",
    value: "3.2亿元",
    date: "2024-01-12",
    bank: "工商银行",
    company: "戴德梁行",
    duration: "6天",
  },
  {
    id: "CASE-2024-003",
    title: "深圳南山区科技园写字楼",
    type: "写字楼评估",
    area: "8,200平方米",
    value: "1.8亿元",
    date: "2024-01-10",
    bank: "建设银行",
    company: "世联评估",
    duration: "5天",
  },
  {
    id: "CASE-2024-004",
    title: "杭州西湖区别墅群",
    type: "住宅评估",
    area: "1,680平方米",
    value: "8,500万元",
    date: "2024-01-08",
    bank: "招商银行",
    company: "高力国际",
    duration: "5天",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* 导航栏 */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex h-14 sm:h-16 lg:h-20 items-center justify-between">
          <Logo size="md" className="lg:hidden" />
          <Logo size="lg" className="hidden lg:flex" />
          <nav className="hidden lg:flex items-center gap-10">
            <Link
              href="#advantages"
              className="text-base font-semibold text-muted-foreground hover:text-primary transition-colors relative group"
            >
              平台优势
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link
              href="#solutions"
              className="text-base font-semibold text-muted-foreground hover:text-primary transition-colors relative group"
            >
              解决方案
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link
              href="#partners"
              className="text-base font-semibold text-muted-foreground hover:text-primary transition-colors relative group"
            >
              合作伙伴
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link
              href="#cases"
              className="text-base font-semibold text-muted-foreground hover:text-primary transition-colors relative group"
            >
              评估案例
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link
              href="/app-download"
              className="text-base font-semibold text-primary hover:text-primary/80 transition-colors relative group flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 18V6M12 18l-4-4m4 4l4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              APP下载
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary" />
            </Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block">
              <Button variant="outline" size="sm" className="sm:size-default text-sm sm:text-base font-semibold px-3 sm:px-6">登录</Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="sm:size-default text-sm sm:text-base font-semibold px-3 sm:px-6">
                <span className="hidden sm:inline">免费体验</span>
                <span className="sm:hidden">登录</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero 轮播区域 */}
      <HeroCarousel />

      {/* 平台优势 */}
      <section id="advantages" className="w-full py-10 sm:py-16 bg-muted/30">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
            <Badge variant="outline" className="mb-3 sm:mb-4 text-sm sm:text-base px-3 sm:px-4 py-1">核心优势</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-balance">
              为什么选择 gujia.app
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-xl text-muted-foreground">
              我们用技术重新定义房地产评估行业，让专业更高效
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {advantages.map((item) => (
              <Card key={item.title} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative h-36 sm:h-48 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                    <h3 className="text-base sm:text-xl font-bold text-white drop-shadow-lg">{item.title}</h3>
                  </div>
                </div>
                <CardContent className="p-4 sm:p-6">
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed line-clamp-2 sm:line-clamp-none">
                    {item.description}
                  </p>
                  <div className="pt-4 sm:pt-5 border-t">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">{item.metric}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">{item.metricLabel}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 解决的问题 */}
      <section id="solutions" className="w-full py-10 sm:py-16">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
            <Badge variant="outline" className="mb-3 sm:mb-6 text-sm sm:text-base px-3 sm:px-4 py-1">解决方案</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-balance">
              告别传统评估的痛点
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-xl text-muted-foreground">
              我们深入理解行业困境，用数字化方案一一破解
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {problems.map((problem, index) => (
              <Card key={index} className="overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative h-36 sm:h-48 overflow-hidden">
                  <img
                    src={problem.image}
                    alt={problem.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                    <span className="text-xs font-medium text-white/80 bg-white/20 backdrop-blur-sm px-2 py-0.5 sm:py-1 rounded">0{index + 1}</span>
                    <h3 className="text-base sm:text-xl font-bold text-white mt-1 sm:mt-2">{problem.title}</h3>
                  </div>
                </div>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="shrink-0 text-xs text-destructive font-semibold bg-destructive/10 px-1.5 sm:px-2 py-0.5 rounded">痛点</span>
                      <p className="text-xs sm:text-sm text-muted-foreground">{problem.before}</p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="shrink-0 text-xs text-primary font-semibold bg-primary/10 px-1.5 sm:px-2 py-0.5 rounded">方案</span>
                      <p className="text-xs sm:text-sm font-medium text-foreground">{problem.after}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 合作伙伴 */}
      <section id="partners" className="w-full py-10 sm:py-16 bg-muted/30">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-16">
            <Badge variant="outline" className="mb-3 sm:mb-6 text-sm sm:text-base px-3 sm:px-4 py-1">合作伙伴</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-balance">
              携手行业领军者
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-xl text-muted-foreground">
              与全国顶尖金融机构和评估公司建立深度合作
            </p>
          </div>

          {/* 银行合作伙伴 */}
          <div className="mb-10 sm:mb-20">
            <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-10">
              <Landmark className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
              <h3 className="text-lg sm:text-2xl font-bold">合作银行机构</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
              {bankPartners.map((bank) => (
                <Card key={bank.name} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="flex items-center justify-center h-10 w-10 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white font-bold text-sm sm:text-lg shrink-0">
                        {bank.name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm sm:text-lg font-bold truncate">{bank.name}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {bank.branches}个网点 · {bank.projects.toLocaleString()}个项目
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* 评估公司合作伙伴 */}
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-10">
              <Building className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
              <h3 className="text-lg sm:text-2xl font-bold">认证评估公司</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {appraisalCompanies.map((company) => (
                <Card key={company.name} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 sm:p-6 lg:p-8">
                    <div className="flex items-start justify-between mb-4 sm:mb-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white font-bold text-base sm:text-xl shrink-0">
                          {company.name.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-base sm:text-xl font-bold truncate">{company.name}</h4>
                          <div className="flex items-center gap-1 text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                            {company.location}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="h-4 w-4 sm:h-5 sm:w-5 text-warning fill-warning" />
                        <span className="text-base sm:text-lg font-bold">{company.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 sm:pt-6 border-t">
                      <div>
                        <div className="text-base sm:text-lg font-bold">{company.projects.toLocaleString()}+</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">完成项目</div>
                      </div>
                      <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1">{company.specialty}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 评估案例 */}
      <section id="cases" className="w-full py-10 sm:py-16">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-16">
            <Badge variant="outline" className="mb-3 sm:mb-6 text-sm sm:text-base px-3 sm:px-4 py-1">成功案例</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-balance">
              真实评估 案例展示
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-xl text-muted-foreground">
              涵盖住宅、商业、写字楼等多种物业类型的专业评估服务
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {cases.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-4">
                      <div>
                        <Badge variant="outline" className="mb-2 text-xs sm:text-sm">{item.type}</Badge>
                        <h3 className="text-base sm:text-lg font-semibold">{item.title}</h3>
                      </div>
                      <div className="sm:text-right">
                        <div className="text-xl sm:text-2xl font-bold text-primary">{item.value}</div>
                        <div className="text-xs text-muted-foreground">评估价值</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">面积:</span>
                        <span className="font-medium truncate">{item.area}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">周期:</span>
                        <span className="font-medium">{item.duration}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-muted/50 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-1">
                        <Landmark className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{item.bank}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{item.company}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {item.date}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/login">
              <Button variant="outline" size="lg">
                查看更多案例
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="w-full py-10 sm:py-16 bg-primary">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-balance">
              开拓创新数字化评估新时代
            </h2>
            <p className="mt-4 sm:mt-8 text-base sm:text-xl lg:text-2xl text-white/80 leading-relaxed">
              无论您是银行机构还是评估公司，gujia.app 都能为您提供专业、高效的数字化解决方案。立即注册，体验行业领先的评估协作平台。
            </p>
            <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg text-primary font-semibold px-6 sm:px-10 py-4 sm:py-6 h-auto bg-white hover:bg-white/90">
                  免费注册体验
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg bg-white/20 text-white border-2 border-white/50 hover:bg-white/30 px-6 sm:px-10 py-4 sm:py-6 h-auto font-semibold">
                开通专业服务
              </Button>
            </div>
            <p className="mt-6 sm:mt-8 text-sm sm:text-lg text-white/70">
              <CheckCircle2 className="inline h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              无需等待 · 专业估价师 · 在线服务
            </p>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="w-full py-8 sm:py-12 border-t">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-2">
              <Logo size="md" className="sm:hidden" />
              <Logo size="lg" className="hidden sm:flex" />
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed">
                gujia.app 是专业的房地产评估数字化协作平台，致力于为银行、评估公司和客户提供高效、透明、专业的评估服务解决方案。
              </p>
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">产品服务</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">银行机构服务</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">评估公司服务</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">自动估价系统</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">数据分析报告</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">关于我们</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">公司介绍</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">合作伙伴</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">新闻动态</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">联系我们</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} gujia.app 版权所有
            </p>
            <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">服务条款</Link>
              <Link href="#" className="hover:text-foreground transition-colors">隐私政策</Link>
              <Link href="#" className="hover:text-foreground transition-colors">备案信息</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
