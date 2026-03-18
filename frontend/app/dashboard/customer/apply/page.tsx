"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import {
  Send, Upload, Home, Building2, Factory, MapPin, X, FileText,
  Image as ImageIcon, Loader2, CheckCircle2, AlertCircle,
  ChevronsUpDown, Check, PlusCircle
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { BACKEND_URL } from "@/lib/trpc"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

// 深圳城市 ID
const SHENZHEN_CITY_ID = 6

// 文件上传状态
interface UploadedFile {
  id: string
  name: string
  size: number
  url?: string
  status: "uploading" | "done" | "error"
  error?: string
}

// 楼盘信息（可能是数据库中的，也可能是手动录入的）
interface EstateOption {
  id: number | null   // 手动录入时为 null
  name: string
  address?: string | null
  propertyType?: string | null
  isManual?: boolean  // 是否手动录入
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ mimeType }: { mimeType?: string }) {
  if (mimeType?.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-blue-500" />
  return <FileText className="h-5 w-5 text-orange-500" />
}

// ── 楼盘搜索 Combobox ──
function EstateCombobox({
  cityId,
  districtId,
  value,
  onChange,
  disabled,
}: {
  cityId: number | null
  districtId: number | null
  value: EstateOption | null
  onChange: (estate: EstateOption | null) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showManualDialog, setShowManualDialog] = useState(false)

  // 手动录入表单
  const [manualName, setManualName] = useState("")
  const [manualAddress, setManualAddress] = useState("")
  const [manualType, setManualType] = useState("")

  // 防抖搜索
  const [debouncedQuery, setDebouncedQuery] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: searchResults, isLoading } = trpc.directory.searchEstatesForValuation.useQuery(
    {
      cityId: cityId || undefined,
      search: debouncedQuery || undefined,
      pageSize: 30,
    },
    {
      enabled: !!cityId && open,
      staleTime: 30 * 1000,
    }
  )

  // 过滤：如果有区域筛选，在前端再过滤一次（后端 searchEstatesForValuation 不支持 districtId）
  const filteredResults = searchResults || []

  const handleSelect = (estate: EstateOption) => {
    onChange(estate)
    setOpen(false)
    setSearchQuery("")
  }

  const handleManualSubmit = () => {
    if (!manualName.trim()) return
    const manualEstate: EstateOption = {
      id: null,
      name: manualName.trim(),
      address: manualAddress.trim() || null,
      propertyType: manualType || null,
      isManual: true,
    }
    onChange(manualEstate)
    setShowManualDialog(false)
    setOpen(false)
    setManualName("")
    setManualAddress("")
    setManualType("")
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal h-10",
              !value && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
            type="button"
          >
            <span className="truncate">
              {value ? (
                <span className="flex items-center gap-1.5">
                  {value.isManual && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium">手动</span>
                  )}
                  {value.name}
                </span>
              ) : (
                cityId ? "请搜索或选择楼盘" : "请先选择城市"
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="搜索楼盘名称或拼音首字母（如 WKJY）..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  搜索中...
                </div>
              ) : (
                <>
                  {filteredResults.length > 0 ? (
                    <CommandGroup heading={`找到 ${filteredResults.length} 个楼盘`}>
                      {filteredResults.map((estate) => (
                        <CommandItem
                          key={estate.id}
                          value={String(estate.id)}
                          onSelect={() => handleSelect({
                            id: estate.id,
                            name: estate.name,
                            address: estate.address,
                            propertyType: estate.propertyType,
                          })}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              value?.id === estate.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{estate.name}</div>
                            {estate.address && (
                              <div className="text-xs text-muted-foreground truncate">{estate.address}</div>
                            )}
                          </div>
                          {estate.propertyType && (
                            <span className="ml-2 text-xs text-muted-foreground shrink-0">{estate.propertyType}</span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ) : (
                    <CommandEmpty>
                      <div className="py-2 text-center">
                        <p className="text-sm text-muted-foreground mb-3">
                          {searchQuery
                            ? `未找到"${searchQuery}"相关楼盘`
                            : "暂无楼盘数据"}
                        </p>
                      </div>
                    </CommandEmpty>
                  )}

                  {/* 手动录入入口 */}
                  <div className="border-t p-1">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm text-primary hover:bg-accent transition-colors"
                      onClick={() => {
                        setShowManualDialog(true)
                        setOpen(false)
                        if (searchQuery) setManualName(searchQuery)
                      }}
                    >
                      <PlusCircle className="h-4 w-4" />
                      手动录入楼盘信息
                    </button>
                  </div>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* 手动录入对话框 */}
      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>手动录入楼盘信息</DialogTitle>
            <DialogDescription>
              未在数据库中找到您的楼盘？请手动填写楼盘基本信息。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="manual-name">
                楼盘名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="manual-name"
                placeholder="请输入楼盘名称"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-address">楼盘地址</Label>
              <Input
                id="manual-address"
                placeholder="请输入楼盘地址（可选）"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-type">物业类型</Label>
              <Select value={manualType} onValueChange={setManualType}>
                <SelectTrigger id="manual-type">
                  <SelectValue placeholder="请选择物业类型（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="住宅">住宅</SelectItem>
                  <SelectItem value="商业">商业</SelectItem>
                  <SelectItem value="办公">办公</SelectItem>
                  <SelectItem value="工业">工业</SelectItem>
                  <SelectItem value="其他">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualDialog(false)}>
              取消
            </Button>
            <Button onClick={handleManualSubmit} disabled={!manualName.trim()}>
              确认录入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── 主页面 ──
export default function CustomerApplyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [propertyType, setPropertyType] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 级联选择状态
  const [selectedCityId, setSelectedCityId] = useState<number>(SHENZHEN_CITY_ID)
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null)
  const [selectedEstate, setSelectedEstate] = useState<EstateOption | null>(null)
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null)
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null)

  // 表单字段
  const [area, setArea] = useState("")
  const [buildYear, setBuildYear] = useState("")
  const [floor, setFloor] = useState("")
  const [purpose, setPurpose] = useState("")
  const [description, setDescription] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")

  // 文件上传
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── tRPC mutation ──
  const createProject = trpc.projects.create.useMutation()

  // ── tRPC 查询 ──
  const { data: citiesData } = trpc.directory.listCities.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })

  const { data: districtsData } = trpc.directory.listDistricts.useQuery(
    { cityId: selectedCityId },
    { enabled: !!selectedCityId, staleTime: 5 * 60 * 1000 }
  )

  const { data: buildingsData, isLoading: buildingsLoading } = trpc.directory.getBuildingsForValuation.useQuery(
    { estateId: selectedEstate?.id! },
    { enabled: !!selectedEstate?.id, staleTime: 2 * 60 * 1000 }
  )

  const { data: unitsData, isLoading: unitsLoading } = trpc.directory.getUnitsForValuation.useQuery(
    { buildingId: selectedBuildingId! },
    { enabled: !!selectedBuildingId, staleTime: 2 * 60 * 1000 }
  )

  // 城市列表：深圳排第一
  const sortedCities = citiesData?.items
    ? [
        ...citiesData.items.filter((c) => c.id === SHENZHEN_CITY_ID),
        ...citiesData.items.filter((c) => c.id !== SHENZHEN_CITY_ID),
      ]
    : []

  const selectedCity = sortedCities.find((c) => c.id === selectedCityId)
  const selectedDistrict = districtsData?.items?.find((d) => d.id === selectedDistrictId)
  const selectedBuilding = buildingsData?.find((b) => b.id === selectedBuildingId)
  const selectedUnit = unitsData?.find((u) => u.id === selectedUnitId)

  // ── 文件上传 ──
  const uploadFile = useCallback(async (file: File) => {
    const tempId = `${Date.now()}-${Math.random()}`
    setUploadedFiles((prev) => [...prev, { id: tempId, name: file.name, size: file.size, status: "uploading" }])
    try {
      const formData = new FormData()
      formData.append("file", file)
      const tokenMatch = document.cookie.match(/(?:^|;\s*)token=([^;]+)/)
      const token = tokenMatch ? tokenMatch[1] : ""
      const backendUrl = BACKEND_URL || "http://localhost:8721"
      const res = await fetch(`${backendUrl}/api/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "上传失败" }))
        throw new Error(err.error || "上传失败")
      }
      const data = await res.json()
      setUploadedFiles((prev) =>
        prev.map((f) => f.id === tempId ? { ...f, status: "done", url: data.url } : f)
      )
    } catch (err: any) {
      setUploadedFiles((prev) =>
        prev.map((f) => f.id === tempId ? { ...f, status: "error", error: err.message } : f)
      )
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(uploadFile)
    e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    Array.from(e.dataTransfer.files).forEach(uploadFile)
  }

  // ── 级联重置 ──
  const handleCityChange = (cityId: number) => {
    setSelectedCityId(cityId)
    setSelectedDistrictId(null)
    setSelectedEstate(null)
    setSelectedBuildingId(null)
    setSelectedUnitId(null)
  }

  const handleDistrictChange = (districtId: number | null) => {
    setSelectedDistrictId(districtId)
    setSelectedEstate(null)
    setSelectedBuildingId(null)
    setSelectedUnitId(null)
  }

  const handleEstateChange = (estate: EstateOption | null) => {
    setSelectedEstate(estate)
    setSelectedBuildingId(null)
    setSelectedUnitId(null)
  }

  const handleBuildingChange = (buildingId: number) => {
    setSelectedBuildingId(buildingId)
    setSelectedUnitId(null)
  }

  const handleUnitChange = (unitId: number) => {
    setSelectedUnitId(unitId)
    const unit = unitsData?.find((u) => u.id === unitId)
    if (unit) {
      if (unit.area) setArea(String(unit.area))
      if (unit.floor) setFloor(String(unit.floor))
    }
  }

  // ── 提交申请 ──
  const handleSubmit = async () => {
    if (!selectedEstate) return
    setIsSubmitting(true)
    try {
      const purposeLabel: Record<string, string> = {
        mortgage: "抵押贷款", sale: "交易买卖", inheritance: "继承分割", other: "其他"
      }
      // 构建标题：楼盘名 + 楼栋 + 房屋
      const titleParts = [selectedEstate.name]
      if (selectedBuilding) titleParts.push(selectedBuilding.name)
      if (selectedUnit) titleParts.push(selectedUnit.unitNumber)
      const title = titleParts.join(" - ") + " 评估申请"

      const doneFiles = uploadedFiles
        .filter((f) => f.status === "done" && f.url)
        .map((f) => ({ name: f.name, url: f.url!, size: f.size }))

      const result = await createProject.mutateAsync({
        title,
        propertyType: selectedEstate.propertyType || propertyType || undefined,
        propertyAddress: selectedEstate.address || undefined,
        area: area ? Number(area) : undefined,
        cityId: selectedCityId || undefined,
        estateId: selectedEstate.id || undefined,
        buildingId: selectedBuildingId || undefined,
        unitId: selectedUnitId || undefined,
        floor: floor || undefined,
        buildYear: buildYear ? Number(buildYear) : undefined,
        purpose: purpose || undefined,
        contactName: contactName || undefined,
        contactPhone: contactPhone || undefined,
        attachments: doneFiles.length > 0 ? doneFiles : undefined,
        manualEstateName: selectedEstate.isManual ? selectedEstate.name : undefined,
        description: description || undefined,
      })

      toast({
        title: "申请提交成功！",
        description: `项目编号：${result.projectNo}，我们将尽快处理您的评估申请。`,
      })

      // 跳转到我的申请列表
      setTimeout(() => {
        router.push("/dashboard/customer/applications")
      }, 1500)
    } catch (err: any) {
      toast({
        title: "提交失败",
        description: err?.message || "网络错误，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">申请评估</h1>
        <p className="text-muted-foreground">提交房产评估申请</p>
      </div>

      {/* 进度指示 */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        {[
          { num: 1, label: "选择类型" },
          { num: 2, label: "填写信息" },
          { num: 3, label: "提交申请" },
        ].map(({ num, label }, i, arr) => (
          <div key={num} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${step >= num ? "text-primary" : "text-muted-foreground"}`}>
              <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= num ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {num}
              </span>
              <span>{label}</span>
            </div>
            {i < arr.length - 1 && <div className="flex-1 h-px bg-border mx-4" />}
          </div>
        ))}
      </div>

      {/* ── 步骤 1：选择类型 ── */}
      {step === 1 && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Home, title: "住宅评估", desc: "公寓、别墅、住宅小区等", value: "residential" },
            { icon: Building2, title: "商业评估", desc: "办公楼、商铺、综合体等", value: "commercial" },
            { icon: Factory, title: "工业评估", desc: "厂房、仓库、工业园等", value: "industrial" },
          ].map(({ icon: Icon, title, desc, value }) => (
            <Card
              key={value}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => { setPropertyType(value); setStep(2) }}
            >
              <CardHeader className="text-center">
                <Icon className="h-12 w-12 mx-auto text-primary" />
                <CardTitle>{title}</CardTitle>
                <CardDescription>{desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* ── 步骤 2：填写信息 ── */}
      {step === 2 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>房产信息</CardTitle>
                <CardDescription>请填写待评估房产的详细信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">

                {/* 城市 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    城市 <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={selectedCityId ? String(selectedCityId) : ""}
                    onValueChange={(v) => handleCityChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择城市" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedCities.map((city) => (
                        <SelectItem key={city.id} value={String(city.id)}>
                          {city.name}
                          {city.id === SHENZHEN_CITY_ID && (
                            <span className="ml-1 text-xs text-primary">（默认）</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 区域 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">区域</Label>
                  <Select
                    value={selectedDistrictId ? String(selectedDistrictId) : ""}
                    onValueChange={(v) => handleDistrictChange(v && v !== "0" ? Number(v) : null)}
                    disabled={!selectedCityId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedCityId ? "请选择区域（可选）" : "请先选择城市"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">全部区域</SelectItem>
                      {districtsData?.items?.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 楼盘 — 搜索式 Combobox */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    楼盘 <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    支持中文名称或拼音首字母搜索，例如输入 <code className="bg-muted px-1 rounded">WKJY</code> 可找到"万科俊园"
                  </p>
                  <EstateCombobox
                    cityId={selectedCityId}
                    districtId={selectedDistrictId}
                    value={selectedEstate}
                    onChange={handleEstateChange}
                    disabled={!selectedCityId}
                  />
                </div>

                {/* 楼栋 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">楼栋</Label>
                  <Select
                    value={selectedBuildingId ? String(selectedBuildingId) : ""}
                    onValueChange={(v) => handleBuildingChange(Number(v))}
                    disabled={!selectedEstate?.id}
                  >
                    <SelectTrigger>
                      {buildingsLoading ? (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" /> 加载中...
                        </span>
                      ) : (
                        <SelectValue placeholder={
                          selectedEstate?.isManual
                            ? "手动录入楼盘暂无楼栋数据"
                            : selectedEstate
                            ? "请选择楼栋"
                            : "请先选择楼盘"
                        } />
                      )}
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {buildingsData?.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.name}
                          {b.floors && <span className="ml-1 text-xs text-muted-foreground">（{b.floors}层）</span>}
                        </SelectItem>
                      ))}
                      {buildingsData?.length === 0 && (
                        <div className="py-4 text-center text-sm text-muted-foreground">暂无楼栋数据</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* 房屋 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">房屋</Label>
                  <Select
                    value={selectedUnitId ? String(selectedUnitId) : ""}
                    onValueChange={(v) => handleUnitChange(Number(v))}
                    disabled={!selectedBuildingId}
                  >
                    <SelectTrigger>
                      {unitsLoading ? (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" /> 加载中...
                        </span>
                      ) : (
                        <SelectValue placeholder={selectedBuildingId ? "请选择房屋（可选）" : "请先选择楼栋"} />
                      )}
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {unitsData?.map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.unitNumber}
                          {u.floor && <span className="text-xs text-muted-foreground ml-1">{u.floor}层</span>}
                          {u.area && <span className="text-xs text-muted-foreground ml-1">{u.area}㎡</span>}
                          {u.rooms && <span className="text-xs text-muted-foreground ml-1">{u.rooms}室</span>}
                        </SelectItem>
                      ))}
                      {unitsData?.length === 0 && (
                        <div className="py-4 text-center text-sm text-muted-foreground">暂无房屋数据</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* 详细地址 */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">详细地址</Label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      placeholder={selectedEstate?.address || "请输入详细地址（门牌号等）"}
                      className="pl-8"
                      defaultValue={selectedEstate?.address || ""}
                    />
                  </div>
                </div>

                {/* 面积 + 建成年份 */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="area" className="text-sm font-medium">建筑面积 (㎡)</Label>
                    <Input
                      id="area"
                      type="number"
                      placeholder="请输入面积"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year" className="text-sm font-medium">建成年份</Label>
                    <Input
                      id="year"
                      type="number"
                      placeholder="例如: 2015"
                      value={buildYear}
                      onChange={(e) => setBuildYear(e.target.value)}
                    />
                  </div>
                </div>

                {/* 楼层 + 评估目的 */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="floor" className="text-sm font-medium">所在楼层</Label>
                    <Input
                      id="floor"
                      placeholder="例如: 15/28"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">评估目的</Label>
                    <Select value={purpose} onValueChange={setPurpose}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择评估目的" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mortgage">抵押贷款</SelectItem>
                        <SelectItem value="sale">交易买卖</SelectItem>
                        <SelectItem value="inheritance">继承分割</SelectItem>
                        <SelectItem value="other">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 补充说明 */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">补充说明</Label>
                  <Textarea
                    id="description"
                    placeholder="其他需要说明的情况..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* 上传资料 */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">上传资料</Label>
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">拖拽文件到此处或点击上传</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      支持房产证、身份证等资料（PDF、图片、Word，最大 10MB）
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      {uploadedFiles.map((file) => (
                        <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                          <FileIcon />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                          <div className="shrink-0">
                            {file.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                            {file.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            {file.status === "error" && <AlertCircle className="h-4 w-4 text-destructive" title={file.error} />}
                          </div>
                          <button
                            type="button"
                            onClick={() => setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id))}
                            className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 联系方式 */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>联系方式</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">姓名</Label>
                  <Input id="name" placeholder="请输入姓名" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">手机号码</Label>
                  <Input id="phone" placeholder="请输入手机号" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>上一步</Button>
              <Button className="flex-1" onClick={() => setStep(3)} disabled={!selectedEstate}>下一步</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 步骤 3：确认提交 ── */}
      {step === 3 && (
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>确认提交</CardTitle>
            <CardDescription>请确认以上信息无误后提交申请</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">房产类型：</span>
                {propertyType === "residential" ? "住宅" : propertyType === "commercial" ? "商业" : "工业"}
              </p>
              {selectedCity && <p><span className="text-muted-foreground">城市：</span>{selectedCity.name}</p>}
              {selectedDistrict && <p><span className="text-muted-foreground">区域：</span>{selectedDistrict.name}</p>}
              {selectedEstate && (
                <p>
                  <span className="text-muted-foreground">楼盘：</span>
                  {selectedEstate.name}
                  {selectedEstate.isManual && (
                    <span className="ml-1.5 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">手动录入</span>
                  )}
                </p>
              )}
              {selectedBuilding && <p><span className="text-muted-foreground">楼栋：</span>{selectedBuilding.name}</p>}
              {selectedUnit && <p><span className="text-muted-foreground">房屋：</span>{selectedUnit.unitNumber}</p>}
              {area && <p><span className="text-muted-foreground">建筑面积：</span>{area} ㎡</p>}
              {floor && <p><span className="text-muted-foreground">所在楼层：</span>{floor}</p>}
              {purpose && (
                <p><span className="text-muted-foreground">评估目的：</span>
                  {{ mortgage: "抵押贷款", sale: "交易买卖", inheritance: "继承分割", other: "其他" }[purpose] || purpose}
                </p>
              )}
              {contactName && <p><span className="text-muted-foreground">联系人：</span>{contactName}</p>}
              {contactPhone && <p><span className="text-muted-foreground">手机号：</span>{contactPhone}</p>}
              {uploadedFiles.filter((f) => f.status === "done").length > 0 && (
                <p><span className="text-muted-foreground">上传资料：</span>
                  {uploadedFiles.filter((f) => f.status === "done").length} 个文件
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>返回修改</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />提交中...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" />提交申请</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
