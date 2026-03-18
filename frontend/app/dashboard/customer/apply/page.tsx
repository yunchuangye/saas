"use client"

import { useState, useRef, useCallback } from "react"
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
  Send, Upload, Home, Building2, Factory, MapPin, X, FileText,
  Image as ImageIcon, Loader2, CheckCircle2, AlertCircle
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { BACKEND_URL } from "@/lib/trpc"

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ mimeType }: { mimeType?: string }) {
  if (mimeType?.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-blue-500" />
  return <FileText className="h-5 w-5 text-orange-500" />
}

export default function CustomerApplyPage() {
  const [step, setStep] = useState(1)
  const [propertyType, setPropertyType] = useState("")

  // 级联选择状态
  const [selectedCityId, setSelectedCityId] = useState<number>(SHENZHEN_CITY_ID)
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null)
  const [selectedEstateId, setSelectedEstateId] = useState<number | null>(null)
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

  // ── tRPC 查询 ──
  const { data: citiesData } = trpc.directory.listCities.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })

  const { data: districtsData } = trpc.directory.listDistricts.useQuery(
    { cityId: selectedCityId },
    { enabled: !!selectedCityId, staleTime: 5 * 60 * 1000 }
  )

  const { data: estatesData, isLoading: estatesLoading } = trpc.directory.listEstates.useQuery(
    {
      cityId: selectedCityId || undefined,
      districtId: selectedDistrictId || undefined,
      pageSize: 200,
    },
    { enabled: !!selectedCityId, staleTime: 2 * 60 * 1000 }
  )

  const { data: buildingsData, isLoading: buildingsLoading } = trpc.directory.getBuildingsForValuation.useQuery(
    { estateId: selectedEstateId! },
    { enabled: !!selectedEstateId, staleTime: 2 * 60 * 1000 }
  )

  const { data: unitsData, isLoading: unitsLoading } = trpc.directory.getUnitsForValuation.useQuery(
    { buildingId: selectedBuildingId! },
    { enabled: !!selectedBuildingId, staleTime: 2 * 60 * 1000 }
  )

  // 城市列表：深圳排第一，其余按原顺序
  const sortedCities = citiesData?.items
    ? [
        ...citiesData.items.filter((c) => c.id === SHENZHEN_CITY_ID),
        ...citiesData.items.filter((c) => c.id !== SHENZHEN_CITY_ID),
      ]
    : []

  // 当前选中的楼盘/楼栋/房屋名称（用于确认页展示）
  const selectedEstate = estatesData?.items?.find((e) => e.id === selectedEstateId)
  const selectedBuilding = buildingsData?.find((b) => b.id === selectedBuildingId)
  const selectedUnit = unitsData?.find((u) => u.id === selectedUnitId)
  const selectedCity = sortedCities.find((c) => c.id === selectedCityId)
  const selectedDistrict = districtsData?.items?.find((d) => d.id === selectedDistrictId)

  // ── 文件上传处理 ──
  const uploadFile = useCallback(async (file: File) => {
    const tempId = `${Date.now()}-${Math.random()}`
    const newFile: UploadedFile = {
      id: tempId,
      name: file.name,
      size: file.size,
      status: "uploading",
    }
    setUploadedFiles((prev) => [...prev, newFile])

    try {
      const formData = new FormData()
      formData.append("file", file)

      // 从 cookie 获取 token
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
        prev.map((f) =>
          f.id === tempId ? { ...f, status: "done", url: data.url } : f
        )
      )
    } catch (err: any) {
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === tempId ? { ...f, status: "error", error: err.message } : f
        )
      )
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(uploadFile)
    e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    files.forEach(uploadFile)
  }

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  // 城市切换时重置下级
  const handleCityChange = (cityId: number) => {
    setSelectedCityId(cityId)
    setSelectedDistrictId(null)
    setSelectedEstateId(null)
    setSelectedBuildingId(null)
    setSelectedUnitId(null)
  }

  // 区域切换时重置下级
  const handleDistrictChange = (districtId: number | null) => {
    setSelectedDistrictId(districtId)
    setSelectedEstateId(null)
    setSelectedBuildingId(null)
    setSelectedUnitId(null)
  }

  // 楼盘切换时重置下级
  const handleEstateChange = (estateId: number) => {
    setSelectedEstateId(estateId)
    setSelectedBuildingId(null)
    setSelectedUnitId(null)
    // 自动填充面积（如果选了房屋）
  }

  // 楼栋切换时重置下级
  const handleBuildingChange = (buildingId: number) => {
    setSelectedBuildingId(buildingId)
    setSelectedUnitId(null)
  }

  // 房屋选择时自动填充面积
  const handleUnitChange = (unitId: number) => {
    setSelectedUnitId(unitId)
    const unit = unitsData?.find((u) => u.id === unitId)
    if (unit) {
      if (unit.area) setArea(String(unit.area))
      if (unit.floor) setFloor(String(unit.floor))
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

                {/* ── 城市 ── */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">城市 <span className="text-destructive">*</span></Label>
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

                {/* ── 区域 ── */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">区域</Label>
                  <Select
                    value={selectedDistrictId ? String(selectedDistrictId) : ""}
                    onValueChange={(v) => handleDistrictChange(v ? Number(v) : null)}
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

                {/* ── 楼盘 ── */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">楼盘 <span className="text-destructive">*</span></Label>
                  <Select
                    value={selectedEstateId ? String(selectedEstateId) : ""}
                    onValueChange={(v) => handleEstateChange(Number(v))}
                    disabled={!selectedCityId}
                  >
                    <SelectTrigger>
                      {estatesLoading ? (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" /> 加载中...
                        </span>
                      ) : (
                        <SelectValue placeholder={selectedCityId ? "请选择楼盘" : "请先选择城市"} />
                      )}
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {estatesData?.items?.map((e) => (
                        <SelectItem key={e.id} value={String(e.id)}>
                          {e.name}
                          {e.address && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              {e.address.slice(0, 20)}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                      {estatesData?.items?.length === 0 && (
                        <div className="py-4 text-center text-sm text-muted-foreground">暂无楼盘数据</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* ── 楼栋 ── */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">楼栋</Label>
                  <Select
                    value={selectedBuildingId ? String(selectedBuildingId) : ""}
                    onValueChange={(v) => handleBuildingChange(Number(v))}
                    disabled={!selectedEstateId}
                  >
                    <SelectTrigger>
                      {buildingsLoading ? (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" /> 加载中...
                        </span>
                      ) : (
                        <SelectValue placeholder={selectedEstateId ? "请选择楼栋" : "请先选择楼盘"} />
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

                {/* ── 房屋 ── */}
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

                {/* ── 详细地址 ── */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">详细地址</Label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      placeholder={
                        selectedEstate
                          ? selectedEstate.address || "请输入详细地址（门牌号等）"
                          : "请输入详细地址"
                      }
                      className="pl-8"
                      defaultValue={selectedEstate?.address || ""}
                    />
                  </div>
                </div>

                {/* ── 面积 + 建成年份 ── */}
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

                {/* ── 楼层 + 评估目的 ── */}
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

                {/* ── 补充说明 ── */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">补充说明</Label>
                  <Textarea
                    id="description"
                    placeholder="其他需要说明的情况..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* ── 上传资料 ── */}
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

                  {/* 已上传文件列表 */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                        >
                          <FileIcon />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                          <div className="shrink-0">
                            {file.status === "uploading" && (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            )}
                            {file.status === "done" && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                            {file.status === "error" && (
                              <AlertCircle className="h-4 w-4 text-destructive" title={file.error} />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(file.id)}
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

          {/* ── 联系方式 ── */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>联系方式</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">姓名</Label>
                  <Input
                    id="name"
                    placeholder="请输入姓名"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">手机号码</Label>
                  <Input
                    id="phone"
                    placeholder="请输入手机号"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                上一步
              </Button>
              <Button
                className="flex-1"
                onClick={() => setStep(3)}
                disabled={!selectedEstateId}
              >
                下一步
              </Button>
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
              {selectedEstate && <p><span className="text-muted-foreground">楼盘：</span>{selectedEstate.name}</p>}
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
                <p>
                  <span className="text-muted-foreground">上传资料：</span>
                  {uploadedFiles.filter((f) => f.status === "done").length} 个文件
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                返回修改
              </Button>
              <Button className="flex-1">
                <Send className="mr-2 h-4 w-4" />
                提交申请
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
