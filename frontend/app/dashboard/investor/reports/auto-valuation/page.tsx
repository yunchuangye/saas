"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Calculator, 
  MapPin, 
  Building2, 
  Home, 
  Layers, 
  Calendar,
  Ruler,
  Compass,
  FileText,
  Download,
  Eye,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  CheckCircle,
  Printer
} from "lucide-react"

// 模拟城市数据
const cities = [
  { id: "beijing", name: "北京市", districts: ["朝阳区", "海淀区", "西城区", "东城区", "丰台区", "通州区"] },
  { id: "shanghai", name: "上海市", districts: ["浦东新区", "徐汇区", "静安区", "黄浦区", "长宁区"] },
  { id: "guangzhou", name: "广州市", districts: ["天河区", "越秀区", "海珠区", "白云区", "番禺区"] },
  { id: "shenzhen", name: "深圳市", districts: ["福田区", "南山区", "罗湖区", "宝安区", "龙岗区"] },
]

// 模拟楼盘数据
const estates: Record<string, { id: string; name: string; avgPrice: number; buildYear: number }[]> = {
  "朝阳区": [
    { id: "e1", name: "望京SOHO", avgPrice: 85000, buildYear: 2014 },
    { id: "e2", name: "太阳宫小区", avgPrice: 72000, buildYear: 2008 },
    { id: "e3", name: "朝阳门外大街社区", avgPrice: 95000, buildYear: 2000 },
  ],
  "海淀区": [
    { id: "e4", name: "中关村软件园", avgPrice: 78000, buildYear: 2010 },
    { id: "e5", name: "清华园小区", avgPrice: 120000, buildYear: 1998 },
    { id: "e6", name: "五道口华清嘉园", avgPrice: 95000, buildYear: 2005 },
  ],
  "浦东新区": [
    { id: "e7", name: "陆家嘴花园", avgPrice: 130000, buildYear: 2012 },
    { id: "e8", name: "世纪公园住宅", avgPrice: 95000, buildYear: 2008 },
  ],
  "福田区": [
    { id: "e9", name: "深圳中心城", avgPrice: 110000, buildYear: 2015 },
    { id: "e10", name: "香蜜湖豪庭", avgPrice: 150000, buildYear: 2010 },
  ],
}

// 估价报告接口
interface ValuationReport {
  id: string
  generatedAt: string
  property: {
    city: string
    district: string
    estate: string
    building: string
    unit: string
    area: number
    floor: number
    totalFloors: number
    orientation: string
    buildYear: number
    decoration: string
    propertyType: string
  }
  valuation: {
    unitPrice: number
    totalPrice: number
    priceRange: { min: number; max: number }
    confidence: number
    trend: "up" | "down" | "stable"
    trendPercent: number
  }
  comparables: {
    address: string
    price: number
    area: number
    date: string
  }[]
  factors: {
    name: string
    impact: "positive" | "negative" | "neutral"
    description: string
  }[]
}

