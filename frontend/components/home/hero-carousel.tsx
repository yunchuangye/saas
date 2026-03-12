"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight,
  Building2,
  TrendingUp,
  Shield,
  Smartphone,
  BarChart3,
  FileCheck
} from "lucide-react"
import { cn } from "@/lib/utils"

// 轮播图数据
const slides = [
  {
    id: 1,
    badge: "AI 驱动的智能估价",
    title: "OpenClaw 智能估价引擎",
    subtitle: "驱动房地产评估全流程数字化",
    description: "深度融合AI与大数据，从需求发起到报告交付，OpenClaw全程赋能，让估价更精准、更高效。",
    primaryButton: { text: "了解更多", href: "/login" },
    secondaryButton: { text: "开启智能估价", href: "/login" },
    theme: "blue" as const,
    image: "/images/openclaw-mascot.jpg",
    stats: [
      { label: "接入数据模型", value: "12+" },
      { label: "算法准确率", value: "98.6%" },
      { label: "日均Tokens消耗", value: "2.8M" },
      { label: "平均响应时间", value: "<3s" },
    ],
  },
  {
    id: 2,
    badge: "已为50+金融机构提供服务",
    title: "有态度的估价专业平台",
    subtitle: "连接银行 · 评估公司 · 客户",
    description: "提供高效、透明、专业的房地产评估数字化解决方案，让每一次评估都值得信赖。",
    primaryButton: { text: "立即体验", href: "/login" },
    secondaryButton: { text: "免费试用", href: "/login" },
    theme: "teal" as const,
    image: "/images/hero-building.jpg",
    stats: [
      { label: "合作银行机构", value: "50+" },
      { label: "累计评估金额", value: "800亿" },
      { label: "平均处理时效", value: "2.5天" },
      { label: "报告合格率", value: "99.2%" },
    ],
  },
  {
    id: 3,
    badge: "估价APP - 随身的估价专家",
    title: "移动办公 触手可及",
    subtitle: "实时掌控 · 随时随地 · 高效便捷",
    description: "下载估价APP，随时随地查看项目进度、接收通知提醒、在线审批报告，让估价工作不再受限于办公室。",
    primaryButton: { text: "下载APP", href: "/app-download" },
    secondaryButton: { text: "了解更多", href: "/login" },
    theme: "cyan" as const,
    image: "/images/hero-app.jpg",
    stats: [
      { label: "累计下载量", value: "10万+" },
      { label: "月活跃用户", value: "3.2万" },
      { label: "用户好评率", value: "4.9分" },
      { label: "覆盖城市", value: "280+" },
    ],
  },
]

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }, [])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 5000)
  }

  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(nextSlide, 6000)
    return () => clearInterval(interval)
  }, [isAutoPlaying, nextSlide])

  const slide = slides[currentSlide]

  return (
    <section className="relative overflow-hidden">
      <div
        className={cn(
          "relative min-h-[500px] sm:min-h-[600px] lg:min-h-[800px] transition-colors duration-700",
          slide.theme === "blue" && "bg-gradient-to-br from-[#0A2540] via-[#0D3158] to-[#1E3A8A]",
          slide.theme === "teal" && "bg-gradient-to-br from-[#1E3A3A] via-[#234E4E] to-[#2B5E5E]",
          slide.theme === "cyan" && "bg-gradient-to-br from-[#0E4D64] via-[#0A6A7C] to-[#087F8C]"
        )}
      >
        {/* 背景装饰圆形 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={cn(
            "absolute top-0 right-0 w-[600px] h-[600px] rounded-full -translate-y-1/3 translate-x-1/4",
            slide.theme === "blue" && "bg-cyan-500/10",
            slide.theme === "teal" && "bg-amber-500/10",
            slide.theme === "cyan" && "bg-teal-300/15"
          )} />
          <div className={cn(
            "absolute bottom-0 left-0 w-[800px] h-[800px] rounded-full translate-y-1/2 -translate-x-1/4",
            slide.theme === "blue" && "bg-blue-500/10",
            slide.theme === "teal" && "bg-teal-500/10",
            slide.theme === "cyan" && "bg-cyan-400/10"
          )} />
          <div className={cn(
            "absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full",
            slide.theme === "blue" && "bg-cyan-500/5",
            slide.theme === "teal" && "bg-amber-500/5",
            slide.theme === "cyan" && "bg-teal-300/5"
          )} />
          
          {/* 浮动装饰图标 */}
          {slide.theme === "blue" && (
            <>
              <div className="absolute top-24 right-[15%] opacity-20 animate-pulse">
                <TrendingUp className="h-16 w-16 text-white" />
              </div>
              <div className="absolute bottom-40 right-[20%] opacity-15">
                <BarChart3 className="h-12 w-12 text-white" />
              </div>
            </>
          )}
          {slide.theme === "teal" && (
            <>
              <div className="absolute top-24 right-[15%] opacity-20 animate-pulse">
                <Building2 className="h-16 w-16 text-white" />
              </div>
              <div className="absolute bottom-40 right-[20%] opacity-15">
                <Shield className="h-12 w-12 text-white" />
              </div>
            </>
          )}
          {slide.theme === "cyan" && (
            <>
              <div className="absolute top-24 right-[15%] opacity-20 animate-pulse">
                <Smartphone className="h-16 w-16 text-white" />
              </div>
              <div className="absolute bottom-40 right-[20%] opacity-15">
                <FileCheck className="h-12 w-12 text-white" />
              </div>
            </>
          )}
        </div>

        {/* 主内容区域 */}
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex-1 flex items-center">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* 左侧文字内容 - 占7列 */}
                <div className="lg:col-span-7 text-white py-8 sm:py-12 lg:py-24">
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "mb-4 sm:mb-8 text-xs sm:text-sm lg:text-base px-3 sm:px-4 py-1 sm:py-1.5 border font-medium",
                      slide.theme === "blue" && "bg-cyan-500/20 text-cyan-100 border-cyan-500/30",
                      slide.theme === "teal" && "bg-amber-500/20 text-amber-100 border-amber-500/30",
                      slide.theme === "cyan" && "bg-teal-300/20 text-teal-100 border-teal-300/30"
                    )}
                  >
                    {slide.badge}
                  </Badge>

                  <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold tracking-tight leading-[1.15] text-balance">
                    {slide.title}
                  </h1>

                  <p className={cn(
                    "mt-3 sm:mt-6 text-base sm:text-xl lg:text-3xl font-medium",
                    slide.theme === "blue" && "text-cyan-200",
                    slide.theme === "teal" && "text-amber-200",
                    slide.theme === "cyan" && "text-teal-200"
                  )}>
                    {slide.subtitle}
                  </p>

                  <p className="mt-4 sm:mt-6 lg:mt-8 text-sm sm:text-base lg:text-xl text-white/80 leading-relaxed max-w-2xl">
                    {slide.description}
                  </p>

                  <div className="mt-6 sm:mt-10 lg:mt-12 flex flex-wrap items-center gap-3 sm:gap-5">
                    <Link href={slide.primaryButton.href}>
                      <Button 
                        size="lg" 
                        className={cn(
                          "text-sm sm:text-base lg:text-lg font-semibold min-w-[120px] sm:min-w-[160px] px-4 sm:px-8 lg:px-10 py-3 sm:py-5 lg:py-6 h-auto justify-center",
                          slide.theme === "blue" && "bg-white text-[#0A2540] hover:bg-gray-100",
                          slide.theme === "teal" && "bg-amber-400 text-[#1E3A3A] hover:bg-amber-300",
                          slide.theme === "cyan" && "bg-teal-300 text-[#0E4D64] hover:bg-teal-200"
                        )}
                      >
                        {slide.primaryButton.text}
                        <ArrowRight className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </Link>
                    <Link href={slide.secondaryButton.href}>
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className={cn(
                          "text-sm sm:text-base lg:text-lg font-semibold min-w-[120px] sm:min-w-[160px] px-4 sm:px-8 lg:px-10 py-3 sm:py-5 lg:py-6 h-auto justify-center",
                          "border-2 border-white/50 text-white bg-white/10 hover:bg-white/20 hover:border-white/70"
                        )}
                      >
                        {slide.secondaryButton.text}
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* 右侧图片 - 占5列 */}
                <div className="lg:col-span-5 hidden lg:flex items-center justify-center">
                  <div className="relative w-full max-w-[480px] aspect-square">
                    {/* 发光背景 */}
                    <div className={cn(
                      "absolute inset-0 rounded-3xl blur-3xl scale-110",
                      slide.theme === "blue" && "bg-cyan-500/30",
                      slide.theme === "teal" && "bg-amber-500/30",
                      slide.theme === "cyan" && "bg-teal-400/30"
                    )} />
                    {/* 图片容器 */}
                    <div className="relative w-full h-full rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl bg-black/20">
                      <Image
                        src={slide.image}
                        alt={slide.title}
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 1024px) 100vw, 480px"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 数据统计区域 */}
          <div className="border-t border-white/10 bg-black/10 backdrop-blur-sm">
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 lg:gap-12">
                {slide.stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-xl sm:text-3xl lg:text-5xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base text-white/70">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 轮播指示器 */}
          <div className="absolute bottom-20 sm:bottom-28 lg:bottom-36 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "h-2.5 rounded-full transition-all duration-300",
                  currentSlide === index 
                    ? "w-10 bg-white" 
                    : "w-2.5 bg-white/40 hover:bg-white/60"
                )}
                aria-label={`切换到第 ${index + 1} 页`}
              />
            ))}
          </div>
        </div>

        {/* 左右切换按钮 */}
        <button
          onClick={() => {
            prevSlide()
            setIsAutoPlaying(false)
            setTimeout(() => setIsAutoPlaying(true), 5000)
          }}
          className="absolute left-2 sm:left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-black/20 hover:bg-black/30 backdrop-blur-sm text-white transition-colors border border-white/10"
          aria-label="上一张"
        >
          <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
        </button>
        <button
          onClick={() => {
            nextSlide()
            setIsAutoPlaying(false)
            setTimeout(() => setIsAutoPlaying(true), 5000)
          }}
          className="absolute right-2 sm:right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-black/20 hover:bg-black/30 backdrop-blur-sm text-white transition-colors border border-white/10"
          aria-label="下一张"
        >
          <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
        </button>
      </div>
    </section>
  )
}
