"use client"

import { useState } from "react"
import { Database, Plus, Search, Edit, Trash2, Eye, MoreHorizontal, Filter, Download, Upload, Building, TrendingUp, TrendingDown, Calendar, DollarSign, Home, Bot, Sparkles, Zap, AlertTriangle, RefreshCw, ScanSearch } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

// 模拟数据 - 市场案例信息
const marketCases = [
  {
    id: "1",
    caseType: "listing", // listing: 报价, transaction: 成交
    estateName: "万科金域华府",
    buildingName: "A栋",
    unitNo: "A-15-1501",
    floor: 15,
    totalFloor: 32,
    area: 89.5,
    useType: "住宅",
    structure: "两室两厅一卫",
    orientation: "南",
    decoration: "精装",
    listingPrice: 15800, // 报价单价（元/平方米）
    totalPrice: 141.41, // 总价（万元）
    listingDate: "2026-03-10",
    transactionPrice: null,
    transactionDate: null,
    source: "链家",
    agentName: "张三",
    agentPhone: "138****8888",
    propertyAge: 5,
    hasElevator: true,
    parking: "地下车位",
    greenRate: 35,
    plotRatio: 2.5,
    propertyFee: 3.5,
    remarks: "业主急售，价格可议",
    status: "active",
    createdAt: "2026-03-10",
    updatedAt: "2026-03-10",
  },
  {
    id: "2",
    caseType: "transaction",
    estateName: "万科金域华府",
    buildingName: "B栋",
    unitNo: "B-8-802",
    floor: 8,
    totalFloor: 32,
    area: 125.8,
    useType: "住宅",
    structure: "三室两厅两卫",
    orientation: "南北通透",
    decoration: "精装",
    listingPrice: 16200,
    totalPrice: 203.80,
    listingDate: "2026-01-15",
    transactionPrice: 15800,
    transactionDate: "2026-02-28",
    source: "贝壳",
    agentName: "李四",
    agentPhone: "139****9999",
    propertyAge: 5,
    hasElevator: true,
    parking: "地下车位",
    greenRate: 35,
    plotRatio: 2.5,
    propertyFee: 3.5,
    remarks: "满五唯一，税费少",
    status: "completed",
    createdAt: "2026-01-15",
    updatedAt: "2026-02-28",
  },
  {
    id: "3",
    caseType: "listing",
    estateName: "保利天悦",
    buildingName: "1号楼",
    unitNo: "1-22-2201",
    floor: 22,
    totalFloor: 35,
    area: 156.2,
    useType: "住宅",
    structure: "四室两厅两卫",
    orientation: "东南",
    decoration: "豪装",
    listingPrice: 22500,
    totalPrice: 351.45,
    listingDate: "2026-03-08",
    transactionPrice: null,
    transactionDate: null,
    source: "中原地产",
    agentName: "王五",
    agentPhone: "137****7777",
    propertyAge: 3,
    hasElevator: true,
    parking: "双车位",
    greenRate: 40,
    plotRatio: 2.2,
    propertyFee: 4.8,
    remarks: "豪华装修，拎包入住",
    status: "active",
    createdAt: "2026-03-08",
    updatedAt: "2026-03-08",
  },
  {
    id: "4",
    caseType: "transaction",
    estateName: "碧桂园凤凰城",
    buildingName: "3号楼",
    unitNo: "3-6-601",
    floor: 6,
    totalFloor: 18,
    area: 112.3,
    useType: "住宅",
    structure: "三室一厅一卫",
    orientation: "南北通透",
    decoration: "简装",
    listingPrice: 12800,
    totalPrice: 143.74,
    listingDate: "2025-12-20",
    transactionPrice: 12500,
    transactionDate: "2026-01-25",
    source: "58同城",
    agentName: "赵六",
    agentPhone: "136****6666",
    propertyAge: 8,
    hasElevator: false,
    parking: "地面车位",
    greenRate: 30,
    plotRatio: 2.8,
    propertyFee: 2.2,
    remarks: "步梯房，适合老人",
    status: "completed",
    createdAt: "2025-12-20",
    updatedAt: "2026-01-25",
  },
  {
    id: "5",
    caseType: "listing",
    estateName: "龙湖天璟",
    buildingName: "5号楼",
    unitNo: "5-18-1802",
    floor: 18,
    totalFloor: 28,
    area: 188.9,
    useType: "住宅",
    structure: "四室两厅三卫",
    orientation: "南",
    decoration: "精装",
    listingPrice: 28000,
    totalPrice: 528.92,
    listingDate: "2026-03-05",
    transactionPrice: null,
    transactionDate: null,
    source: "链家",
    agentName: "钱七",
    agentPhone: "135****5555",
    propertyAge: 2,
    hasElevator: true,
    parking: "双车位",
    greenRate: 42,
    plotRatio: 2.0,
    propertyFee: 5.5,
    remarks: "次顶层，视野开阔",
    status: "active",
    createdAt: "2026-03-05",
    updatedAt: "2026-03-05",
  },
  {
    id: "6",
    caseType: "transaction",
    estateName: "中海国际中心",
    buildingName: "写字楼A座",
    unitNo: "A-12-1205",
    floor: 12,
    totalFloor: 45,
    area: 168.5,
    useType: "办公",
    structure: "开间",
    orientation: "东",
    decoration: "精装",
    listingPrice: 35000,
    totalPrice: 589.75,
    listingDate: "2025-11-10",
    transactionPrice: 33500,
    transactionDate: "2026-02-15",
    source: "商业地产网",
    agentName: "孙八",
    agentPhone: "134****4444",
    propertyAge: 6,
    hasElevator: true,
    parking: "公共停车场",
    greenRate: 25,
    plotRatio: 4.5,
    propertyFee: 18.0,
    remarks: "甲级写字楼，配套齐全",
    status: "completed",
    createdAt: "2025-11-10",
    updatedAt: "2026-02-15",
  },
  {
    id: "7",
    caseType: "listing",
    estateName: "华润万象城",
    buildingName: "商业裙楼",
    unitNo: "S-1-108",
    floor: 1,
    totalFloor: 3,
    area: 85.6,
    useType: "商铺",
    structure: "开间",
    orientation: "西",
    decoration: "毛坯",
    listingPrice: 45000,
    totalPrice: 385.20,
    listingDate: "2026-03-01",
    transactionPrice: null,
    transactionDate: null,
    source: "美联物业",
    agentName: "周九",
    agentPhone: "133****3333",
    propertyAge: 4,
    hasElevator: true,
    parking: "地下停车场",
    greenRate: 20,
    plotRatio: 5.0,
    propertyFee: 25.0,
    remarks: "临街商铺，人流量大",
    status: "active",
    createdAt: "2026-03-01",
    updatedAt: "2026-03-01",
  },
  {
    id: "8",
    caseType: "listing",
    estateName: "万科金域华府",
    buildingName: "C栋",
    unitNo: "C-20-2003",
    floor: 20,
    totalFloor: 32,
    area: 98.2,
    useType: "住宅",
    structure: "两室两厅两卫",
    orientation: "南",
    decoration: "精装",
    listingPrice: 16500,
    totalPrice: 162.03,
    listingDate: "2026-03-12",
    transactionPrice: null,
    transactionDate: null,
    source: "贝壳",
    agentName: "吴十",
    agentPhone: "132****2222",
    propertyAge: 5,
    hasElevator: true,
    parking: "地下车位",
    greenRate: 35,
    plotRatio: 2.5,
    propertyFee: 3.5,
    remarks: "高层景观房",
    status: "active",
    createdAt: "2026-03-12",
    updatedAt: "2026-03-12",
  },
]

