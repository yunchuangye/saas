"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Calculator,
  MapPin,
  Building2,
  TrendingUp,
  Star,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Landmark,
  FileText,
  Phone,
  UserPlus,
  Sparkles,
  AlertCircle,
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import Link from "next/link"

// 装修等级
const DECORATION_OPTIONS = [
  { value: "rough", label: "毛坯" },
  { value: "simple", label: "简装" },
  { value: "medium", label: "中等装修" },
  { value: "fine", label: "精装修" },
  { value: "luxury", label: "豪华装修" },
]

// 朝向
const ORIENTATION_OPTIONS = [
  { value: "south", label: "朝南" },
  { value: "south_north", label: "南北通透" },
  { value: "east", label: "朝东" },
  { value: "west", label: "朝西" },
  { value: "north", label: "朝北" },
  { value: "other", label: "其他" },
]

// 物业类型
const PROPERTY_TYPE_OPTIONS = [
  { value: "residential", label: "住宅" },
  { value: "commercial", label: "商业" },
  { value: "office", label: "办公" },
  { value: "industrial", label: "工业" },
]

interface ValuationResult {
  finalValue: number
  unitPrice: number
  formattedValue: string
  formattedUnitPrice: string
  confidenceLevel: string
  method: string
  comparableCount: number
  valuationDate: string
}

interface OrgItem {
  id: number
  name: string
  address: string | null
  rating: string | null
  description: string | null
  logo: string | null
  contactPhone: string | null
}

