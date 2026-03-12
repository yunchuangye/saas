"use client"

import { useState } from "react"
import { DoorOpen, Plus, Search, Edit, Trash2, Eye, MoreHorizontal, Filter, Download, Building, Layers, MapPin } from "lucide-react"
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

// 模拟数据 - 房屋单元信息
const units = [
  {
    id: "1",
    unitNo: "A-1-101",
    estateName: "万科金域华府",
    buildingName: "A栋",
    floor: 1,
    roomNo: "101",
    area: 89.5,
    useType: "住宅",
    orientation: "南",
    structure: "两室两厅一卫",
    decoration: "精装",
    hasElevator: true,
    propertyRight: "商品房",
    status: "normal",
    createdAt: "2023-01-15",
  },
  {
    id: "2",
    unitNo: "A-1-102",
    estateName: "万科金域华府",
    buildingName: "A栋",
    floor: 1,
    roomNo: "102",
    area: 125.8,
    useType: "住宅",
    orientation: "南北通透",
    structure: "三室两厅两卫",
    decoration: "精装",
    hasElevator: true,
    propertyRight: "商品房",
    status: "normal",
    createdAt: "2023-01-15",
  },
  {
    id: "3",
    unitNo: "A-2-201",
    estateName: "万科金域华府",
    buildingName: "A栋",
    floor: 2,
    roomNo: "201",
    area: 89.5,
    useType: "住宅",
    orientation: "南",
    structure: "两室两厅一卫",
    decoration: "毛坯",
    hasElevator: true,
    propertyRight: "商品房",
    status: "normal",
    createdAt: "2023-01-15",
  },
  {
    id: "4",
    unitNo: "B-1-101",
    estateName: "保利天悦",
    buildingName: "1号楼",
    floor: 1,
    roomNo: "101",
    area: 156.2,
    useType: "住宅",
    orientation: "东南",
    structure: "四室两厅两卫",
    decoration: "豪装",
    hasElevator: true,
    propertyRight: "商品房",
    status: "normal",
    createdAt: "2023-03-20",
  },
  {
    id: "5",
    unitNo: "B-1-102",
    estateName: "保利天悦",
    buildingName: "1号楼",
    floor: 1,
    roomNo: "102",
    area: 78.6,
    useType: "商铺",
    orientation: "西",
    structure: "开间",
    decoration: "毛坯",
    hasElevator: true,
    propertyRight: "商品房",
    status: "pending",
    createdAt: "2024-01-08",
  },
  {
    id: "6",
    unitNo: "C-3-301",
    estateName: "碧桂园凤凰城",
    buildingName: "3号楼",
    floor: 3,
    roomNo: "301",
    area: 112.3,
    useType: "住宅",
    orientation: "南北通透",
    structure: "三室一厅一卫",
    decoration: "简装",
    hasElevator: false,
    propertyRight: "经济适用房",
    status: "normal",
    createdAt: "2022-06-18",
  },
  {
    id: "7",
    unitNo: "D-5-502",
    estateName: "龙湖天璟",
    buildingName: "5号楼",
    floor: 5,
    roomNo: "502",
    area: 188.9,
    useType: "住宅",
    orientation: "南",
    structure: "四室两厅三卫",
    decoration: "精装",
    hasElevator: true,
    propertyRight: "商品房",
    status: "normal",
    createdAt: "2023-09-25",
  },
  {
    id: "8",
    unitNo: "E-B1-01",
    estateName: "中海国际中心",
    buildingName: "写字楼A座",
    floor: -1,
    roomNo: "B1-01",
    area: 45.0,
    useType: "车位",
    orientation: "-",
    structure: "标准车位",
    decoration: "-",
    hasElevator: false,
    propertyRight: "产权车位",
    status: "normal",
    createdAt: "2023-05-10",
  },
]

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  normal: { label: "正常", variant: "default" },
  pending: { label: "待审核", variant: "secondary" },
  locked: { label: "已锁定", variant: "outline" },
}

const useTypeConfig: Record<string, string> = {
  "住宅": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "商铺": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "办公": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "车位": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  "仓储": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
}

const decorationConfig: Record<string, string> = {
  "毛坯": "text-muted-foreground",
  "简装": "text-blue-600 dark:text-blue-400",
  "精装": "text-green-600 dark:text-green-400",
  "豪装": "text-purple-600 dark:text-purple-400",
}

