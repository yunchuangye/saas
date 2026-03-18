"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Calculator, MapPin, Building2, Star, Loader2,
  Landmark, FileText, Phone, UserPlus, Sparkles, AlertCircle,
  Search, X, Home, RotateCcw, ChevronRight, CheckCircle2,
  TrendingUp, Calendar, BarChart3, ArrowLeft,
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import Link from "next/link"

const DECORATION_OPTIONS = [
  { value: "rough", label: "毛坯" },
  { value: "simple", label: "简装" },
  { value: "medium", label: "中等装修" },
  { value: "fine", label: "精装修" },
  { value: "luxury", label: "豪华装修" },
]
const ORIENTATION_OPTIONS = [
  { value: "south", label: "朝南" },
  { value: "south_north", label: "南北通透" },
  { value: "east", label: "朝东" },
  { value: "west", label: "朝西" },
  { value: "north", label: "朝北" },
  { value: "other", label: "其他" },
]
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
  estateInfo?: { id: number; name: string; address: string | null; developer: string | null; buildYear: number | null } | null
  estateName?: string | null
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
interface EstateItem {
  id: number
  name: string
  address: string | null
  districtId: number | null
  developer: string | null
  buildYear: number | null
  propertyType: string | null
  totalUnits: number | null
}

function EstateSearchInput({
  cityId, districtId, value, onChange, disabled,
}: {
  cityId: number
  districtId?: number
  value: { id: number; name: string } | null
  onChange: (estate: { id: number; name: string } | null) => void
  disabled?: boolean
}) {
  const [keyword, setKeyword] = useState("")
  const [open, setOpen] = useState(false)
  const [debouncedKw, setDebouncedKw] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKw(keyword), 300)
    return () => clearTimeout(t)
  }, [keyword])

  const { data: estates, isFetching } = trpc.guestValuation.searchEstates.useQuery(
    { cityId, districtId: districtId || undefined, keyword: debouncedKw },
    { enabled: cityId > 0 && debouncedKw.length >= 1 }
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSelect = (estate: EstateItem) => {
    onChange({ id: estate.id, name: estate.name })
    setKeyword(estate.name)
    setOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setKeyword("")
    inputRef.current?.focus()
  }

  useEffect(() => {
    if (value) setKeyword(value.name)
    else setKeyword("")
  }, [value?.id])

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder={disabled ? "请先选择城市" : "搜索楼盘名称，如：万科城、碧桂园..."}
          disabled={disabled}
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value)
            setOpen(true)
            if (!e.target.value) onChange(null)
          }}
          onFocus={() => keyword.length >= 1 && setOpen(true)}
          className="w-full h-12 pl-10 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        />
        {value && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="h-3 w-3" />已匹配
            </span>
          </div>
        )}
        {keyword && (
          <button type="button" onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && debouncedKw.length >= 1 && (
        <div ref={dropdownRef}
          className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/80 overflow-hidden max-h-72 overflow-y-auto">
          {isFetching ? (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />正在搜索楼盘...
            </div>
          ) : !estates || estates.length === 0 ? (
            <div className="px-4 py-4 text-sm text-slate-500 text-center">
              <p>未找到相关楼盘</p>
              <p className="text-xs mt-1 text-slate-400">可直接填写其他信息进行估价</p>
            </div>
          ) : (
            estates.map((estate) => (
              <button key={estate.id} type="button" onClick={() => handleSelect(estate)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50/60 transition-colors text-left border-b border-slate-100 last:border-0">
                <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Home className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{estate.name}</p>
                  {estate.address && <p className="text-xs text-slate-400 truncate mt-0.5">{estate.address}</p>}
                </div>
                {estate.totalUnits && estate.totalUnits > 0 && (
                  <span className="text-xs text-slate-400 shrink-0">{estate.totalUnits}套</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function GuestValuationWidget() {
  const [step, setStep] = useState<"form" | "result" | "service">("form")
  const [serviceType, setServiceType] = useState<"bank" | "appraiser" | null>(null)
  const [formData, setFormData] = useState({
    cityId: 0, cityName: "", districtId: 0, districtName: "",
    propertyType: "residential", buildingArea: "", floor: "",
    totalFloors: "", buildingAge: "", orientation: "south",
    decoration: "medium", hasElevator: true, hasParking: false,
  })
  const [selectedEstate, setSelectedEstate] = useState<{ id: number; name: string } | null>(null)
  const [result, setResult] = useState<ValuationResult | null>(null)
  const [error, setError] = useState("")

  const { data: cities } = trpc.guestValuation.getCities.useQuery()
  const { data: districts } = trpc.guestValuation.getDistricts.useQuery(
    { cityId: formData.cityId }, { enabled: formData.cityId > 0 }
  )
  const { data: banks } = trpc.guestValuation.getBanks.useQuery(
    undefined, { enabled: step === "service" && serviceType === "bank" }
  )
  const { data: appraisers } = trpc.guestValuation.getAppraisers.useQuery(
    undefined, { enabled: step === "service" && serviceType === "appraiser" }
  )

  const calculateMutation = trpc.guestValuation.calculate.useMutation({
    onSuccess: (data) => { setResult(data as any); setStep("result"); setError("") },
    onError: (err) => { setError(err.message || "估价失败，请稍后重试") },
  })

  const handleCalculate = () => {
    setError("")
    if (!formData.cityId) { setError("请选择城市"); return }
    if (!formData.buildingArea || Number(formData.buildingArea) < 10) { setError("请输入有效的建筑面积（≥10㎡）"); return }
    if (!formData.floor || Number(formData.floor) < 1) { setError("请输入楼层"); return }
    if (!formData.totalFloors || Number(formData.totalFloors) < 1) { setError("请输入总楼层"); return }
    if (!formData.buildingAge && formData.buildingAge !== "0") { setError("请输入楼龄"); return }
    calculateMutation.mutate({
      city: formData.cityName, cityId: formData.cityId,
      district: formData.districtName, districtId: formData.districtId || undefined,
      estateId: selectedEstate?.id, estateName: selectedEstate?.name,
      propertyType: formData.propertyType as any,
      buildingArea: Number(formData.buildingArea), floor: Number(formData.floor),
      totalFloors: Number(formData.totalFloors), buildingAge: Number(formData.buildingAge),
      orientation: formData.orientation as any, decoration: formData.decoration as any,
      hasElevator: formData.hasElevator, hasParking: formData.hasParking,
    })
  }

  const renderStars = (rating: string | null) => {
    const r = Number(rating) || 0
    return (
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map((i) => (
          <Star key={i} className={`h-3 w-3 ${i <= Math.round(r) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
        ))}
        <span className="text-xs text-slate-400 ml-1">{r.toFixed(1)}</span>
      </div>
    )
  }

  const inputCls = "h-12 rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 transition-all text-sm placeholder:text-slate-400"
  const selectTriggerCls = "h-12 rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white transition-all text-sm"

  // ── FORM ──────────────────────────────────────────────────────────────────
  if (step === "form") {
    return (
      <div className="space-y-5">
        {/* Row 1: 城市 + 区域 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">城市</label>
            <Select value={formData.cityId ? String(formData.cityId) : ""}
              onValueChange={(v) => {
                const city = cities?.find((c) => c.id === Number(v))
                setFormData((f) => ({ ...f, cityId: Number(v), cityName: city?.name || "", districtId: 0, districtName: "" }))
                setSelectedEstate(null)
              }}>
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue placeholder="选择城市" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {cities?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">区域</label>
            <Select value={formData.districtId ? String(formData.districtId) : ""}
              onValueChange={(v) => {
                const d = districts?.find((d) => d.id === Number(v))
                setFormData((f) => ({ ...f, districtId: Number(v), districtName: d?.name || "" }))
              }}
              disabled={!formData.cityId}>
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue placeholder="选择区域" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {districts?.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: 楼盘名称 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">楼盘名称</label>
            <span className="text-xs text-blue-500 font-medium">精准估价关键</span>
          </div>
          <EstateSearchInput
            cityId={formData.cityId}
            districtId={formData.districtId || undefined}
            value={selectedEstate}
            onChange={setSelectedEstate}
            disabled={!formData.cityId}
          />
        </div>

        {/* Row 3: 物业类型 + 建筑面积 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">物业类型</label>
            <Select value={formData.propertyType} onValueChange={(v) => setFormData((f) => ({ ...f, propertyType: v }))}>
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {PROPERTY_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">建筑面积（㎡）</label>
            <Input type="number" placeholder="如：89.5" className={inputCls}
              value={formData.buildingArea}
              onChange={(e) => setFormData((f) => ({ ...f, buildingArea: e.target.value }))} />
          </div>
        </div>

        {/* Row 4: 楼层 + 总楼层 + 楼龄 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">所在楼层</label>
            <Input type="number" placeholder="如：10" className={inputCls}
              value={formData.floor}
              onChange={(e) => setFormData((f) => ({ ...f, floor: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">总楼层</label>
            <Input type="number" placeholder="如：32" className={inputCls}
              value={formData.totalFloors}
              onChange={(e) => setFormData((f) => ({ ...f, totalFloors: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">楼龄（年）</label>
            <Input type="number" placeholder="如：10" className={inputCls}
              value={formData.buildingAge}
              onChange={(e) => setFormData((f) => ({ ...f, buildingAge: e.target.value }))} />
          </div>
        </div>

        {/* Row 5: 朝向 + 装修 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">朝向</label>
            <Select value={formData.orientation} onValueChange={(v) => setFormData((f) => ({ ...f, orientation: v }))}>
              <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                {ORIENTATION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">装修情况</label>
            <Select value={formData.decoration} onValueChange={(v) => setFormData((f) => ({ ...f, decoration: v }))}>
              <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                {DECORATION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 6: 配套设施 */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">配套设施</label>
          <div className="flex gap-2">
            {[
              { key: "hasElevator", label: "有电梯", icon: <Building2 className="h-4 w-4" /> },
              { key: "hasParking", label: "有车位", icon: <MapPin className="h-4 w-4" /> },
            ].map(({ key, label, icon }) => (
              <button key={key} type="button"
                onClick={() => setFormData((f) => ({ ...f, [key]: !f[key as keyof typeof f] }))}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  formData[key as keyof typeof formData]
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-white"
                }`}>
                {icon}{label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleCalculate}
          disabled={calculateMutation.isPending}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-base font-bold shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5">
          {calculateMutation.isPending ? (
            <><Loader2 className="h-5 w-5 animate-spin" /><span>AI 估价中，请稍候...</span></>
          ) : (
            <><Sparkles className="h-5 w-5" /><span>一键免费估价</span></>
          )}
        </button>
        <p className="text-center text-xs text-slate-400">
          基于 <span className="font-semibold text-slate-600">217万+</span> 真实成交案例 · AI 智能估价引擎驱动
        </p>
      </div>
    )
  }

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (step === "result" && result) {
    const estateName = result.estateName || result.estateInfo?.name
    const isHighConf = result.confidenceLevel === "high"
    const isMedConf = result.confidenceLevel === "medium"

    return (
      <div className="space-y-5">
        {/* 楼盘信息条 */}
        {estateName && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Home className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{estateName}</p>
              {result.estateInfo?.address && (
                <p className="text-xs text-slate-400 truncate mt-0.5">{result.estateInfo.address}</p>
              )}
            </div>
            {result.estateInfo?.buildYear && (
              <span className="text-xs text-slate-400 shrink-0 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                {result.estateInfo.buildYear}年建
              </span>
            )}
          </div>
        )}

        {/* 核心价格卡片 */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-7 text-white">
          {/* 装饰圆 */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-blue-500/10" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-blue-400/8" />
          <div className="absolute top-1/2 right-8 -translate-y-1/2 w-1 h-20 bg-white/5 rounded-full" />

          <div className="relative">
            {/* 标题行 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-blue-500/20 border border-blue-400/20 flex items-center justify-center">
                  <Calculator className="h-4 w-4 text-blue-300" />
                </div>
                <span className="text-sm font-medium text-slate-300">AI 估价结果</span>
              </div>
              <span className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${
                isHighConf
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
                  : isMedConf
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/25"
                  : "bg-orange-500/15 text-orange-300 border-orange-500/25"
              }`}>
                {isHighConf ? "高置信度" : isMedConf ? "中置信度" : "参考值"}
              </span>
            </div>

            {/* 主价格 */}
            <div className="mb-6">
              <div className="text-5xl font-black tracking-tight leading-none">
                {result.formattedValue}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span className="text-slate-400 text-sm">单价</span>
                <span className="text-xl font-bold text-blue-300">{result.formattedUnitPrice}</span>
              </div>
            </div>

            {/* 分隔线 */}
            <div className="h-px bg-white/8 mb-5" />

            {/* 数据指标行 —— 宽松布局，3 个独立块 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span className="text-xs text-slate-400">参考案例</span>
                </div>
                <span className="text-lg font-bold text-white leading-none">
                  {result.comparableCount}
                  <span className="text-sm font-normal text-slate-400 ml-1">套</span>
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span className="text-xs text-slate-400">估价方法</span>
                </div>
                <span className="text-sm font-semibold text-white leading-none">市场比较法</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span className="text-xs text-slate-400">估价日期</span>
                </div>
                <span className="text-sm font-semibold text-white leading-none">{result.valuationDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 服务选择 */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700 text-center">需要进一步服务？</p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button"
              onClick={() => { setServiceType("bank"); setStep("service") }}
              className="group relative overflow-hidden flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-200">
              <div className="h-14 w-14 rounded-2xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                <Landmark className="h-7 w-7 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800">申请房产贷款</p>
                <p className="text-xs text-slate-400 mt-1">匹配全国合作银行</p>
              </div>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
            </button>
            <button type="button"
              onClick={() => { setServiceType("appraiser"); setStep("service") }}
              className="group relative overflow-hidden flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-slate-200 bg-white hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/50 transition-all duration-200">
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                <FileText className="h-7 w-7 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800">出具评估报告</p>
                <p className="text-xs text-slate-400 mt-1">权威机构法定报告</p>
              </div>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-hover:text-emerald-400 transition-colors" />
            </button>
          </div>
        </div>

        {/* 重新估价 */}
        <button type="button"
          className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors py-1"
          onClick={() => { setStep("form"); setResult(null) }}>
          <RotateCcw className="h-3.5 w-3.5" />重新估价
        </button>
      </div>
    )
  }

  // ── SERVICE ────────────────────────────────────────────────────────────────
  if (step === "service") {
    const orgList: OrgItem[] = serviceType === "bank" ? (banks || []) : (appraisers || [])
    const isLoading = serviceType === "bank" ? !banks : !appraisers
    const isBank = serviceType === "bank"

    return (
      <div className="space-y-4">
        {/* 顶部导航 */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setStep("result")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="h-4 w-4" />返回结果
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <span className="text-sm font-bold text-slate-800">
            {isBank ? "合作银行" : "认证评估机构"}
          </span>
        </div>

        {/* 注册引导横幅 */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-5 text-white">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/8" />
          <div className="flex items-start gap-4 relative">
            <div className="h-11 w-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-base leading-tight">注册会员，一键发起申请</p>
              <p className="text-xs text-blue-100 mt-1.5 leading-relaxed">
                注册后可直接向{isBank ? "银行" : "评估机构"}发起{isBank ? "贷款" : "评估"}申请，全程在线跟踪进度
              </p>
              <div className="flex gap-2 mt-3">
                <Link href="/register?role=customer">
                  <button type="button" className="h-8 px-4 bg-white text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-50 transition-colors">
                    免费注册
                  </button>
                </Link>
                <Link href="/login">
                  <button type="button" className="h-8 px-4 bg-white/15 text-white text-xs font-medium rounded-lg border border-white/25 hover:bg-white/25 transition-colors">
                    已有账号登录
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 机构列表 */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-blue-400" />
            <p className="text-sm text-slate-400">加载中...</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto">
            {orgList.map((org) => (
              <div key={org.id}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  isBank ? "bg-blue-50" : "bg-emerald-50"
                }`}>
                  {isBank
                    ? <Landmark className="h-6 w-6 text-blue-600" />
                    : <Building2 className="h-6 w-6 text-emerald-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{org.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {org.rating && renderStars(org.rating)}
                    {org.contactPhone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-400">{org.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Link href="/register?role=customer" className="shrink-0">
                  <button type="button" className={`h-9 px-4 text-xs font-bold rounded-xl text-white transition-colors ${
                    isBank
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}>
                    申请
                  </button>
                </Link>
              </div>
            ))}
            {orgList.length === 0 && (
              <div className="text-center py-10 text-sm text-slate-400">暂无合作机构，请稍后再试</div>
            )}
          </div>
        )}
      </div>
    )
  }

  return null
}