export function GuestValuationWidget() {
  const router = useRouter()
  const [step, setStep] = useState<"form" | "result" | "service">("form")
  const [serviceType, setServiceType] = useState<"bank" | "appraiser" | null>(null)

  // 表单数据
  const [formData, setFormData] = useState({
    cityId: 0,
    cityName: "",
    districtId: 0,
    districtName: "",
    propertyType: "residential",
    buildingArea: "",
    floor: "",
    totalFloors: "",
    buildingAge: "",
    orientation: "south",
    decoration: "medium",
    hasElevator: true,
    hasParking: false,
  })

  const [result, setResult] = useState<ValuationResult | null>(null)
  const [error, setError] = useState("")

  // 获取城市列表
  const { data: cities } = trpc.guestValuation.getCities.useQuery()

  // 获取区域列表
  const { data: districts } = trpc.guestValuation.getDistricts.useQuery(
    { cityId: formData.cityId },
    { enabled: formData.cityId > 0 }
  )

  // 获取银行列表
  const { data: banks } = trpc.guestValuation.getBanks.useQuery(
    undefined,
    { enabled: step === "service" && serviceType === "bank" }
  )

  // 获取评估机构列表
  const { data: appraisers } = trpc.guestValuation.getAppraisers.useQuery(
    undefined,
    { enabled: step === "service" && serviceType === "appraiser" }
  )

  // 估价 mutation
  const calculateMutation = trpc.guestValuation.calculate.useMutation({
    onSuccess: (data) => {
      setResult(data)
      setStep("result")
      setError("")
    },
    onError: (err) => {
      setError(err.message || "估价失败，请稍后重试")
    },
  })

  const handleCalculate = () => {
    setError("")
    if (!formData.cityId) { setError("请选择城市"); return }
    if (!formData.buildingArea || Number(formData.buildingArea) < 10) { setError("请输入有效的建筑面积（≥10㎡）"); return }
    if (!formData.floor || Number(formData.floor) < 1) { setError("请输入楼层"); return }
    if (!formData.totalFloors || Number(formData.totalFloors) < 1) { setError("请输入总楼层"); return }
    if (!formData.buildingAge && formData.buildingAge !== "0") { setError("请输入楼龄"); return }

    calculateMutation.mutate({
      city: formData.cityName,
      cityId: formData.cityId,
      district: formData.districtName,
      propertyType: formData.propertyType as any,
      buildingArea: Number(formData.buildingArea),
      floor: Number(formData.floor),
      totalFloors: Number(formData.totalFloors),
      buildingAge: Number(formData.buildingAge),
      orientation: formData.orientation as any,
      decoration: formData.decoration as any,
      hasElevator: formData.hasElevator,
      hasParking: formData.hasParking,
    })
  }

  const confidenceLabel = (level: string) => {
    if (level === "high") return { text: "高置信度", color: "bg-green-100 text-green-700" }
    if (level === "medium") return { text: "中置信度", color: "bg-yellow-100 text-yellow-700" }
    return { text: "参考值", color: "bg-orange-100 text-orange-700" }
  }

  const renderStars = (rating: string | null) => {
    const r = Number(rating) || 0
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${i <= Math.round(r) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">{r.toFixed(1)}</span>
      </div>
    )
  }

  // ── 表单步骤 ──
  if (step === "form") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* 城市 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">城市</Label>
            <Select
              value={formData.cityId ? String(formData.cityId) : ""}
              onValueChange={(v) => {
                const city = cities?.find((c) => c.id === Number(v))
                setFormData((f) => ({ ...f, cityId: Number(v), cityName: city?.name || "", districtId: 0, districtName: "" }))
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="选择城市" />
              </SelectTrigger>
              <SelectContent>
                {(cities || []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 区域 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">区域</Label>
            <Select
              value={formData.districtId ? String(formData.districtId) : ""}
              onValueChange={(v) => {
                const d = districts?.find((x) => x.id === Number(v))
                setFormData((f) => ({ ...f, districtId: Number(v), districtName: d?.name || "" }))
              }}
              disabled={!formData.cityId}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="选择区域" />
              </SelectTrigger>
              <SelectContent>
                {(districts || []).map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 物业类型 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">物业类型</Label>
            <Select
              value={formData.propertyType}
              onValueChange={(v) => setFormData((f) => ({ ...f, propertyType: v }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 建筑面积 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">建筑面积（㎡）</Label>
            <Input
              type="number"
              placeholder="如：89.5"
              className="h-9"
              value={formData.buildingArea}
              onChange={(e) => setFormData((f) => ({ ...f, buildingArea: e.target.value }))}
            />
          </div>

          {/* 楼层 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">所在楼层</Label>
            <Input
              type="number"
              placeholder="如：10"
              className="h-9"
              value={formData.floor}
              onChange={(e) => setFormData((f) => ({ ...f, floor: e.target.value }))}
            />
          </div>

          {/* 总楼层 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">总楼层</Label>
            <Input
              type="number"
              placeholder="如：32"
              className="h-9"
              value={formData.totalFloors}
              onChange={(e) => setFormData((f) => ({ ...f, totalFloors: e.target.value }))}
            />
          </div>

          {/* 楼龄 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">楼龄（年）</Label>
            <Input
              type="number"
              placeholder="如：10"
              className="h-9"
              value={formData.buildingAge}
              onChange={(e) => setFormData((f) => ({ ...f, buildingAge: e.target.value }))}
            />
          </div>

          {/* 朝向 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">朝向</Label>
            <Select
              value={formData.orientation}
              onValueChange={(v) => setFormData((f) => ({ ...f, orientation: v }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORIENTATION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 装修 */}
          <div className="space-y-1.5 col-span-2">
            <Label className="text-sm font-medium">装修情况</Label>
            <div className="flex gap-2 flex-wrap">
              {DECORATION_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setFormData((f) => ({ ...f, decoration: o.value }))}
                  className={`px-3 py-1.5 rounded-md text-sm border transition-all ${
                    formData.decoration === o.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* 配套 */}
          <div className="space-y-1.5 col-span-2">
            <Label className="text-sm font-medium">配套设施</Label>
            <div className="flex gap-3">
              <button
                onClick={() => setFormData((f) => ({ ...f, hasElevator: !f.hasElevator }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-all ${
                  formData.hasElevator ? "bg-primary text-primary-foreground border-primary" : "border-border"
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                有电梯
              </button>
              <button
                onClick={() => setFormData((f) => ({ ...f, hasParking: !f.hasParking }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-all ${
                  formData.hasParking ? "bg-primary text-primary-foreground border-primary" : "border-border"
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                有车位
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Button
          className="w-full h-11 text-base font-semibold"
          onClick={handleCalculate}
          disabled={calculateMutation.isPending}
        >
          {calculateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              正在估价中...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              一键免费估价
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          基于{" "}
          <span className="font-medium text-foreground">217万+</span>{" "}
          真实成交案例，AI 智能估价引擎驱动
        </p>
      </div>
    )
  }

  // ── 估价结果步骤 ──
  if (step === "result" && result) {
    const conf = confidenceLabel(result.confidenceLevel)
    return (
      <div className="space-y-4">
        {/* 估价结果卡片 */}
        <div className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-600">估价完成</span>
          </div>
          <div className="text-4xl font-bold text-primary my-2">
            {result.formattedValue}
          </div>
          <div className="text-sm text-muted-foreground mb-3">
            单价：<span className="font-semibold text-foreground">{result.formattedUnitPrice}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Badge className={`text-xs ${conf.color} border-0`}>{conf.text}</Badge>
            <span className="text-xs text-muted-foreground">
              参考 {result.comparableCount} 个成交案例
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            估价日期：{result.valuationDate}
          </div>
        </div>

        {/* 提示说明 */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <p className="font-medium mb-1">💡 温馨提示</p>
          <p className="text-xs leading-relaxed">
            以上为 AI 智能参考估价，仅供参考。如需用于贷款抵押或法律用途，请委托专业评估机构出具正式报告。
          </p>
        </div>

        {/* 下一步操作 */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-center">您需要什么服务？</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setServiceType("bank"); setStep("service") }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Landmark className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium">申请房产贷款</span>
              <span className="text-xs text-muted-foreground text-center">匹配合适银行，快速审批</span>
            </button>
            <button
              onClick={() => { setServiceType("appraiser"); setStep("service") }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm font-medium">出具评估报告</span>
              <span className="text-xs text-muted-foreground text-center">专业机构，权威报告</span>
            </button>
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full text-sm text-muted-foreground"
          onClick={() => { setStep("form"); setResult(null) }}
        >
          重新估价
        </Button>
      </div>
    )
  }

  // ── 服务机构步骤 ──
  if (step === "service") {
    const orgList: OrgItem[] = serviceType === "bank" ? (banks || []) : (appraisers || [])
    const isLoading = serviceType === "bank" ? !banks : !appraisers

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep("result")}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            ← 返回
          </button>
          <span className="text-sm font-medium">
            {serviceType === "bank" ? "🏦 平台合作银行" : "🏢 平台认证评估机构"}
          </span>
        </div>

        {/* 注册引导横幅 */}
        <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-4 text-white">
          <div className="flex items-start gap-3">
            <UserPlus className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm">注册会员，一键发起需求</p>
              <p className="text-xs text-white/80 mt-0.5">
                注册后可直接向{serviceType === "bank" ? "银行" : "评估机构"}发起{serviceType === "bank" ? "贷款" : "评估"}申请，全程在线跟踪进度
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Link href="/register?role=customer" className="flex-1">
              <Button size="sm" variant="secondary" className="w-full h-8 text-xs font-semibold">
                免费注册
              </Button>
            </Link>
            <Link href="/login" className="flex-1">
              <Button size="sm" variant="outline" className="w-full h-8 text-xs border-white/30 text-white hover:bg-white/10">
                已有账号登录
              </Button>
            </Link>
          </div>
        </div>

        {/* 机构列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {orgList.map((org) => (
              <div
                key={org.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {serviceType === "bank" ? (
                    <Landmark className="h-4 w-4 text-primary" />
                  ) : (
                    <Building2 className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{org.name}</p>
                    {org.rating && renderStars(org.rating)}
                  </div>
                  {org.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{org.description}</p>
                  )}
                  {org.contactPhone && (
                    <div className="flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{org.contactPhone}</span>
                    </div>
                  )}
                </div>
                <Link href="/register?role=customer">
                  <Button size="sm" variant="outline" className="h-7 text-xs shrink-0">
                    申请
                    <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}

        {orgList.length === 0 && !isLoading && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            暂无合作机构，请稍后再试
          </div>
        )}
      </div>
    )
  }

  return null
}
