import Link from "next/link"
import { GuestValuationWidget } from "@/components/home/guest-valuation-widget"
import {
  Building2, Shield, Star, ArrowRight,
  Landmark, FileText, BarChart3, Clock, Award, ChevronRight,
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Josefin+Sans:wght@300;400;500;600;700&display=swap');
        .font-cinzel { font-family: 'Cinzel', Georgia, serif; }
        .font-josefin { font-family: 'Josefin Sans', sans-serif; }
      `}</style>

      {/* ── 导航栏 */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/98 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-[#1E293B] flex items-center justify-center">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <span className="font-cinzel text-sm font-semibold tracking-widest text-[#1E293B] uppercase">估价云</span>
              <span className="hidden sm:inline text-xs text-gray-400 ml-1 font-josefin tracking-wider">PROPERTY VALUATION</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              {[
                { href: "#valuation", label: "在线估价" },
                { href: "#how-it-works", label: "使用流程" },
                { href: "#partners", label: "合作机构" },
              ].map((item) => (
                <a key={item.href} href={item.href}
                  className="font-josefin text-xs tracking-[0.15em] text-gray-500 hover:text-[#1E293B] transition-colors uppercase">
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <button className="font-josefin text-xs tracking-wider text-gray-600 hover:text-[#1E293B] transition-colors px-3 py-2 uppercase">
                  登录
                </button>
              </Link>
              <Link href="/register">
                <button className="font-josefin text-xs tracking-wider bg-[#1E293B] text-white px-5 py-2.5 hover:bg-[#0f172a] transition-colors uppercase">
                  免费注册
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero + 估价工具 */}
      <section id="valuation" className="bg-[#F8FAFC]">
        <div className="h-1 bg-[#2563EB]" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* 左侧文案 */}
            <div className="space-y-10">
              <div className="inline-flex items-center gap-2 border border-[#2563EB]/30 px-4 py-1.5 bg-white">
                <div className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
                <span className="font-josefin text-xs tracking-[0.2em] text-[#2563EB] uppercase font-medium">
                  专业房产估价平台
                </span>
              </div>

              <div className="space-y-5">
                <h1 className="font-cinzel text-4xl lg:text-5xl xl:text-6xl font-semibold text-[#1E293B] leading-[1.15] tracking-tight">
                  精准估价<br />
                  <span className="text-[#2563EB]">一键即达</span>
                </h1>
                <p className="font-josefin text-base text-gray-500 leading-relaxed max-w-md tracking-wide">
                  基于 217 万套真实成交案例，运用专业市场比较法，
                  为您的房产提供精准估价参考，误差率低于 8%。
                </p>
              </div>

              {/* 数据指标 */}
              <div className="grid grid-cols-3 gap-0 border border-gray-200 bg-white">
                {[
                  { value: "217万+", label: "真实案例" },
                  { value: "500+", label: "合作机构" },
                  { value: "92%", label: "估价准确率" },
                ].map((stat, i) => (
                  <div key={i} className={`px-6 py-5 ${i < 2 ? "border-r border-gray-200" : ""}`}>
                    <div className="font-cinzel text-2xl font-semibold text-[#1E293B]">{stat.value}</div>
                    <div className="font-josefin text-xs tracking-wider text-gray-400 mt-1 uppercase">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* 特性列表 */}
              <div className="space-y-3">
                {[
                  "精准到个位数，非区间估算",
                  "覆盖全国主要城市 4000+ 楼盘",
                  "银行贷款与评估报告一站式服务",
                  "注册即可发起正式贷款/评估需求",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-px w-5 bg-[#2563EB] shrink-0" />
                    <span className="font-josefin text-sm text-gray-600 tracking-wide">{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Link href="/register">
                  <button className="font-josefin text-xs tracking-wider bg-[#F97316] text-white px-8 py-3.5 hover:bg-[#ea6c0a] transition-colors uppercase font-medium">
                    免费注册
                  </button>
                </Link>
                <a href="#how-it-works" className="font-josefin text-xs tracking-wider text-gray-500 hover:text-[#1E293B] transition-colors flex items-center gap-2 uppercase">
                  了解更多 <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* 右侧估价工具 */}
            <div className="relative">
              <div className="bg-white border border-gray-200 shadow-xl shadow-gray-100/80">
                <div className="border-b border-gray-100 px-7 py-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-cinzel text-sm font-semibold text-[#1E293B] tracking-widest uppercase">
                      一键免费估价
                    </h2>
                    <p className="font-josefin text-xs text-gray-400 mt-0.5 tracking-wider">
                      填写信息，即时获取精准估价
                    </p>
                  </div>
                  <div className="border border-[#2563EB]/30 px-3 py-1">
                    <span className="font-josefin text-xs text-[#2563EB] tracking-wider uppercase font-medium">免费</span>
                  </div>
                </div>
                <div className="px-7 py-6">
                  <GuestValuationWidget />
                </div>
                <div className="border-t border-gray-100 px-7 py-3 bg-gray-50">
                  <p className="font-josefin text-xs text-gray-400 text-center tracking-wider">
                    基于 217万+ 真实成交案例 · 市场比较法估价
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-3 -right-3 h-full w-full border border-[#2563EB]/15 -z-10" />
            </div>

          </div>
        </div>
      </section>

      {/* ── 使用流程 */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-14 flex items-end gap-6">
            <div>
              <p className="font-josefin text-xs tracking-[0.3em] text-[#2563EB] uppercase mb-3">How It Works</p>
              <h2 className="font-cinzel text-3xl lg:text-4xl font-semibold text-[#1E293B]">三步完成估价</h2>
            </div>
            <div className="flex-1 h-px bg-gray-200 mb-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-gray-200">
            {[
              {
                step: "01",
                title: "输入房产信息",
                desc: "选择城市、区域，搜索楼盘名称，填写面积、楼层、楼龄等基本信息。",
                icon: Building2,
              },
              {
                step: "02",
                title: "获取精准估价",
                desc: "系统基于真实成交案例，运用市场比较法，即时输出精准到个位数的估价结果。",
                icon: BarChart3,
              },
              {
                step: "03",
                title: "对接专业服务",
                desc: "注册会员后，可直接向合作银行申请贷款，或委托认证评估机构出具法定报告。",
                icon: Award,
              },
            ].map((item, i) => (
              <div key={i} className={`p-8 lg:p-10 group hover:bg-[#F8FAFC] transition-colors ${i < 2 ? "border-r border-gray-200" : ""}`}>
                <div className="font-cinzel text-5xl font-semibold text-gray-100 group-hover:text-[#2563EB]/15 transition-colors mb-6">
                  {item.step}
                </div>
                <div className="mb-4">
                  <item.icon className="h-6 w-6 text-[#2563EB]" />
                </div>
                <h3 className="font-cinzel text-base font-semibold text-[#1E293B] mb-3">{item.title}</h3>
                <p className="font-josefin text-sm text-gray-500 leading-relaxed tracking-wide">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 核心优势（深色区域） */}
      <section className="py-20 bg-[#1E293B]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <p className="font-josefin text-xs tracking-[0.3em] text-[#2563EB] uppercase mb-4">Why Choose Us</p>
                <h2 className="font-cinzel text-3xl lg:text-4xl font-semibold text-white leading-tight">
                  专业、精准、<br />值得信赖
                </h2>
              </div>
              <p className="font-josefin text-sm text-gray-400 leading-relaxed tracking-wide max-w-md">
                我们与全国顶级银行和持牌评估机构深度合作，
                为个人用户提供从估价到融资的一站式专业服务。
              </p>
              <div className="space-y-4">
                {[
                  { label: "数据覆盖", value: "全国 35 个主要城市" },
                  { label: "合作银行", value: "工商、建设、招商等 50+ 家" },
                  { label: "评估机构", value: "持牌认证机构 200+ 家" },
                  { label: "平均响应", value: "24 小时内完成对接" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 border-b border-white/8 pb-4">
                    <span className="font-josefin text-xs tracking-wider text-gray-500 uppercase w-20 shrink-0">{item.label}</span>
                    <div className="h-px flex-1 bg-white/8" />
                    <span className="font-josefin text-sm text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-white/10">
              {[
                { icon: Shield, title: "数据安全", desc: "银行级加密保护，您的房产信息绝对安全" },
                { icon: Clock, title: "即时出价", desc: "秒级响应，无需等待，立即获取估价结果" },
                { icon: Landmark, title: "银行直连", desc: "与银行系统直接对接，贷款申请更高效" },
                { icon: FileText, title: "法定报告", desc: "持牌机构出具，司法、银行等场景通用" },
              ].map((item, i) => (
                <div key={i} className="bg-[#1E293B] p-7 hover:bg-[#263548] transition-colors">
                  <item.icon className="h-5 w-5 text-[#2563EB] mb-4" />
                  <h4 className="font-cinzel text-sm font-semibold text-white mb-2">{item.title}</h4>
                  <p className="font-josefin text-xs text-gray-500 leading-relaxed tracking-wide">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 合作机构 */}
      <section id="partners" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-14 flex items-end gap-6">
            <div>
              <p className="font-josefin text-xs tracking-[0.3em] text-[#2563EB] uppercase mb-3">Partners</p>
              <h2 className="font-cinzel text-3xl lg:text-4xl font-semibold text-[#1E293B]">合作机构</h2>
            </div>
            <div className="flex-1 h-px bg-gray-200 mb-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Landmark className="h-5 w-5 text-[#2563EB]" />
                <h3 className="font-cinzel text-sm font-semibold text-[#1E293B] uppercase tracking-widest">合作银行</h3>
              </div>
              <div className="space-y-0">
                {[
                  { name: "中国工商银行", desc: "个人住房贷款 · 商业贷款" },
                  { name: "中国建设银行", desc: "按揭贷款 · 抵押贷款" },
                  { name: "招商银行", desc: "闪电贷 · 房抵贷" },
                  { name: "中国银行", desc: "境内外联动 · 综合金融" },
                ].map((bank, i) => (
                  <div key={i} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-josefin text-sm font-medium text-[#1E293B]">{bank.name}</p>
                      <p className="font-josefin text-xs text-gray-400 tracking-wide mt-0.5">{bank.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </div>
                ))}
              </div>
              <Link href="/register?role=customer">
                <button className="mt-6 w-full font-josefin text-xs tracking-wider text-[#2563EB] border border-[#2563EB] py-3 hover:bg-[#2563EB] hover:text-white transition-colors uppercase">
                  查看全部合作银行
                </button>
              </Link>
            </div>

            <div className="border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="h-5 w-5 text-[#2563EB]" />
                <h3 className="font-cinzel text-sm font-semibold text-[#1E293B] uppercase tracking-widest">认证评估机构</h3>
              </div>
              <div className="space-y-0">
                {[
                  { name: "戴德梁行评估", desc: "国际认证 · 司法评估" },
                  { name: "仲量联行", desc: "商业地产 · 住宅评估" },
                  { name: "高力国际", desc: "抵押评估 · 资产评估" },
                  { name: "世邦魏理仕", desc: "全国网络 · 快速出报告" },
                ].map((org, i) => (
                  <div key={i} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-josefin text-sm font-medium text-[#1E293B]">{org.name}</p>
                      <p className="font-josefin text-xs text-gray-400 tracking-wide mt-0.5">{org.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </div>
                ))}
              </div>
              <Link href="/register?role=customer">
                <button className="mt-6 w-full font-josefin text-xs tracking-wider text-[#2563EB] border border-[#2563EB] py-3 hover:bg-[#2563EB] hover:text-white transition-colors uppercase">
                  查看全部评估机构
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 用户评价 */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-14 flex items-end gap-6">
            <div>
              <p className="font-josefin text-xs tracking-[0.3em] text-[#2563EB] uppercase mb-3">Testimonials</p>
              <h2 className="font-cinzel text-3xl lg:text-4xl font-semibold text-[#1E293B]">用户评价</h2>
            </div>
            <div className="flex-1 h-px bg-gray-200 mb-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-gray-200">
            {[
              {
                quote: "估价结果和最终成交价只差了 3 万，准确度令人惊讶。通过平台对接银行，贷款审批也非常顺利。",
                name: "张先生",
                role: "深圳 · 住宅购房",
                stars: 5,
              },
              {
                quote: "作为评估师，我们机构入驻后接到了大量来自个人用户的委托，平台的客户质量很高，合作体验很好。",
                name: "李女士",
                role: "北京 · 认证评估师",
                stars: 5,
              },
              {
                quote: "卖房前用平台估了一下价，心里有了底。最终挂牌价和估价相差无几，很快就成交了。",
                name: "王先生",
                role: "上海 · 房产出售",
                stars: 5,
              },
            ].map((review, i) => (
              <div key={i} className={`p-8 bg-white ${i < 2 ? "border-r border-gray-200" : ""}`}>
                <div className="flex gap-1 mb-5">
                  {[...Array(review.stars)].map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-[#F97316] text-[#F97316]" />
                  ))}
                </div>
                <blockquote className="font-josefin text-sm text-gray-600 leading-relaxed tracking-wide mb-6">
                  "{review.quote}"
                </blockquote>
                <div className="flex items-center gap-3 border-t border-gray-100 pt-5">
                  <div className="h-8 w-8 bg-[#1E293B] flex items-center justify-center shrink-0">
                    <span className="font-cinzel text-xs text-white">{review.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-josefin text-sm font-medium text-[#1E293B]">{review.name}</p>
                    <p className="font-josefin text-xs text-gray-400 tracking-wide">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA */}
      <section className="py-20 bg-[#2563EB]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <p className="font-josefin text-xs tracking-[0.4em] text-blue-200 uppercase mb-6">Get Started</p>
          <h2 className="font-cinzel text-3xl lg:text-5xl font-semibold text-white mb-6 leading-tight">
            立即获取您的房产估价
          </h2>
          <p className="font-josefin text-sm text-blue-200 mb-10 tracking-wider max-w-lg mx-auto leading-relaxed">
            免费注册，即可享受精准估价、银行贷款对接、评估报告委托等全套专业服务。
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <button className="font-josefin text-xs tracking-wider bg-white text-[#2563EB] px-10 py-4 hover:bg-gray-50 transition-colors uppercase font-medium">
                免费注册
              </button>
            </Link>
            <a href="#valuation">
              <button className="font-josefin text-xs tracking-wider border border-white/40 text-white px-10 py-4 hover:bg-white/10 transition-colors uppercase">
                先试试估价
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* ── 页脚 */}
      <footer className="bg-[#1E293B] py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 bg-white/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <span className="font-cinzel text-sm tracking-widest text-white uppercase">估价云</span>
              <span className="font-josefin text-xs text-gray-500 tracking-wider">PROPERTY VALUATION PLATFORM</span>
            </div>
            <div className="flex items-center gap-8">
              {["关于我们", "服务协议", "隐私政策", "联系我们"].map((item) => (
                <a key={item} href="#" className="font-josefin text-xs tracking-wider text-gray-500 hover:text-gray-300 transition-colors uppercase">
                  {item}
                </a>
              ))}
            </div>
            <p className="font-josefin text-xs text-gray-600 tracking-wider">
              © 2026 估价云 · All Rights Reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