export default function UnitsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<typeof units[0] | null>(null)
  const [selectedEstate, setSelectedEstate] = useState("all")
  const [selectedUseType, setSelectedUseType] = useState("all")

  const filteredUnits = units.filter(unit => {
    const matchesSearch = unit.unitNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          unit.estateName.includes(searchTerm) ||
                          unit.buildingName.includes(searchTerm)
    const matchesEstate = selectedEstate === "all" || unit.estateName === selectedEstate
    const matchesUseType = selectedUseType === "all" || unit.useType === selectedUseType
    return matchesSearch && matchesEstate && matchesUseType
  })

  const totalUnits = units.length
  const totalArea = units.reduce((acc, u) => acc + u.area, 0)
  const residentialCount = units.filter(u => u.useType === "住宅").length
  const commercialCount = units.filter(u => u.useType !== "住宅").length

  // 获取唯一的楼盘列表
  const estates = [...new Set(units.map(u => u.estateName))]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">房屋管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理楼栋下的房屋单元信息，包括户型、面积、装修状况等
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            导出数据
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                添加房屋
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>添加房屋单元</DialogTitle>
                <DialogDescription>
                  添加新的房屋单元信息
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
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
                    <Label htmlFor="building">所属楼栋</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择楼栋" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A栋">A栋</SelectItem>
                        <SelectItem value="B栋">B栋</SelectItem>
                        <SelectItem value="1号楼">1号楼</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="floor">所在楼层</Label>
                    <Input id="floor" type="number" placeholder="楼层" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="roomNo">房号</Label>
                    <Input id="roomNo" placeholder="如：101" />
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
                        <SelectItem value="车位">车位</SelectItem>
                        <SelectItem value="仓储">仓储</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="orientation">朝向</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择朝向" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="东">东</SelectItem>
                        <SelectItem value="南">南</SelectItem>
                        <SelectItem value="西">西</SelectItem>
                        <SelectItem value="北">北</SelectItem>
                        <SelectItem value="东南">东南</SelectItem>
                        <SelectItem value="东北">东北</SelectItem>
                        <SelectItem value="西南">西南</SelectItem>
                        <SelectItem value="西北">西北</SelectItem>
                        <SelectItem value="南北通透">南北通透</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="structure">户型结构</Label>
                    <Input id="structure" placeholder="如：三室两厅两卫" />
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="propertyRight">产权性质</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择产权" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="商品房">商品房</SelectItem>
                        <SelectItem value="经济适用房">经济适用房</SelectItem>
                        <SelectItem value="房改房">房改房</SelectItem>
                        <SelectItem value="集资房">集资房</SelectItem>
                        <SelectItem value="安置房">安置房</SelectItem>
                        <SelectItem value="产权车位">产权车位</SelectItem>
                      </SelectContent>
                    </Select>
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
            <CardTitle className="text-sm font-medium">房屋总数</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits}</div>
            <p className="text-xs text-muted-foreground">套</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总建筑面积</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalArea.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">平方米</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">住宅房屋</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{residentialCount}</div>
            <p className="text-xs text-muted-foreground">套</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">非住宅房屋</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commercialCount}</div>
            <p className="text-xs text-muted-foreground">套</p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>房屋列表</CardTitle>
          <CardDescription>管理所有楼栋下的房屋单元信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索房号、楼盘或楼栋..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedEstate} onValueChange={setSelectedEstate}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="所属楼盘" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部楼盘</SelectItem>
                {estates.map(estate => (
                  <SelectItem key={estate} value={estate}>{estate}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedUseType} onValueChange={setSelectedUseType}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="用途类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="住宅">住宅</SelectItem>
                <SelectItem value="商铺">商铺</SelectItem>
                <SelectItem value="办公">办公</SelectItem>
                <SelectItem value="车位">车位</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>房屋编号</TableHead>
                <TableHead>所属楼盘</TableHead>
                <TableHead>楼栋/楼层</TableHead>
                <TableHead>用途</TableHead>
                <TableHead>面积(m²)</TableHead>
                <TableHead>户型结构</TableHead>
                <TableHead>朝向</TableHead>
                <TableHead>装修</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.unitNo}</TableCell>
                  <TableCell>
                    <div className="text-sm">{unit.estateName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{unit.buildingName}</div>
                      <div className="text-xs text-muted-foreground">
                        {unit.floor > 0 ? `${unit.floor}层` : `地下${Math.abs(unit.floor)}层`} {unit.roomNo}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${useTypeConfig[unit.useType] || "bg-muted text-muted-foreground"}`}>
                      {unit.useType}
                    </span>
                  </TableCell>
                  <TableCell>{unit.area}</TableCell>
                  <TableCell className="text-sm">{unit.structure}</TableCell>
                  <TableCell className="text-sm">{unit.orientation}</TableCell>
                  <TableCell>
                    <span className={decorationConfig[unit.decoration] || ""}>
                      {unit.decoration}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[unit.status]?.variant || "secondary"}>
                      {statusConfig[unit.status]?.label || unit.status}
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
                          setSelectedUnit(unit)
                          setIsViewDialogOpen(true)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          编辑信息
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
        </CardContent>
      </Card>

      {/* 查看详情对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>房屋详情</DialogTitle>
            <DialogDescription>查看房屋单元的详细信息</DialogDescription>
          </DialogHeader>
          {selectedUnit && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DoorOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedUnit.unitNo}</h3>
                    <p className="text-sm text-muted-foreground">{selectedUnit.estateName} - {selectedUnit.buildingName}</p>
                  </div>
                </div>
                <Badge variant={statusConfig[selectedUnit.status]?.variant || "secondary"}>
                  {statusConfig[selectedUnit.status]?.label || selectedUnit.status}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">楼层</p>
                  <p className="font-medium">{selectedUnit.floor > 0 ? `${selectedUnit.floor}层` : `地下${Math.abs(selectedUnit.floor)}层`}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">房号</p>
                  <p className="font-medium">{selectedUnit.roomNo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">用途类型</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${useTypeConfig[selectedUnit.useType] || "bg-muted text-muted-foreground"}`}>
                    {selectedUnit.useType}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">建筑面积</p>
                  <p className="font-medium">{selectedUnit.area} m²</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">户型结构</p>
                  <p className="font-medium">{selectedUnit.structure}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">朝向</p>
                  <p className="font-medium">{selectedUnit.orientation}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">装修状况</p>
                  <p className={`font-medium ${decorationConfig[selectedUnit.decoration] || ""}`}>{selectedUnit.decoration}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">产权性质</p>
                  <p className="font-medium">{selectedUnit.propertyRight}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">电梯配置</p>
                  <p className="font-medium">{selectedUnit.hasElevator ? "有电梯" : "无电梯"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">录入日期</p>
                  <p className="font-medium">{selectedUnit.createdAt}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              关闭
            </Button>
            <Button>编辑信息</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
