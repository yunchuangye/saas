"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { trpc } from "@/lib/trpc"
import {
  Building2, MapPin, Calculator, FileText, ChevronRight,
  TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2, Download,
  BarChart3, Home, Layers, Clock, Sparkles, Brain, Search, RefreshCw
} from "lucide-react"

const PROPERTY_TYPES = [
  { value: "residential", label: "住宅（自动启用案例比较法+AI分析）" },
  { value: "commercial", label: "商业" },
  { value: "office", label: "办公" },
  { value: "industrial", label: "工业" },
  { value: "land", label: "土地" },
]

const CITIES = ["北京", "上海", "深圳", "广州", "杭州", "成都", "武汉", "南京", "重庆", "西安", "其他"]

const DISTRICTS: Record<string, string[]> = {
  "北京": ["朝阳", "海淀", "西城", "东城", "丰台", "通州", "昌平", "大兴", "顺义", "其他"],
  "上海": ["浦东", "黄浦", "静安", "徐汇", "长宁", "虹口", "杨浦", "闵行", "宝山", "松江", "其他"],
  "深圳": ["南山", "福田", "罗湖", "宝安", "龙华", "龙岗", "盐田", "光明", "其他"],
  "广州": ["天河", "越秀", "海珠", "荔湾", "白云", "番禺", "黄埔", "花都", "其他"],
  "杭州": ["西湖", "上城", "拱墅", "滨江", "余杭", "萧山", "临安", "其他"],
  "成都": ["锦江", "青羊", "金牛", "武侯", "成华", "高新", "天府新区", "双流", "其他"],
  "武汉": ["江汉", "武昌", "洪山", "江岸", "硚口", "青山", "东湖高新", "其他"],
  "南京": ["鼓楼", "玄武", "秦淮", "建邺", "栖霞", "雨花台", "江宁", "其他"],
  "重庆": ["渝中", "江北", "南岸", "渝北", "九龙坡", "沙坪坝", "巴南", "其他"],
  "西安": ["碑林", "雁塔", "未央", "莲湖", "灞桥", "高新区", "经开区", "其他"],
  "其他": ["其他"],
}

const ORIENTATIONS = [
  { value: "south_north", label: "南北通透" },
  { value: "south", label: "朝南" },
  { value: "east", label: "朝东" },
  { value: "west", label: "朝西" },
  { value: "north", label: "朝北" },
  { value: "other", label: "其他" },
]

const DECORATIONS = [
  { value: "rough", label: "毛坯" },
  { value: "simple", label: "简装" },
  { value: "medium", label: "中装" },
  { value: "fine", label: "精装" },
  { value: "luxury", label: "豪装" },
]

const PURPOSES = [
  { value: "mortgage", label: "抵押贷款" },
  { value: "transaction", label: "买卖交易" },
  { value: "tax", label: "税务申报" },
  { value: "insurance", label: "保险理赔" },
  { value: "litigation", label: "司法诉讼" },
]

const CONFIDENCE_MAP = {
  high: { label: "高可信度", color: "text-green-600", bg: "bg-green-50 border-green-200", icon: CheckCircle2 },
  medium: { label: "中等可信度", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", icon: AlertCircle },
  low: { label: "低可信度", color: "text-red-600", bg: "bg-red-50 border-red-200", icon: AlertCircle },
}

type FormData = {
  propertyType: string
  city: string
  district: string
  address: string
  buildingAge: string
  totalFloors: string
  floor: string
  buildingArea: string
  orientation: string
  decoration: string
  hasElevator: boolean
  hasParking: boolean
  purpose: string
  monthlyRent: string
  vacancyRate: string
  operatingExpenseRate: string
  capRate: string
}

const defaultForm: FormData = {
  propertyType: "residential",
  city: "北京",
  district: "朝阳",
  address: "",
  buildingAge: "10",
  totalFloors: "18",
  floor: "8",
  buildingArea: "100",
  orientation: "south_north",
  decoration: "fine",
  hasElevator: true,
  hasParking: true,
  purpose: "mortgage",
  monthlyRent: "",
  vacancyRate: "5",
  operatingExpenseRate: "20",
  capRate: "",
}

function formatMoney(v: number) {
  if (!v) return "—"
  if (v >= 100000000) return `${(v / 100000000).toFixed(2)}亿元`
  if (v >= 10000) return `${(v / 10000).toFixed(0)}万元`
  return `${v.toLocaleString()}元`
}

function formatNum(v: number) {
  if (!v) return "—"
  return v.toLocaleString("zh-CN")
}

function ConfidenceBar({ score }: { score: number }) {
  const color = score >= 75 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500"
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-bold w-10 text-right">{score}%</span>
    </div>
  )
}

