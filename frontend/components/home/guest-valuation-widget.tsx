"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Loader2, Landmark, FileText, UserPlus, AlertCircle,
  Search, X, Home, RotateCcw, ArrowLeft,
  Star, Phone, Building2,
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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder={disabled ? "请先选择城市" : "输入楼盘名称，如：万科城、碧桂园..."}
          disabled={disabled}
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value)
            setOpen(true)
            if (!e.target.value) onChange(null)
          }}
          onFocus={() => keyword.length >= 1 && setOpen(true)}
          className="w-full h-12 pl-11 pr-10 border border-gray-200 bg-gray-50 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] focus:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-none font-josefin"
        />
        {value && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 tracking-wider uppercase">
              已匹配
            </span>
          </div>
        )}
        {keyword && (
          <button type="button" onClick={handleClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && debouncedKw.length >= 1 && (
        <div ref={dropdownRef}
          className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-white border border-gray-200 shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {isFetching ? (
            <div className="flex items-center gap-2.5 px-4 py-4 text-sm text-gray-500 font-josefin">
              <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" />
              <span className="tracking-wide">搜索楼盘中...</span>
            </div>
          ) : !estates || estates.length === 0 ? (
            <div className="px-4 py-5 text-center">
              <p className="text-sm text-gray-500 font-josefin tracking-wide">未找到相关楼盘</p>
              <p className="text-xs mt-1 text-gray-400 font-josefin tracking-wider">可直接填写其他信息进行估价</p>
            </div>
          ) : (
            estates.map((estate) => (
              <button key={estate.id} type="button" onClick={() => handleSelect(estate)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0">
                <div className="h-8 w-8 bg-[#F8FAFC] border border-gray-200 flex items-center justify-center shrink-0">
                  <Home className="h-3.5 w-3.5 text-[#2563EB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1E293B] truncate font-josefin">{estate.name}</p>
                  {estate.address && (
                    <p className="text-xs text-gray-400 truncate mt-0.5 font-josefin tracking-wide">{estate.address}</p>
                  )}
                </div>
                {estate.totalUnits && estate.totalUnits > 0 && (
                  <span className="text-xs text-gray-400 shrink-0 font-josefin">{estate.totalUnits}套</span>
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
          <Star key={i} className={`h-3 w-3 ${i <= Math.round(r) ? "fill-[#F97316] text-[#F97316]" : "text-gray-200"}`} />
        ))}
        <span className="text-xs text-gray-400 ml-1 font-josefin">{r.toFixed(1)}</span>
      </div>
    )
  }

  // ── 共用样式 ──────────────────────────────────────────────────────────────
  const labelCls = "block text-[10px] tracking-[0.18em] text-gray-500 uppercase font-semibold mb-1.5 font-josefin"
  const inputCls = "h-12 border border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/30 transition-all text-sm placeholder:text-gray-400 rounded-none font-josefin"
  const selectTriggerCls = "h-12 border border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white transition-all text-sm rounded-none font-josefin"

  // ── 表单页 ────────────────────────────────────────────────────────────────
  if (step === "form") {
    return (
      <div className="space-y-5">

        {/* 城市 + 区域 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>城市</label>
            <Select value={formData.cityId ? String(formData.cityId) : ""}
              onValueChange={(v) => {
                const city = cities?.find((c) => c.id === Number(v))
                setFormData((f) => ({ ...f, cityId: Number(v), cityName: city?.name || "", districtId: 0, districtName: "" }))
                setSelectedEstate(null)
              }}>
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue placeholder="选择城市" />
              </SelectTrigger>
              <SelectContent>
                {cities?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={labelCls}>区域</label>
            <Select value={formData.districtId ? String(formData.districtId) : ""}
              onValueChange={(v) => {
                const d = districts?.find((d) => d.id === Number(v))
                setFormData((f) => ({ ...f, districtId: Number(v), districtName: d?.name || "" }))
              }}
              disabled={!formData.cityId}>
              <SelectTrigger className={selectTriggerCls}>
                <SelectValue placeholder="选择区域" />
              </SelectTrigger>
              <SelectContent>
                {districts?.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 楼盘名称 */}
        <div>
          <label className={labelCls}>楼盘名称</label>
          <EstateSearchInput
            cityId={formData.cityId}
            districtId={formData.districtId || undefined}
            value={selectedEstate}
            onChange={setSelectedEstate}
            disabled={!formData.cityId}
          />
        </div>

        {/* 物业类型 + 建筑面积 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>物业类型</label>
            <Select value={formData.propertyType} onValueChange={(v) => setFormData((f) => ({ ...f, propertyType: v }))}>
              <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={labelCls}>建筑面积（㎡）</label>
            <Input type="number" placeholder="如：89.5" className={inputCls}
              value={formData.buildingArea}
              onChange={(e) => setFormData((f) => ({ ...f, buildingArea: e.target.value }))} />
          </div>
        </div>

        {/* 楼层 + 总楼层 + 楼龄 */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>楼层</label>
            <Input type="number" placeholder="如：10" className={inputCls}
              value={formData.floor}
              onChange={(e) => setFormData((f) => ({ ...f, floor: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>总楼层</label>
            <Input type="number" placeholder="如：32" className={inputCls}
              value={formData.totalFloors}
              onChange={(e) => setFormData((f) => ({ ...f, totalFloors: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>楼龄（年）</label>
            <Input type="number" placeholder="如：10" className={inputCls}
              value={formData.buildingAge}
              onChange={(e) => setFormData((f) => ({ ...f, buildingAge: e.target.value }))} />
          </div>
        </div>

        {/* 朝向 + 装修 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>朝向</label>
            <Select value={formData.orientation} onValueChange={(v) => setFormData((f) => ({ ...f, orientation: v }))}>
              <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
              <SelectContent>
                {ORIENTATION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={labelCls}>装修情况</label>
            <Select value={formData.decoration} onValueChange={(v) => setFormData((f) => ({ ...f, decoration: v }))}>
              <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
              <SelectContent>
                {DECORATION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 配套设施 */}
        <div>
          <label className={labelCls}>配套设施</label>
          <div className="flex gap-3">
            {[
              { key: "hasElevator", label: "有电梯" },
              { key: "hasParking", label: "有车位" },
            ].map(({ key, label }) => (
              <button key={key} type="button"
                onClick={() => setFormData((f) => ({ ...f, [key]: !f[key as keyof typeof f] }))}
                className={`font-josefin text-xs tracking-[0.15em] px-6 py-3 border transition-all uppercase font-medium ${
                  formData[key as keyof typeof formData]
                    ? "bg-[#1E293B] text-white border-[#1E293B]"
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400 hover:bg-white"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm font-josefin tracking-wide">{error}</span>
          </div>
        )}

        {/* 提交按钮 */}
        <button
          type="button"
          onClick={handleCalculate}
          disabled={calculateMutation.isPending}
          className="w-full h-13 bg-[#1E293B] hover:bg-[#0f172a] text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 font-josefin text-xs tracking-[0.25em] uppercase font-semibold"
          style={{ height: "52px" }}>
          {calculateMutation.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /><span>估价中，请稍候...</span></>
          ) : (
            <span>立即免费估价</span>
          )}
        </button>

        <p className="text-center font-josefin text-xs text-gray-400 tracking-wider">
          基于 <span className="font-semibold text-gray-600">217万+</span> 真实成交案例 · 市场比较法
        </p>
      </div>
    )
  }

  // ── 结果页 ────────────────────────────────────────────────────────────────
  if (step === "result" && result) {
    const estateName = result.estateName || result.estateInfo?.name
    const isHighConf = result.confidenceLevel === "high"
    const isMedConf = result.confidenceLevel === "medium"

    return (
      <div className="space-y-5">

        {/* 楼盘信息条 */}
        {estateName && (
          <div className="flex items-center gap-3 px-4 py-3.5 bg-gray-50 border border-gray-200">
            <div className="h-9 w-9 bg-[#1E293B] flex items-center justify-center shrink-0">
              <Home className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1E293B] truncate font-josefin tracking-wide">{estateName}</p>
              {result.estateInfo?.address && (
                <p className="text-xs text-gray-400 truncate mt-0.5 font-josefin tracking-wide">{result.estateInfo.address}</p>
              )}
            </div>
            {result.estateInfo?.buildYear && (
              <span className="text-xs text-gray-400 shrink-0 border border-gray-200 bg-white px-2.5 py-1 font-josefin tracking-wider">
                {result.estateInfo.buildYear}年建
              </span>
            )}
          </div>
        )}

        {/* 估价结果卡片 */}
        <div className="bg-[#1E293B] text-white">
          {/* 顶部标签行 */}
          <div className="flex items-center justify-between px-7 pt-6 pb-0">
            <span className="font-josefin text-[10px] tracking-[0.25em] text-gray-500 uppercase font-semibold">
              估价结果
            </span>
            <span className={`font-josefin text-[10px] px-3 py-1 border tracking-[0.15em] uppercase font-semibold ${
              isHighConf
                ? "border-emerald-500/40 text-emerald-400"
                : isMedConf
                ? "border-amber-500/40 text-amber-400"
                : "border-orange-500/40 text-orange-400"
            }`}>
              {isHighConf ? "高置信度" : isMedConf ? "中置信度" : "参考值"}
            </span>
          </div>

          {/* 主价格区 */}
          <div className="px-7 pt-5 pb-6">
            <div className="font-cinzel text-5xl font-bold tracking-tight leading-none text-white">
              {result.formattedValue}
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="font-josefin text-xs text-gray-500 tracking-wider uppercase">单价</span>
              <span className="font-josefin text-lg font-semibold text-[#93C5FD] tracking-wide">{result.formattedUnitPrice}</span>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="mx-7 h-px bg-white/8" />

          {/* 三列数据 */}
          <div className="grid grid-cols-3 px-7 py-6 gap-4">
            <div className="space-y-2">
              <p className="font-josefin text-[10px] text-gray-500 tracking-[0.18em] uppercase font-semibold">参考案例</p>
              <div className="flex items-baseline gap-1">
                <span className="font-cinzel text-3xl font-bold text-white leading-none">{result.comparableCount}</span>
                <span className="font-josefin text-xs text-gray-500 tracking-wider">套</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-josefin text-[10px] text-gray-500 tracking-[0.18em] uppercase font-semibold">估价方法</p>
              <p className="font-josefin text-sm font-semibold text-white tracking-wide leading-tight">市场<br/>比较法</p>
            </div>
            <div className="space-y-2">
              <p className="font-josefin text-[10px] text-gray-500 tracking-[0.18em] uppercase font-semibold">估价日期</p>
              <p className="font-josefin text-sm font-semibold text-white tracking-wide leading-tight">{result.valuationDate}</p>
            </div>
          </div>
        </div>

        {/* 服务入口 */}
        <div>
          <p className="font-josefin text-[10px] tracking-[0.2em] text-gray-400 uppercase text-center font-semibold mb-3">
            需要进一步服务？
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button"
              onClick={() => { setServiceType("bank"); setStep("service") }}
              className="group flex flex-col items-center gap-4 py-6 px-4 border border-gray-200 bg-white hover:border-[#2563EB]/50 hover:shadow-md transition-all">
              <div className="h-14 w-14 bg-gray-50 border border-gray-200 group-hover:bg-[#2563EB]/8 group-hover:border-[#2563EB]/30 flex items-center justify-center transition-all">
                <Landmark className="h-7 w-7 text-[#2563EB]" />
              </div>
              <div className="text-center">
                <p className="font-josefin text-sm font-bold text-[#1E293B] tracking-wide">申请房产贷款</p>
                <p className="font-josefin text-xs text-gray-400 mt-1 tracking-wider">匹配合作银行</p>
              </div>
            </button>
            <button type="button"
              onClick={() => { setServiceType("appraiser"); setStep("service") }}
              className="group flex flex-col items-center gap-4 py-6 px-4 border border-gray-200 bg-white hover:border-[#2563EB]/50 hover:shadow-md transition-all">
              <div className="h-14 w-14 bg-gray-50 border border-gray-200 group-hover:bg-[#2563EB]/8 group-hover:border-[#2563EB]/30 flex items-center justify-center transition-all">
                <FileText className="h-7 w-7 text-[#2563EB]" />
              </div>
              <div className="text-center">
                <p className="font-josefin text-sm font-bold text-[#1E293B] tracking-wide">出具评估报告</p>
                <p className="font-josefin text-xs text-gray-400 mt-1 tracking-wider">权威法定报告</p>
              </div>
            </button>
          </div>
        </div>

        {/* 重新估价 */}
        <button type="button"
          className="w-full flex items-center justify-center gap-2 font-josefin text-xs text-gray-400 hover:text-gray-600 transition-colors py-1 tracking-[0.15em] uppercase"
          onClick={() => { setStep("form"); setResult(null) }}>
          <RotateCcw className="h-3.5 w-3.5" />重新估价
        </button>
      </div>
    )
  }

  // ── 服务页 ────────────────────────────────────────────────────────────────
  if (step === "service") {
    const orgList: OrgItem[] = serviceType === "bank" ? (banks || []) : (appraisers || [])
    const isLoading = serviceType === "bank" ? !banks : !appraisers
    const isBank = serviceType === "bank"

    return (
      <div className="space-y-4">

        {/* 面包屑 */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setStep("result")}
            className="flex items-center gap-1.5 font-josefin text-xs text-gray-500 hover:text-[#1E293B] transition-colors tracking-[0.12em] uppercase font-medium">
            <ArrowLeft className="h-3.5 w-3.5" />返回结果
          </button>
          <div className="h-3 w-px bg-gray-200" />
          <span className="font-josefin text-xs font-bold text-[#1E293B] tracking-[0.12em] uppercase">
            {isBank ? "合作银行" : "认证评估机构"}
          </span>
        </div>

        {/* 注册引导横幅 */}
        <div className="bg-[#1E293B] p-5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-josefin text-sm font-bold text-white tracking-wide">
                注册会员，一键发起申请
              </p>
              <p className="font-josefin text-xs text-gray-400 mt-1.5 leading-relaxed tracking-wide">
                注册后可直接向{isBank ? "银行" : "评估机构"}发起{isBank ? "贷款" : "评估"}申请，全程在线跟踪进度
              </p>
              <div className="flex gap-2 mt-4">
                <Link href="/register?role=customer">
                  <button type="button" className="font-josefin h-9 px-5 bg-white text-[#1E293B] text-xs font-bold hover:bg-gray-100 transition-colors tracking-[0.15em] uppercase">
                    免费注册
                  </button>
                </Link>
                <Link href="/login">
                  <button type="button" className="font-josefin h-9 px-5 bg-transparent text-white text-xs border border-white/25 hover:bg-white/10 transition-colors tracking-[0.15em] uppercase">
                    已有账号
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 机构列表 */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
            <p className="font-josefin text-xs text-gray-400 tracking-wider">加载中...</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {orgList.map((org) => (
              <div key={org.id}
                className="flex items-center gap-4 p-4 border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50 transition-all">
                <div className="h-10 w-10 bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                  {isBank
                    ? <Landmark className="h-5 w-5 text-[#2563EB]" />
                    : <Building2 className="h-5 w-5 text-[#2563EB]" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-josefin text-sm font-bold text-[#1E293B] truncate tracking-wide">{org.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {org.rating && renderStars(org.rating)}
                    {org.contactPhone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className="font-josefin text-xs text-gray-400 tracking-wide">{org.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Link href="/register?role=customer" className="shrink-0">
                  <button type="button" className="font-josefin h-9 px-5 text-xs bg-[#1E293B] text-white hover:bg-[#0f172a] transition-colors tracking-[0.15em] uppercase font-bold">
                    申请
                  </button>
                </Link>
              </div>
            ))}
            {orgList.length === 0 && (
              <div className="text-center py-10">
                <p className="font-josefin text-xs text-gray-400 tracking-wider">暂无合作机构，请稍后再试</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return null
}