const caseTypeConfig: Record<string, { label: string; variant: "default" | "secondary" }> = {
  listing: { label: "报价", variant: "secondary" },
  transaction: { label: "成交", variant: "default" },
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "有效", variant: "default" },
  completed: { label: "已成交", variant: "secondary" },
  expired: { label: "已过期", variant: "outline" },
}

const useTypeConfig: Record<string, string> = {
  "住宅": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "商铺": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "办公": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "车位": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
}

export default function CasesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState<typeof marketCases[0] | null>(null)
  const [selectedCaseType, setSelectedCaseType] = useState("all")
  const [selectedUseType, setSelectedUseType] = useState("all")
  const [activeTab, setActiveTab] = useState("all")

  const filteredCases = marketCases.filter(item => {
    const matchesSearch = item.estateName.includes(searchTerm) || 
                          item.unitNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.buildingName.includes(searchTerm)
    const matchesCaseType = selectedCaseType === "all" || item.caseType === selectedCaseType
    const matchesUseType = selectedUseType === "all" || item.useType === selectedUseType
    const matchesTab = activeTab === "all" || item.caseType === activeTab
    return matchesSearch && matchesCaseType && matchesUseType && matchesTab
  })

  const totalCases = marketCases.length
  const listingCount = marketCases.filter(c => c.caseType === "listing").length
  const transactionCount = marketCases.filter(c => c.caseType === "transaction").length
  const avgListingPrice = Math.round(marketCases.filter(c => c.caseType === "listing").reduce((acc, c) => acc + c.listingPrice, 0) / listingCount)
  const avgTransactionPrice = Math.round(marketCases.filter(c => c.caseType === "transaction" && c.transactionPrice).reduce((acc, c) => acc + (c.transactionPrice || 0), 0) / transactionCount)

  // 获取唯一的楼盘列表
  const estates = [...new Set(marketCases.map(c => c.estateName))]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">案例管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            收集房屋市场报价和成交信息，为自动估价模型提供数据支持
          </p>
        </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0 hover:from-blue-700 hover:to-cyan-700 hover:text-white">
                  <Bot className="mr-2 h-4 w-4" />
                  OpenClaw AI
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard/admin/directory/cases/ai-collect">
                    <Sparkles className="mr-2 h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium">AI智能采集</div>
                      <div className="text-xs text-muted-foreground">自动采集各平台市场数据</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard/admin/directory/cases/ai-clean">
                    <RefreshCw className="mr-2 h-4 w-4 text-green-500" />
                    <div>
                      <div className="font-medium">AI数据清洗</div>
                      <div className="text-xs text-muted-foreground">智能识别并清洗异常数据</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard/admin/directory/cases/ai-predict">
                    <TrendingUp className="mr-2 h-4 w-4 text-purple-500" />
                    <div>
                      <div className="font-medium">AI价格预测</div>
                      <div className="text-xs text-muted-foreground">预测房屋价格走势</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard/admin/directory/cases/ai-match">
                    <ScanSearch className="mr-2 h-4 w-4 text-orange-500" />
                    <div>
                      <div className="font-medium">AI案例匹配</div>
                      <div className="text-xs text-muted-foreground">智能匹配相似案例分析</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard/admin/directory/cases/ai-anomaly">
                    <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                    <div>
                      <div className="font-medium">AI异常检测</div>
                      <div className="text-xs text-muted-foreground">检测价格异常案例</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard/admin/directory/cases/ai-batch">
                    <Zap className="mr-2 h-4 w-4 text-yellow-500" />
                    <div>
                      <div className="font-medium">AI批量估价</div>
                      <div className="text-xs text-muted-foreground">一键批量生成估价结果</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              批量导入
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              导出数据
            </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                添加案例
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>添加市场案例</DialogTitle>
                <DialogDescription>
                  添加新的市场报价或成交案例信息
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* 基本信息 */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">基本信息</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="caseType">案例类型</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="选择类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="listing">市场报价</SelectItem>
                          <SelectItem value="transaction">成交案例</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="source">数据来源</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="选择来源" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="链家">链家</SelectItem>
                          <SelectItem value="贝壳">贝壳</SelectItem>
                          <SelectItem value="中原地产">中原地产</SelectItem>
                          <SelectItem value="美联物业">美联物业</SelectItem>
                          <SelectItem value="58同城">58同城</SelectItem>
                          <SelectItem value="其他">其他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="listingDate">报价日期</Label>
                      <Input id="listingDate" type="date" />
                    </div>
                  </div>
                </div>

                {/* 房屋信息 */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">房屋信息</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="estate">所属楼盘</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="选择楼盘" />
                        </SelectTrigger>
                        <SelectContent>
                          {estates.map(estate => (
                            <SelectItem key={estate} value={estate}>{estate}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="building">楼栋</Label>
                      <Input id="building" placeholder="如：A栋" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="unitNo">房号</Label>
                      <Input id="unitNo" placeholder="如：A-15-1501" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="floor">所在楼层</Label>
                      <Input id="floor" type="number" placeholder="楼层" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="totalFloor">总楼层</Label>
                      <Input id="totalFloor" type="number" placeholder="总层数" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="area">建筑面积(m²)</Label>
                      <Input id="area" type="number" step="0.01" placeholder="面积" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="useType">用途类型</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="选择类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="住宅">住宅</SelectItem>
                          <SelectItem value="商铺">商铺</SelectItem>
                          <SelectItem value="办公">办公</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="structure">户型结构</Label>
                      <Input id="structure" placeholder="如：三室两厅" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="orientation">朝向</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="选择朝向" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="南">南</SelectItem>
                          <SelectItem value="南北通透">南北通透</SelectItem>
                          <SelectItem value="东南">东南</SelectItem>
                          <SelectItem value="东">东</SelectItem>
                          <SelectItem value="西">西</SelectItem>
                          <SelectItem value="北">北</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="decoration">装修状况</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="选择装修" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="毛坯">毛坯</SelectItem>
                          <SelectItem value="简装">简装</SelectItem>
                          <SelectItem value="精装">精装</SelectItem>
                          <SelectItem value="豪装">豪装</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="propertyAge">房龄(年)</Label>
                      <Input id="propertyAge" type="number" placeholder="房龄" />
                    </div>
                  </div>
                </div>

                {/* 价格信息 */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">价格信息</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="listingPrice">报价单价(元/m²)</Label>
                      <Input id="listingPrice" type="number" placeholder="单价" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="totalPrice">报价总价(万元)</Label>
                      <Input id="totalPrice" type="number" step="0.01" placeholder="总价" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="transactionPrice">成交单价(元/m²)</Label>
                      <Input id="transactionPrice" type="number" placeholder="成交单价" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="transactionDate">成交日期</Label>
                      <Input id="transactionDate" type="date" />
                    </div>
                  </div>
                </div>

                {/* 小区信息 */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">小区配套</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="greenRate">绿化率(%)</Label>
                      <Input id="greenRate" type="number" placeholder="绿化率" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="plotRatio">容积率</Label>
                      <Input id="plotRatio" type="number" step="0.1" placeholder="容积率" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="propertyFee">物业费(元/m²/月)</Label>
                      <Input id="propertyFee" type="number" step="0.1" placeholder="物业费" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="hasElevator">是否有电梯</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="选择" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">是</SelectItem>
                          <SelectItem value="no">否</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 经纪人信息 */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">经纪人信息</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="agentName">经纪人姓名</Label>
                      <Input id="agentName" placeholder="姓名" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="agentPhone">联系电话</Label>
                      <Input id="agentPhone" placeholder="电话" />
                    </div>
                  </div>
                </div>

                {/* 备注 */}
                <div className="grid gap-2">
                  <Label htmlFor="remarks">备注信息</Label>
                  <Textarea id="remarks" placeholder="输入备注信息..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={() => setIsAddDialogOpen(false)}>确认添加</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">案例总数</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCases}</div>
            <p className="text-xs text-muted-foreground">条记录</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">报价案例</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listingCount}</div>
            <p className="text-xs text-muted-foreground">均价 {avgListingPrice.toLocaleString()} 元/m²</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成交案例</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactionCount}</div>
            <p className="text-xs text-muted-foreground">均价 {avgTransactionPrice.toLocaleString()} 元/m²</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">价格差异</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              -{((1 - avgTransactionPrice / avgListingPrice) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">成交价比报价低</p>
          </CardContent>
        </Card>
      </div>

      {/* 列表区域 */}
      <Card>
        <CardHeader>
          <CardTitle>案例列表</CardTitle>
          <CardDescription>管理市场报价和成交案例数据</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tabs切换 */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">全部案例</TabsTrigger>
              <TabsTrigger value="listing">报价案例</TabsTrigger>
              <TabsTrigger value="transaction">成交案例</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 搜索和筛选 */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索楼盘、房号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedUseType} onValueChange={setSelectedUseType}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="用途类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="住宅">住宅</SelectItem>
                <SelectItem value="商铺">商铺</SelectItem>
                <SelectItem value="办公">办公</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>类型</TableHead>
                <TableHead>楼盘/房号</TableHead>
                <TableHead>用途</TableHead>
                <TableHead>面积(m²)</TableHead>
                <TableHead>户型</TableHead>
                <TableHead>报价(元/m²)</TableHead>
                <TableHead>成交价(元/m²)</TableHead>
                <TableHead>日期</TableHead>
                <TableHead>来源</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant={caseTypeConfig[item.caseType]?.variant || "secondary"}>
                      {caseTypeConfig[item.caseType]?.label || item.caseType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{item.estateName}</div>
                    <div className="text-xs text-muted-foreground">{item.unitNo}</div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${useTypeConfig[item.useType] || "bg-muted text-muted-foreground"}`}>
                      {item.useType}
                    </span>
                  </TableCell>
                  <TableCell>{item.area}</TableCell>
                  <TableCell className="text-sm">{item.structure}</TableCell>
                  <TableCell>
                    <span className="font-medium">{item.listingPrice.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    {item.transactionPrice ? (
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {item.transactionPrice.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{item.listingDate}</div>
                    {item.transactionDate && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        成交: {item.transactionDate}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{item.source}</TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[item.status]?.variant || "secondary"}>
                      {statusConfig[item.status]?.label || item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedCase(item)
                          setIsViewDialogOpen(true)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* 分页信息 */}
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <div>共 {filteredCases.length} 条记录</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>上一页</Button>
              <Button variant="outline" size="sm" disabled>下一页</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 查看详情对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>案例详情</DialogTitle>
            <DialogDescription>
              {selectedCase?.estateName} - {selectedCase?.unitNo}
            </DialogDescription>
          </DialogHeader>
          {selectedCase && (
            <div className="grid gap-4 py-4">
              {/* 基本信息 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  房屋信息
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">楼盘名称:</span>
                    <span className="ml-2 font-medium">{selectedCase.estateName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">楼栋:</span>
                    <span className="ml-2 font-medium">{selectedCase.buildingName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">房号:</span>
                    <span className="ml-2 font-medium">{selectedCase.unitNo}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">楼层:</span>
                    <span className="ml-2 font-medium">{selectedCase.floor}/{selectedCase.totalFloor}层</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">面积:</span>
                    <span className="ml-2 font-medium">{selectedCase.area} m²</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">用途:</span>
                    <span className="ml-2 font-medium">{selectedCase.useType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">户型:</span>
                    <span className="ml-2 font-medium">{selectedCase.structure}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">朝向:</span>
                    <span className="ml-2 font-medium">{selectedCase.orientation}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">装修:</span>
                    <span className="ml-2 font-medium">{selectedCase.decoration}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">房龄:</span>
                    <span className="ml-2 font-medium">{selectedCase.propertyAge}年</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">电梯:</span>
                    <span className="ml-2 font-medium">{selectedCase.hasElevator ? "有" : "无"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">车位:</span>
                    <span className="ml-2 font-medium">{selectedCase.parking}</span>
                  </div>
                </div>
              </div>

              {/* 价格信息 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  价格信息
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">报价</div>
                      <div className="text-2xl font-bold">{selectedCase.listingPrice.toLocaleString()} 元/m²</div>
                      <div className="text-sm text-muted-foreground">总价: {selectedCase.totalPrice} 万元</div>
                      <div className="text-xs text-muted-foreground mt-1">报价日期: {selectedCase.listingDate}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">成交价</div>
                      {selectedCase.transactionPrice ? (
                        <>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {selectedCase.transactionPrice.toLocaleString()} 元/m²
                          </div>
                          <div className="text-sm text-muted-foreground">
                            总价: {(selectedCase.transactionPrice * selectedCase.area / 10000).toFixed(2)} 万元
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">成交日期: {selectedCase.transactionDate}</div>
                        </>
                      ) : (
                        <div className="text-2xl font-bold text-muted-foreground">-</div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 小区配套 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  小区配套
                </h4>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">绿化率:</span>
                    <span className="ml-2 font-medium">{selectedCase.greenRate}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">容积率:</span>
                    <span className="ml-2 font-medium">{selectedCase.plotRatio}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">物业费:</span>
                    <span className="ml-2 font-medium">{selectedCase.propertyFee}元/m²/月</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">数据来源:</span>
                    <span className="ml-2 font-medium">{selectedCase.source}</span>
                  </div>
                </div>
              </div>

              {/* 备注 */}
              {selectedCase.remarks && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">备注信息</h4>
                  <p className="text-sm bg-muted/50 p-3 rounded-md">{selectedCase.remarks}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              关闭
            </Button>
            <Button>编辑案例</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