export default function ValuationPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(defaultForm)
  const [result, setResult] = useState<any>(null)
  const [recordId, setRecordId] = useState<number | null>(null)

  const calculateMutation = trpc.autoValuation.calculate.useMutation({
    onSuccess: (data) => {
      // 将当前表单的 buildingArea 注入 result，方便计算低高值单价
      setResult({ ...data, buildingArea: Number(form.buildingArea) })
      setRecordId(data.id)
      setStep(3)
    },
  })

  const set = (key: keyof FormData, val: any) => setForm(f => ({ ...f, [key]: val }))
  const isResidential = form.propertyType === "residential"

  const handleCalculate = () => {
    calculateMutation.mutate({
      propertyType: form.propertyType as any,
      city: form.city,
      district: form.district,
      address: form.address || `${form.city}${form.district}某处`,
      buildingAge: Number(form.buildingAge),
      totalFloors: Number(form.totalFloors),
      floor: Number(form.floor),
      buildingArea: Number(form.buildingArea),
      orientation: form.orientation as any,
      decoration: form.decoration as any,
      hasElevator: form.hasElevator,
      hasParking: form.hasParking,
      purpose: form.purpose as any,
      monthlyRent: form.monthlyRent ? Number(form.monthlyRent) : undefined,
      vacancyRate: form.vacancyRate ? Number(form.vacancyRate) : undefined,
      operatingExpenseRate: form.operatingExpenseRate ? Number(form.operatingExpenseRate) : undefined,
      capRate: form.capRate ? Number(form.capRate) : undefined,
    })
  }

  const handleDownloadPDF = () => {
    if (!recordId) return
    window.open(`/api/valuation-report/${recordId}`, "_blank")
  }

  const handleReset = () => {
    setStep(1)
    setResult(null)
    setRecordId(null)
    setForm(defaultForm)
  }

  const confidence = result ? CONFIDENCE_MAP[result.confidenceLevel as keyof typeof CONFIDENCE_MAP] : null

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            智能自动估价
          </h1>
          <p className="text-muted-foreground mt-1">
            基于《房地产估价规范》GB/T 50291-2015，综合运用市场比较法、收益法、成本法；住宅物业自动启用 AI 辅助分析
          </p>
        </div>
        {step === 3 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RefreshCw className="h-4 w-4" />重新估价
            </Button>
            <Button onClick={handleDownloadPDF} className="gap-2">
              <Download className="h-4 w-4" />下载PDF报告
            </Button>
          </div>
        )}
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center gap-0">
        {[
          { n: 1, label: "物业信息", icon: Home },
          { n: 2, label: "估价参数", icon: Calculator },
          { n: 3, label: "估价报告", icon: FileText },
        ].map(({ n, label, icon: Icon }, i) => (
          <div key={n} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg flex-1 justify-center transition-all ${
              step === n ? "bg-primary text-primary-foreground" :
              step > n ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
            }`}>
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{label}</span>
            </div>
            {i < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1 flex-shrink-0" />}
          </div>
        ))}
      </div>

      {/* 步骤1：物业基本信息 */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />物业基本信息</CardTitle>
            <CardDescription>请填写待估价物业的基本属性信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isResidential && (
              <Alert className="border-blue-200 bg-blue-50">
                <Brain className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700 text-sm">
                  <strong>住宅物业已自动启用智能模式：</strong>系统将从案例库检索相似成交案例，运用市场比较法计算调整系数，并调用 AI 大模型进行专业分析，输出估价区间与置信度评分。
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>物业类型 *</Label>
                <Select value={form.propertyType} onValueChange={v => set("propertyType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>估价目的 *</Label>
                <Select value={form.purpose} onValueChange={v => set("purpose", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PURPOSES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>所在城市 *</Label>
                <Select value={form.city} onValueChange={v => { set("city", v); set("district", DISTRICTS[v]?.[0] || "其他") }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>所在区域 *</Label>
                <Select value={form.district} onValueChange={v => set("district", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(DISTRICTS[form.city] || ["其他"]).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>详细地址</Label>
                <Input placeholder="如：朝阳路100号3栋8层" value={form.address} onChange={e => set("address", e.target.value)} />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>建筑面积（㎡）*</Label>
                <Input type="number" min={1} value={form.buildingArea} onChange={e => set("buildingArea", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>楼层 *</Label>
                <Input type="number" min={1} value={form.floor} onChange={e => set("floor", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>总楼层 *</Label>
                <Input type="number" min={1} value={form.totalFloors} onChange={e => set("totalFloors", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>楼龄（年）*</Label>
                <Input type="number" min={0} value={form.buildingAge} onChange={e => set("buildingAge", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>朝向</Label>
                <Select value={form.orientation} onValueChange={v => set("orientation", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ORIENTATIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>装修情况</Label>
                <Select value={form.decoration} onValueChange={v => set("decoration", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DECORATIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-8">
              <div className="flex items-center gap-3">
                <Switch checked={form.hasElevator} onCheckedChange={v => set("hasElevator", v)} />
                <Label>有电梯</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.hasParking} onCheckedChange={v => set("hasParking", v)} />
                <Label>有停车位</Label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} className="gap-2">
                下一步：估价参数 <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 步骤2：估价参数 */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" />估价参数配置</CardTitle>
            <CardDescription>
              {isResidential
                ? "住宅物业将自动从案例库检索相似案例，以下参数为辅助参考"
                : "请填写收益法所需参数（如不填写，系统将使用行业默认值）"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isResidential && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-blue-700 font-medium">
                  <Search className="h-4 w-4" />
                  案例库检索策略（自动执行）
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm text-blue-700">
                  <div className="bg-white rounded p-3 border border-blue-100">
                    <p className="font-medium">第一步：区域筛选</p>
                    <p className="text-xs mt-1 text-blue-500">在同城市同区域内检索近12个月成交案例</p>
                  </div>
                  <div className="bg-white rounded p-3 border border-blue-100">
                    <p className="font-medium">第二步：相似度评分</p>
                    <p className="text-xs mt-1 text-blue-500">面积±30%、楼龄±5年、装修相近，加权评分</p>
                  </div>
                  <div className="bg-white rounded p-3 border border-blue-100">
                    <p className="font-medium">第三步：系数调整</p>
                    <p className="text-xs mt-1 text-blue-500">对楼层、朝向、装修、楼龄逐项调整至可比价</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-blue-700 font-medium mt-2">
                  <Brain className="h-4 w-4" />
                  AI 大模型辅助分析（自动执行）
                </div>
                <div className="text-xs text-blue-600 bg-white rounded p-3 border border-blue-100">
                  系统将综合案例比较结果、市场行情数据、物业特征，调用 AI 大模型生成：
                  估价区间（低值/中值/高值）、置信度评分（0-100分）、市场风险提示、专业估价意见
                </div>
              </div>
            )}

            {!isResidential && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>月租金（元/月）</Label>
                    <Input type="number" placeholder="留空使用行业默认值" value={form.monthlyRent} onChange={e => set("monthlyRent", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>空置率（%）</Label>
                    <Input type="number" min={0} max={100} value={form.vacancyRate} onChange={e => set("vacancyRate", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>运营费用率（%）</Label>
                    <Input type="number" min={0} max={100} value={form.operatingExpenseRate} onChange={e => set("operatingExpenseRate", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>资本化率（%）</Label>
                    <Input type="number" min={0} max={100} placeholder="留空使用行业默认值" value={form.capRate} onChange={e => set("capRate", e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {/* 信息确认 */}
            <div className="rounded-lg bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-medium">估价信息确认</p>
              <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                <span>物业类型：{PROPERTY_TYPES.find(t => t.value === form.propertyType)?.label.split("（")[0]}</span>
                <span>位置：{form.city}{form.district}</span>
                <span>面积：{form.buildingArea}㎡</span>
                <span>楼层：{form.floor}/{form.totalFloors}层</span>
                <span>楼龄：{form.buildingAge}年</span>
                <span>装修：{DECORATIONS.find(d => d.value === form.decoration)?.label}</span>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>上一步</Button>
              <Button
                onClick={handleCalculate}
                disabled={calculateMutation.isPending}
                className="gap-2 min-w-32"
              >
                {calculateMutation.isPending ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" />{isResidential ? "AI分析中..." : "计算中..."}</>
                ) : (
                  <><Sparkles className="h-4 w-4" />开始估价</>
                )}
              </Button>
            </div>

            {calculateMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>估价计算失败，请检查输入参数后重试。</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* 步骤3：估价报告 */}
      {step === 3 && result && (
        <div className="space-y-4">
          {/* 核心结果卡片 */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  估价结果
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date().toLocaleDateString("zh-CN")}
                  </Badge>
                  {confidence && (
                    <Badge className={`gap-1 ${confidence.color} border ${confidence.bg}`} variant="outline">
                      <confidence.icon className="h-3 w-3" />
                      {confidence.label}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 估价值 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-white border shadow-sm">
                  <p className="text-xs text-muted-foreground mb-1">估价低值</p>
                  <p className="text-xl font-bold text-orange-600">{formatMoney(result.valuationMin)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatNum(Math.round(result.valuationMin / (result.buildingArea || 1)))} 元/㎡</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-primary text-primary-foreground shadow-md">
                  <p className="text-xs opacity-80 mb-1">估价中值（推荐）</p>
                  <p className="text-2xl font-bold">{formatMoney(result.finalValue)}</p>
                  <p className="text-xs opacity-80 mt-1">{formatNum(result.unitPrice)} 元/㎡</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-white border shadow-sm">
                  <p className="text-xs text-muted-foreground mb-1">估价高值</p>
                  <p className="text-xl font-bold text-green-600">{formatMoney(result.valuationMax)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatNum(Math.round(result.valuationMax / (result.buildingArea || 1)))} 元/㎡</p>
                </div>
              </div>

              {/* 置信度 */}
              {result.confidenceScore && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium flex items-center gap-1">
                      <Brain className="h-4 w-4 text-blue-500" />AI 置信度评分
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {result.confidenceScore >= 75 ? "案例充足，结果可靠" :
                       result.confidenceScore >= 50 ? "案例适中，结果参考" : "案例不足，结果仅供参考"}
                    </span>
                  </div>
                  <ConfidenceBar score={result.confidenceScore} />
                </div>
              )}

              {/* 估价方法 */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">采用方法：</span>
                {result.weights ? (
                  <>
                    {result.weights.comparative > 0 && (
                      <Badge variant="secondary" className="text-xs">比较法 × {Math.round(result.weights.comparative * 100)}%</Badge>
                    )}
                    {result.weights.income > 0 && (
                      <Badge variant="secondary" className="text-xs">收益法 × {Math.round(result.weights.income * 100)}%</Badge>
                    )}
                    {result.weights.cost > 0 && (
                      <Badge variant="secondary" className="text-xs">成本法 × {Math.round(result.weights.cost * 100)}%</Badge>
                    )}
                  </>
                ) : result.method ? (
                  <Badge variant="secondary" className="text-xs">{result.method}</Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* AI 分析报告（住宅专属） */}
          {result.llmAnalysis && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-blue-700">
                  <Brain className="h-5 w-5" />AI 专业分析报告
                  <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">由大语言模型生成</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* llmAnalysis 可能是字符串或对象，展示时均兼容 */}
                {typeof result.llmAnalysis === 'string' ? (
                  <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                    <p className="text-sm font-medium text-blue-800 mb-2">AI 分析意见</p>
                    <p className="text-sm text-blue-700 leading-relaxed whitespace-pre-wrap">{result.llmAnalysis}</p>
                  </div>
                ) : (
                  <>
                    {result.llmAnalysis.summary && (
                      <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                        <p className="text-sm font-medium text-blue-800 mb-2">综合估价意见</p>
                        <p className="text-sm text-blue-700 leading-relaxed">{result.llmAnalysis.summary}</p>
                      </div>
                    )}
                    {result.llmAnalysis.analysis && (
                      <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                        <p className="text-sm font-medium text-blue-800 mb-2">AI 分析意见</p>
                        <p className="text-sm text-blue-700 leading-relaxed whitespace-pre-wrap">{result.llmAnalysis.analysis}</p>
                      </div>
                    )}
                    {result.llmAnalysis.marketAnalysis && (
                      <div>
                        <p className="text-sm font-medium mb-2">市场分析</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{result.llmAnalysis.marketAnalysis}</p>
                      </div>
                    )}
                    {result.llmAnalysis.riskFactors && result.llmAnalysis.riskFactors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 text-yellow-700 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" />风险提示
                        </p>
                        <ul className="space-y-1">
                          {result.llmAnalysis.riskFactors.map((r: string, i: number) => (
                            <li key={i} className="text-sm text-yellow-700 flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-yellow-500 flex-shrink-0" />{r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.llmAnalysis.keyFactors && result.llmAnalysis.keyFactors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 text-blue-700">关键影响因素</p>
                        <div className="flex flex-wrap gap-2">
                          {result.llmAnalysis.keyFactors.map((f: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.llmAnalysis.recommendation && (
                      <div className="rounded-lg bg-green-50 border border-green-100 p-4">
                        <p className="text-sm font-medium text-green-800 mb-2">估价师建议</p>
                        <p className="text-sm text-green-700 leading-relaxed">{result.llmAnalysis.recommendation}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* 可比案例（住宅比较法） */}
          {result.comparableCases && result.comparableCases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Search className="h-5 w-5" />
                  可比案例（从案例库检索）
                  <Badge variant="secondary" className="text-xs">{result.comparableCases.length} 个案例</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground text-xs">
                        <th className="text-left py-2 pr-3">案例编号</th>
                        <th className="text-left py-2 pr-3">位置</th>
                        <th className="text-right py-2 pr-3">面积(㎡)</th>
                        <th className="text-right py-2 pr-3">成交单价(元/㎡)</th>
                        <th className="text-right py-2 pr-3">调整后单价</th>
                        <th className="text-right py-2 pr-3">相似度</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.comparableCases.map((c: any, i: number) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">{c.caseNo || `CASE-${i + 1}`}</td>
                          <td className="py-2 pr-3">{c.location || c.district}</td>
                          <td className="py-2 pr-3 text-right">{c.area}</td>
                          <td className="py-2 pr-3 text-right font-medium">{formatNum(c.unitPrice)}</td>
                          <td className="py-2 pr-3 text-right font-medium text-primary">{formatNum(c.adjustedPrice)}</td>
                          <td className="py-2 text-right">
                            <Badge variant={c.similarity >= 80 ? "default" : c.similarity >= 60 ? "secondary" : "outline"} className="text-xs">
                              {c.similarity}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 调整系数明细 */}
          {result.adjustments && result.adjustments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="h-5 w-5" />调整系数明细
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.adjustments.map((adj: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <span className="font-medium text-sm">{adj.factor}</span>
                        <span className="text-muted-foreground text-xs ml-2">{adj.description}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={adj.coefficient >= 1 ? "default" : "secondary"} className="text-xs">
                          ×{adj.coefficient?.toFixed(3)}
                        </Badge>
                        <span className={`text-sm font-medium w-28 text-right ${(adj.impact || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {(adj.impact || 0) >= 0 ? "+" : ""}{formatMoney(Math.abs(adj.impact || 0))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 市场行情 */}
          {result.marketData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5" />市场行情参考
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">城市均价</p>
                    <p className="font-bold">{formatNum(result.marketData.cityAvgPrice)}</p>
                    <p className="text-xs text-muted-foreground">元/㎡</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">区域均价</p>
                    <p className="font-bold">{formatNum(result.marketData.districtAvgPrice)}</p>
                    <p className="text-xs text-muted-foreground">元/㎡</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">区位指数</p>
                    <p className="font-bold">{result.marketData.priceIndex}</p>
                    <p className="text-xs text-muted-foreground">相对城市均价</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">市场走势</p>
                    <div className="flex items-center justify-center gap-1">
                      {result.marketData.marketTrend === "rising" ? (
                        <><TrendingUp className="h-4 w-4 text-green-500" /><p className="font-bold text-green-600">上涨</p></>
                      ) : result.marketData.marketTrend === "declining" ? (
                        <><TrendingDown className="h-4 w-4 text-red-500" /><p className="font-bold text-red-600">下跌</p></>
                      ) : (
                        <><Minus className="h-4 w-4 text-yellow-500" /><p className="font-bold text-yellow-600">平稳</p></>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">年涨幅 {result.marketData.trendRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 估价说明 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5" />估价说明与假设
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.methodology && (
                <div>
                  <h4 className="text-sm font-medium mb-2">估价方法说明</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.methodology}</p>
                </div>
              )}
              {result.assumptions && result.assumptions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">估价假设条件</h4>
                  <ul className="space-y-1">
                    {result.assumptions.map((a: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.limitations && result.limitations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-yellow-700">注意事项</h4>
                  <ul className="space-y-1">
                    {result.limitations.map((l: string, i: number) => (
                      <li key={i} className="text-sm text-yellow-700 flex items-start gap-2">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />{l}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 底部操作 */}
          <div className="flex justify-between items-center pb-6">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RefreshCw className="h-4 w-4" />重新估价
            </Button>
            <Button onClick={handleDownloadPDF} className="gap-2">
              <Download className="h-4 w-4" />下载PDF估价报告
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