export default function AutoValuationPage() {
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [selectedEstate, setSelectedEstate] = useState("")
  const [building, setBuilding] = useState("")
  const [unit, setUnit] = useState("")
  const [area, setArea] = useState("")
  const [floor, setFloor] = useState("")
  const [totalFloors, setTotalFloors] = useState("")
  const [orientation, setOrientation] = useState("")
  const [buildYear, setBuildYear] = useState("")
  const [decoration, setDecoration] = useState("")
  const [propertyType, setPropertyType] = useState("")
  
  const [isCalculating, setIsCalculating] = useState(false)
  const [report, setReport] = useState<ValuationReport | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const currentCity = cities.find(c => c.id === selectedCity)
  const currentEstates = selectedDistrict ? estates[selectedDistrict] || [] : []

  const handleCalculate = () => {
    if (!selectedCity || !selectedDistrict || !selectedEstate || !area) {
      alert("请填写完整的房屋信息")
      return
    }

    setIsCalculating(true)
    
    // 模拟计算过程
    setTimeout(() => {
      const estateInfo = currentEstates.find(e => e.id === selectedEstate)
      const basePrice = estateInfo?.avgPrice || 50000
      const areaNum = parseFloat(area) || 100
      const floorNum = parseInt(floor) || 10
      const totalFloorsNum = parseInt(totalFloors) || 30
      
      // 计算调整系数
      let priceAdjustment = 1
      
      // 楼层调整
      const floorRatio = floorNum / totalFloorsNum
      if (floorRatio > 0.7) priceAdjustment *= 1.05
      else if (floorRatio < 0.2) priceAdjustment *= 0.95
      
      // 朝向调整
      if (orientation === "south") priceAdjustment *= 1.03
      else if (orientation === "north") priceAdjustment *= 0.97
      
      // 装修调整
      if (decoration === "luxury") priceAdjustment *= 1.08
      else if (decoration === "simple") priceAdjustment *= 0.95
      else if (decoration === "rough") priceAdjustment *= 0.9
      
      const unitPrice = Math.round(basePrice * priceAdjustment)
      const totalPrice = Math.round(unitPrice * areaNum)
      
      const newReport: ValuationReport = {
        id: `AV${Date.now().toString(36).toUpperCase()}`,
        generatedAt: new Date().toLocaleString("zh-CN"),
        property: {
          city: currentCity?.name || "",
          district: selectedDistrict,
          estate: estateInfo?.name || "",
          building: building || "1号楼",
          unit: unit || "101室",
          area: areaNum,
          floor: floorNum,
          totalFloors: totalFloorsNum,
          orientation: orientation === "south" ? "南" : orientation === "north" ? "北" : orientation === "east" ? "东" : orientation === "west" ? "西" : "南北通透",
          buildYear: parseInt(buildYear) || estateInfo?.buildYear || 2010,
          decoration: decoration === "luxury" ? "豪华装修" : decoration === "fine" ? "精装修" : decoration === "simple" ? "简装" : "毛坯",
          propertyType: propertyType === "residential" ? "住宅" : propertyType === "commercial" ? "商铺" : propertyType === "office" ? "办公" : "住宅",
        },
        valuation: {
          unitPrice,
          totalPrice,
          priceRange: {
            min: Math.round(totalPrice * 0.95),
            max: Math.round(totalPrice * 1.05),
          },
          confidence: 85 + Math.random() * 10,
          trend: Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable",
          trendPercent: Math.round(Math.random() * 5 * 10) / 10,
        },
        comparables: [
          {
            address: `${selectedDistrict}${estateInfo?.name || ""}2号楼503室`,
            price: Math.round(unitPrice * (0.95 + Math.random() * 0.1)),
            area: Math.round(areaNum * (0.9 + Math.random() * 0.2)),
            date: "2024-01-15",
          },
          {
            address: `${selectedDistrict}${estateInfo?.name || ""}5号楼1201室`,
            price: Math.round(unitPrice * (0.95 + Math.random() * 0.1)),
            area: Math.round(areaNum * (0.9 + Math.random() * 0.2)),
            date: "2024-01-08",
          },
          {
            address: `${selectedDistrict}邻近小区3号楼801室`,
            price: Math.round(unitPrice * (0.9 + Math.random() * 0.2)),
            area: Math.round(areaNum * (0.85 + Math.random() * 0.3)),
            date: "2023-12-20",
          },
        ],
        factors: [
          {
            name: "地段位置",
            impact: "positive",
            description: `位于${selectedDistrict}核心地段，交通便利，配套完善`,
          },
          {
            name: "楼层因素",
            impact: floorRatio > 0.5 ? "positive" : "neutral",
            description: `${floorNum}/${totalFloorsNum}层，${floorRatio > 0.7 ? "高层视野开阔" : floorRatio < 0.2 ? "低层出行便利" : "中间楼层适中"}`,
          },
          {
            name: "朝向采光",
            impact: orientation === "south" || orientation === "through" ? "positive" : "neutral",
            description: `${orientation === "south" ? "南向采光充足" : orientation === "north" ? "北向采光一般" : "南北通透，采光通风俱佳"}`,
          },
          {
            name: "装修状况",
            impact: decoration === "luxury" || decoration === "fine" ? "positive" : decoration === "rough" ? "negative" : "neutral",
            description: `${decoration === "luxury" ? "豪华装修，拎包入住" : decoration === "fine" ? "精装修，状态良好" : decoration === "simple" ? "简单装修，可直接使用" : "毛坯状态，需自行装修"}`,
          },
        ],
      }
      
      setReport(newReport)
      setIsCalculating(false)
    }, 2000)
  }

  const handleReset = () => {
    setSelectedCity("")
    setSelectedDistrict("")
    setSelectedEstate("")
    setBuilding("")
    setUnit("")
    setArea("")
    setFloor("")
    setTotalFloors("")
    setOrientation("")
    setBuildYear("")
    setDecoration("")
    setPropertyType("")
    setReport(null)
  }

  const handleDownload = () => {
    // 模拟下载PDF
    alert(`正在生成估价报告PDF...\n\n报告编号: ${report?.id}\n估价结果: ${report?.valuation.totalPrice.toLocaleString()}元`)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">自动估价</h1>
          <p className="text-muted-foreground">输入房屋信息，系统自动计算市场参考价格</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            重置
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左侧：房屋信息输入 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                位置信息
              </CardTitle>
              <CardDescription>选择房屋所在位置</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>城市</Label>
                  <Select value={selectedCity} onValueChange={(v) => {
                    setSelectedCity(v)
                    setSelectedDistrict("")
                    setSelectedEstate("")
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择城市" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>区域</Label>
                  <Select value={selectedDistrict} onValueChange={(v) => {
                    setSelectedDistrict(v)
                    setSelectedEstate("")
                  }} disabled={!selectedCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择区域" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentCity?.districts.map((district) => (
                        <SelectItem key={district} value={district}>{district}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>楼盘</Label>
                <Select value={selectedEstate} onValueChange={setSelectedEstate} disabled={!selectedDistrict}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择楼盘" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentEstates.map((estate) => (
                      <SelectItem key={estate.id} value={estate.id}>
                        {estate.name} (参考均价: {estate.avgPrice.toLocaleString()}元/m²)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>楼栋</Label>
                  <Input placeholder="如: 1号楼" value={building} onChange={(e) => setBuilding(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>房号</Label>
                  <Input placeholder="如: 101室" value={unit} onChange={(e) => setUnit(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                房屋属性
              </CardTitle>
              <CardDescription>填写房屋基本信息</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>建筑面积 (m²)</Label>
                  <Input 
                    type="number" 
                    placeholder="如: 89.5" 
                    value={area} 
                    onChange={(e) => setArea(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>物业类型</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">住宅</SelectItem>
                      <SelectItem value="commercial">商铺</SelectItem>
                      <SelectItem value="office">办公</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>所在楼层</Label>
                  <Input 
                    type="number" 
                    placeholder="如: 15" 
                    value={floor} 
                    onChange={(e) => setFloor(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>总楼层</Label>
                  <Input 
                    type="number" 
                    placeholder="如: 32" 
                    value={totalFloors} 
                    onChange={(e) => setTotalFloors(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>建成年份</Label>
                  <Input 
                    type="number" 
                    placeholder="如: 2015" 
                    value={buildYear} 
                    onChange={(e) => setBuildYear(e.target.value)} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>朝向</Label>
                  <Select value={orientation} onValueChange={setOrientation}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择朝向" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="south">南</SelectItem>
                      <SelectItem value="north">北</SelectItem>
                      <SelectItem value="east">东</SelectItem>
                      <SelectItem value="west">西</SelectItem>
                      <SelectItem value="through">南北通透</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>装修状况</Label>
                  <Select value={decoration} onValueChange={setDecoration}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择装修" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="luxury">豪华装修</SelectItem>
                      <SelectItem value="fine">精装修</SelectItem>
                      <SelectItem value="simple">简装</SelectItem>
                      <SelectItem value="rough">毛坯</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleCalculate}
            disabled={isCalculating}
          >
            {isCalculating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                正在计算估价...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-5 w-5" />
                开始估价
              </>
            )}
          </Button>
        </div>

        {/* 右侧：估价结果 */}
        <div className="space-y-6">
          {!report && !isCalculating && (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Calculator className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">等待估价</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  请在左侧填写房屋信息，点击"开始估价"后系统将自动计算市场参考价格
                </p>
              </CardContent>
            </Card>
          )}

          {isCalculating && (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
                <h3 className="text-lg font-medium mb-2">正在计算估价</h3>
                <p className="text-muted-foreground text-sm">
                  系统正在分析市场数据，请稍候...
                </p>
              </CardContent>
            </Card>
          )}

          {report && !isCalculating && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      估价结果
                    </CardTitle>
                    <Badge variant="secondary" className="font-mono">
                      {report.id}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    生成时间: {report.generatedAt}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">估算总价</p>
                    <p className="text-4xl font-bold text-primary">
                      {report.valuation.totalPrice.toLocaleString()}
                      <span className="text-lg font-normal ml-1">元</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      单价约 {report.valuation.unitPrice.toLocaleString()} 元/m²
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">价格区间</p>
                      <p className="font-medium">
                        {(report.valuation.priceRange.min / 10000).toFixed(0)} - {(report.valuation.priceRange.max / 10000).toFixed(0)} 万
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">置信度</p>
                      <p className="font-medium">{report.valuation.confidence.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <span className="text-sm text-muted-foreground">市场趋势:</span>
                    {report.valuation.trend === "up" && (
                      <Badge className="bg-success/10 text-success border-success/20">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        上涨 {report.valuation.trendPercent}%
                      </Badge>
                    )}
                    {report.valuation.trend === "down" && (
                      <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                        <TrendingDown className="mr-1 h-3 w-3" />
                        下跌 {report.valuation.trendPercent}%
                      </Badge>
                    )}
                    {report.valuation.trend === "stable" && (
                      <Badge className="bg-muted text-muted-foreground">
                        <Minus className="mr-1 h-3 w-3" />
                        持平
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">价格影响因素</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.factors.map((factor, index) => (
                      <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <div className={`mt-0.5 h-2 w-2 rounded-full ${
                          factor.impact === "positive" ? "bg-success" : 
                          factor.impact === "negative" ? "bg-destructive" : "bg-muted-foreground"
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{factor.name}</p>
                          <p className="text-xs text-muted-foreground">{factor.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">可比案例</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {report.comparables.map((comp, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                        <div>
                          <p className="font-medium">{comp.address}</p>
                          <p className="text-xs text-muted-foreground">{comp.area}m² · {comp.date}</p>
                        </div>
                        <p className="font-semibold text-primary">{comp.price.toLocaleString()} 元/m²</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setIsPreviewOpen(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  预览报告
                </Button>
                <Button className="flex-1" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  下载报告
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 报告预览对话框 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>估价报告预览</DialogTitle>
            <DialogDescription>
              报告编号: {report?.id}
            </DialogDescription>
          </DialogHeader>
          
          {report && (
            <div ref={reportRef} className="space-y-6 p-6 bg-background border rounded-lg print:border-0">
              {/* 报告标题 */}
              <div className="text-center border-b pb-6">
                <h1 className="text-2xl font-bold mb-2">房产自动估价报告</h1>
                <p className="text-muted-foreground">AUTOMATED PROPERTY VALUATION REPORT</p>
                <p className="text-sm mt-4 font-mono">报告编号: {report.id}</p>
                <p className="text-sm text-muted-foreground">生成时间: {report.generatedAt}</p>
              </div>

              {/* 估价对象信息 */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  估价对象信息
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">所在城市:</span>
                      <span className="font-medium">{report.property.city}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">所在区域:</span>
                      <span className="font-medium">{report.property.district}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">所在楼盘:</span>
                      <span className="font-medium">{report.property.estate}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">楼栋/房号:</span>
                      <span className="font-medium">{report.property.building} {report.property.unit}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">建筑面积:</span>
                      <span className="font-medium">{report.property.area} m²</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">楼层信息:</span>
                      <span className="font-medium">{report.property.floor}/{report.property.totalFloors}层</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">房屋朝向:</span>
                      <span className="font-medium">{report.property.orientation}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">装修状况:</span>
                      <span className="font-medium">{report.property.decoration}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 估价结论 */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  估价结论
                </h2>
                <div className="bg-primary/5 rounded-lg p-6 text-center">
                  <p className="text-muted-foreground mb-2">估算市场价值</p>
                  <p className="text-4xl font-bold text-primary mb-2">
                    ¥ {report.valuation.totalPrice.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    (人民币 {(report.valuation.totalPrice / 10000).toFixed(2)} 万元整)
                  </p>
                  <div className="mt-4 flex justify-center gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">单价: </span>
                      <span className="font-medium">{report.valuation.unitPrice.toLocaleString()} 元/m²</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">置信度: </span>
                      <span className="font-medium">{report.valuation.confidence.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  价格区间: {(report.valuation.priceRange.min / 10000).toFixed(2)} 万 - {(report.valuation.priceRange.max / 10000).toFixed(2)} 万元
                </p>
              </div>

              <Separator />

              {/* 可比案例 */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  可比交易案例
                </h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">地址</th>
                      <th className="text-right py-2 font-medium">面积</th>
                      <th className="text-right py-2 font-medium">单价</th>
                      <th className="text-right py-2 font-medium">成交日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.comparables.map((comp, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{comp.address}</td>
                        <td className="py-2 text-right">{comp.area} m²</td>
                        <td className="py-2 text-right">{comp.price.toLocaleString()} 元/m²</td>
                        <td className="py-2 text-right">{comp.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Separator />

              {/* 免责声明 */}
              <div className="text-xs text-muted-foreground bg-muted/50 p-4 rounded-lg">
                <p className="font-medium mb-2">免责声明:</p>
                <p>
                  本报告基于系统自动算法生成，仅供参考。估价结果受市场波动、数据时效性等因素影响，
                  不作为正式评估报告使用。如需正式估价报告，请联系专业评估机构进行实地评估。
                </p>
              </div>

              {/* 页脚 */}
              <div className="text-center text-xs text-muted-foreground pt-4 border-t">
                <p>gujia.app - 有态度的估价专业平台</p>
                <p className="mt-1">报告生成时间: {report.generatedAt}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              关闭
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              打印
            </Button>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              下载PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
