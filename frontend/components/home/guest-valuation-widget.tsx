"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Calculator, MapPin, Building2, Star, Loader2, ChevronRight,
  Landmark, FileText, Phone, UserPlus, Sparkles, AlertCircle,
  Search, X, Home, RotateCcw, CheckCircle2,
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder={disabled ? "请先选择城市" : "输入楼盘名称搜索，如：万科城"}
          disabled={disabled}
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value)
            setOpen(true)
            if (!e.target.value) onChange(null)
          }}
          onFocus={() => keyword.length >= 1 && setOpen(true)}
          className="w-full h-11 pl-9 pr-9 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        />
        {keyword && (
          <button type="button" onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && debouncedKw.length >= 1 && (
        <div ref={dropdownRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-card rounded-xl border border-border shadow-xl overflow-hidden max-h-64 overflow-y-auto">
          {isFetching ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />搜索中...
            </div>
          ) : !estates || estates.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">未找到楼盘，请尝试其他关键词</div>
          ) : (
            estates.map((estate) => (
              <button key={estate.id} type="button" onClick={() => handleSelect(estate)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left border-b border-border/50 last:border-0">
                <div className="mt-0.5 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Home className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{estate.name}</p>
                  {estate.address && <p className="text-xs text-muted-foreground truncate mt-0.5">{estate.address}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    {estate.buildYear && <span className="text-xs text-muted-foreground">建于 {estate.buildYear}</span>}
                    {estate.totalUnits && estate.totalUnits > 0 && <span className="text-xs text-muted-foreground">{estate.totalUnits} 套</span>}
                  </div>
                </div>
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

  const confidenceLabel = (level: string) => {
    if (level === "high") return { text: "高置信度", color: "bg-emerald-100 text-emerald-700 border border-emerald-200" }
    if (level === "medium") return { text: "中置信度", color: "bg-amber-100 text-amber-700 border border-amber-200" }
    return { text: "参考值", color: "bg-orange-100 text-orange-700 border border-orange-200" }
  }

  const renderStars = (rating: string | null) => {
    const r = Number(rating) || 0
    return (
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map((i) => (
          <Star key={i} className={`h-3 w-3 ${i <= Math.round(r) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
        ))}
        <span className="text-xs text-muted-foreground ml-1">{r.toFixed(1)}</span>
      </div>
    )
  }

  if (step === "form") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">城市</Label>
            <Select value={formData.cityId ? String(formData.cityId) : ""}
              onValueChange={(v) => {
                const city = cities?.find((c) => c.id === Number(v))
                setFormData((f) => ({ ...f, cityId: Number(v), cityName: city?.name || "", districtId: 0, districtName: "" }))
                setSelectedEstate(null)
              }}>
              <SelectTrigger className="h-11 rounded-xl border-border/80 bg-muted/30 hover:bg-muted/50 transition-colors">
                <SelectValue placeholder="选择城市" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {(cities || []).map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">区域</Label>
            <Select value={formData.districtId ? String(formData.districtId) : ""}
              onValueChange={(v) => {
                const d = districts?.find((x) => x.id === Number(v))
                setFormData((f) => ({ ...f, districtId: Number(v), districtName: d?.name || "" }))
                setSelectedEstate(null)
              }}
              disabled={!formData.cityId}>
              <SelectTrigger className="h-11 rounded-xl border-border/80 bg-muted/30 hover:bg-muted/50 transition-colors disabled:opacity-40">
                <SelectValue placeholder="选择区域" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {(districts || []).map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              楼盘名称 <span className="text-primary font-bold">*</span>
            </Label>
            {selectedEstate && (
              <span className="text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />已匹配楼盘数据
              </span>
            )}
          </div>
          <EstateSearchInput
            cityId={formData.cityId}
            districtId={formData.districtId || undefined}
            value={selectedEstate}
            onChange={setSelectedEstate}
            disabled={!formData.cityId}
          />
          <p className="text-xs text-muted-foreground">选择楼盘后可获得基于该楼盘真实成交数据的精准估价</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">物业类型</Label>
            <Select value={formData.propertyType} onValueChange={(v) => setFormData((f) => ({ ...f, propertyType: v }))}>
              <SelectTrigger className="h-11 rounded-xl border-border/80 bg-muted/30 hover:bg-muted/50 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {PROPERTY_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">建筑面积（㎡）</Label>
            <Input type="number" placeholder="如：89.5"
              className="h-11 rounded-xl border-border/80 bg-muted/30 hover:bg-muted/50 focus:bg-background transition-colors"
              value={formData.buildingArea}
              onChange={(e) => setFormData((f) => ({ ...f, buildingArea: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">所在楼层</Label>
            <Input type="number" placeholder="如：10"
              className="h-11 rounded-xl border-border/80 bg-muted/30 hover:bg-muted/50 focus:bg-background transition-colors"
              value={formData.floor}
              onChange={(e) => setFormData((f) => ({ ...f, floor: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">总楼层</Label>
            <Input type="number" placeholder="如：32"
              className="h-11 rounded-xl border-border/80 bg-muted/30 hover:bg-muted/50 focus:bg-background transition-colors"
              value={formData.totalFloors}
              onChange={(e) => setFormData((f) => ({ ...f, totalFloors: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">楼龄（年）</Label>
            <Input type="number" placeholder="如：10"
              className="h-11 rounded-xl border-border/80 bg-muted/30 hover:bg-muted/50 focus:bg-background transition-colors"
              value={formData.buildingAge}
              onChange={(e) => setFormData((f) => ({ ...f, buildingAge: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">朝向</Label>
            <Select value={formData.orientation} onValueChange={(v) => setFormData((f) => ({ ...f, orientation: v }))}>
              <SelectTrigger className="h-11 rounded-xl border-border/80 bg-muted/30 hover:bg-muted/50 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {ORIENTATION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">装修情况</Label>
            <Select value={formData.decoration} onValueChange={(v) => setFormData((f) => ({ ...f, decoration: v }))}>
              <SelectTrigger className="h-11 rounded-xl border-border/80 bg-muted/30 hover:bg-muted/50 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {DECORATION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">配套设施</Label>
          <div className="flex gap-2">
            <button type="button"
              onClick={() => setFormData((f) => ({ ...f, hasElevator: !f.hasElevator }))}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                formData.hasElevator
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/30 text-muted-foreground border-border/80 hover:bg-muted/60"
              }`}>
              <Building2 className="h-3.5 w-3.5" />有电梯
            </button>
            <button type="button"
              onClick={() => setFormData((f) => ({ ...f, hasParking: !f.hasParking }))}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                formData.hasParking
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/30 text-muted-foreground border-border/80 hover:bg-muted/60"
              }`}>
              <MapPin className="h-3.5 w-3.5" />有车位
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        <Button
          className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          onClick={handleCalculate}
          disabled={calculateMutation.isPending}>
          {calculateMutation.isPending ? (
            <><Loader2 className="h-5 w-5 mr-2 animate-spin" />AI 估价中...</>
          ) : (
            <><Sparkles className="h-5 w-5 mr-2" />一键免费估价</>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          基于 <span className="font-semibold text-foreground">217万+</span> 真实成交案例，AI 智能估价引擎驱动
        </p>
      </div>
    )
  }

  if (step === "result" && result) {
    const conf = confidenceLabel(result.confidenceLevel)
    const estateName = result.estateName || result.estateInfo?.name
    return (
      <div className="space-y-5">
        {estateName && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/15">
            <Home className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary truncate">{estateName}</p>
              {result.estateInfo?.address && <p className="text-xs text-muted-foreground truncate">{result.estateInfo.address}</p>}
            </div>
            {result.estateInfo?.buildYear && <span className="text-xs text-muted-foreground shrink-0">建于 {result.estateInfo.buildYear}</span>}
          </div>
        )}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/95 to-primary/85 p-6 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-6 -translate-x-6" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-white/15 flex items-center justify-center">
                  <Calculator className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-white/80">AI 估价结果</span>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${conf.color}`}>{conf.text}</span>
            </div>
            <div className="mb-4">
              <div className="text-4xl font-bold tracking-tight">{result.formattedValue}</div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-sm text-white/70">单价</span>
                <span className="text-lg font-semibold">{result.formattedUnitPrice}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/15">
              <div className="text-center">
                <div className="text-xs text-white/60 mb-0.5">估价方法</div>
                <div className="text-xs font-semibold">{result.method}</div>
              </div>
              <div className="text-center border-x border-white/15">
                <div className="text-xs text-white/60 mb-0.5">参考案例</div>
                <div className="text-xs font-semibold">{result.comparableCount} 套</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-white/60 mb-0.5">估价日期</div>
                <div className="text-xs font-semibold">{result.valuationDate}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-center">您需要什么服务？</p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button"
              onClick={() => { setServiceType("bank"); setStep("service") }}
              className="group flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-border bg-muted/20 hover:border-blue-300 hover:bg-blue-50/50 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Landmark className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">申请房产贷款</p>
                <p className="text-xs text-muted-foreground mt-0.5">匹配合适银行</p>
              </div>
            </button>
            <button type="button"
              onClick={() => { setServiceType("appraiser"); setStep("service") }}
              className="group flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-border bg-muted/20 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">出具评估报告</p>
                <p className="text-xs text-muted-foreground mt-0.5">权威机构认证</p>
              </div>
            </button>
          </div>
        </div>
        <button type="button"
          className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          onClick={() => { setStep("form"); setResult(null) }}>
          <RotateCcw className="h-3.5 w-3.5" />重新估价
        </button>
      </div>
    )
  }

  if (step === "service") {
    const orgList: OrgItem[] = serviceType === "bank" ? (banks || []) : (appraisers || [])
    const isLoading = serviceType === "bank" ? !banks : !appraisers
    const isBank = serviceType === "bank"
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setStep("result")}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            ← 返回
          </button>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm font-semibold">{isBank ? "🏦 合作银行" : "🏢 认证评估机构"}</span>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-4 text-white">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/10 -translate-y-6 translate-x-6" />
          <div className="relative flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">注册会员，一键发起需求</p>
              <p className="text-xs text-white/75 mt-0.5">
                注册后可直接向{isBank ? "银行" : "评估机构"}发起{isBank ? "贷款" : "评估"}申请，全程在线跟踪
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3 relative">
            <Link href="/register?role=customer" className="flex-1">
              <Button size="sm" variant="secondary" className="w-full h-8 text-xs font-semibold rounded-lg">免费注册</Button>
            </Link>
            <Link href="/login" className="flex-1">
              <Button size="sm" variant="ghost" className="w-full h-8 text-xs text-white border border-white/25 hover:bg-white/10 rounded-lg">已有账号登录</Button>
            </Link>
          </div>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-0.5">
            {orgList.map((org) => (
              <div key={org.id}
                className="group flex items-start gap-3 p-3.5 rounded-2xl border border-border/60 bg-card hover:border-primary/25 hover:shadow-sm transition-all">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isBank ? "bg-blue-100" : "bg-emerald-100"
                }`}>
                  {isBank ? <Landmark className="h-5 w-5 text-blue-600" /> : <Building2 className="h-5 w-5 text-emerald-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{org.name}</p>
                    {org.rating && renderStars(org.rating)}
                  </div>
                  {org.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{org.description}</p>}
                  {org.contactPhone && (
                    <div className="flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{org.contactPhone}</span>
                    </div>
                  )}
                </div>
                <Link href="/register?role=customer" className="shrink-0">
                  <Button size="sm"
                    className={`h-8 text-xs px-3 rounded-lg ${isBank ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}>
                    申请<ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </Link>
              </div>
            ))}
            {orgList.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">暂无合作机构，请稍后再试</div>
            )}
          </div>
        )}
      </div>
    )
  }

  return null
}
