"use client"

import { useState } from "react"
import { Layers, Plus, Search, Edit, Trash2, Eye, MoreHorizontal, Filter, Download, Building } from "lucide-react"
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

// 模拟数据
const buildings = [
  {
    id: "1",
    name: "1栋",
    estate: "万科金域华府",
    city: "广州市",
    district: "天河区",
    floors: 32,
    units: 4,
    households: 128,
    structure: "框架剪力墙",
    buildYear: 2018,
    elevator: true,
    status: "active",
  },
  {
    id: "2",
    name: "2栋",
    estate: "万科金域华府",
    city: "广州市",
    district: "天河区",
    floors: 32,
    units: 4,
    households: 128,
    structure: "框架剪力墙",
    buildYear: 2018,
    elevator: true,
    status: "active",
  },
  {
    id: "3",
    name: "A座",
    estate: "珠江新城广场",
    city: "广州市",
    district: "天河区",
    floors: 58,
    units: 8,
    households: 464,
    structure: "钢筋混凝土",
    buildYear: 2015,
    elevator: true,
    status: "active",
  },
  {
    id: "4",
    name: "B座",
    estate: "珠江新城广场",
    city: "广州市",
    district: "天河区",
    floors: 42,
    units: 6,
    households: 252,
    structure: "钢筋混凝土",
    buildYear: 2015,
    elevator: true,
    status: "active",
  },
  {
    id: "5",
    name: "1号楼",
    estate: "深圳湾一号",
    city: "深圳市",
    district: "南山区",
    floors: 45,
    units: 2,
    households: 90,
    structure: "框架剪力墙",
    buildYear: 2016,
    elevator: true,
    status: "active",
  },
  {
    id: "6",
    name: "东塔",
    estate: "融创壹号院",
    city: "上海市",
    district: "浦东新区",
    floors: 38,
    units: 4,
    households: 152,
    structure: "框架剪力墙",
    buildYear: 2021,
    elevator: true,
    status: "pending",
  },
  {
    id: "7",
    name: "西塔",
    estate: "融创壹号院",
    city: "上海市",
    district: "浦东新区",
    floors: 38,
    units: 4,
    households: 152,
    structure: "框架剪力墙",
    buildYear: 2021,
    elevator: true,
    status: "pending",
  },
]

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "已上线", variant: "default" },
  pending: { label: "待审核", variant: "secondary" },
  inactive: { label: "已下线", variant: "outline" },
}

export default function BuildingsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState<typeof buildings[0] | null>(null)
  const [selectedEstate, setSelectedEstate] = useState("all")

  const filteredBuildings = buildings.filter(building => {
    const matchesSearch = building.name.includes(searchTerm) || building.estate.includes(searchTerm)
    const matchesEstate = selectedEstate === "all" || building.estate === selectedEstate
    return matchesSearch && matchesEstate
  })

  const totalHouseholds = buildings.reduce((acc, b) => acc + b.households, 0)
  const uniqueEstates = new Set(buildings.map(b => b.estate)).size

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">楼栋管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理楼盘内的楼栋信息，包括楼层、单元、户型等
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
                添加楼栋
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>添加楼栋</DialogTitle>
                <DialogDescription>
                  为楼盘添加新的楼栋信息
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="estate">所属楼盘</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择楼盘" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="万科金域华府">万科金域华府</SelectItem>
                        <SelectItem value="保利天悦">保利天悦</SelectItem>
                        <SelectItem value="珠江新城广场">珠江新城广场</SelectItem>
                        <SelectItem value="深圳湾一号">深圳湾一号</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="buildingName">楼栋名称</Label>
                    <Input id="buildingName" placeholder="如: 1栋、A座" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="floors">楼层数</Label>
                    <Input id="floors" type="number" placeholder="总楼层" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="units">单元数</Label>
                    <Input id="units" type="number" placeholder="每层单元" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="households">总户数</Label>
                    <Input id="households" type="number" placeholder="总户数" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="structure">建筑结构</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择结构" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="框架剪力墙">框架���力墙</SelectItem>
                        <SelectItem value="钢筋混凝土">钢筋混凝土</SelectItem>
                        <SelectItem value="框架结构">框架结构</SelectItem>
                        <SelectItem value="砖混结构">砖混结构</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="buildYear">建成年份</Label>
                    <Input id="buildYear" type="number" placeholder="如 2020" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="elevator" className="h-4 w-4" />
                  <Label htmlFor="elevator">配备电梯</Label>
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
            <CardTitle className="text-sm font-medium">楼栋总数</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buildings.length}</div>
            <p className="text-xs text-muted-foreground">栋楼</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">关联楼盘</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueEstates}</div>
            <p className="text-xs text-muted-foreground">个楼盘</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总户数</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHouseholds.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">户</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审核</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {buildings.filter(b => b.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">栋楼</p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>楼栋列表</CardTitle>
          <CardDescription>管理所有楼栋数据</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索楼栋名称或楼盘..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedEstate} onValueChange={setSelectedEstate}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择楼盘" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部楼盘</SelectItem>
                <SelectItem value="万科金域华府">万科金域华府</SelectItem>
                <SelectItem value="珠江新城广场">珠江新城广场</SelectItem>
                <SelectItem value="深圳湾一号">深圳湾一号</SelectItem>
                <SelectItem value="融创壹号院">融创壹号院</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>楼栋名称</TableHead>
                <TableHead>所属楼盘</TableHead>
                <TableHead>位置</TableHead>
                <TableHead>楼层</TableHead>
                <TableHead>单元</TableHead>
                <TableHead>总户数</TableHead>
                <TableHead>建筑结构</TableHead>
                <TableHead>电梯</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBuildings.map((building) => (
                <TableRow key={building.id}>
                  <TableCell className="font-medium">{building.name}</TableCell>
                  <TableCell>{building.estate}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {building.city} {building.district}
                    </span>
                  </TableCell>
                  <TableCell>{building.floors}F</TableCell>
                  <TableCell>{building.units}单元</TableCell>
                  <TableCell>{building.households}户</TableCell>
                  <TableCell>{building.structure}</TableCell>
                  <TableCell>
                    {building.elevator ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">有</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">无</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[building.status]?.variant || "secondary"}>
                      {statusConfig[building.status]?.label || building.status}
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
                          setSelectedBuilding(building)
                          setIsViewDialogOpen(true)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          编辑信息
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Layers className="mr-2 h-4 w-4" />
                          管理户型
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除楼栋
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
            <DialogTitle>楼栋详情</DialogTitle>
            <DialogDescription>查看楼栋的详细信息</DialogDescription>
          </DialogHeader>
          {selectedBuilding && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Layers className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedBuilding.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedBuilding.estate}</p>
                  </div>
                </div>
                <Badge variant={statusConfig[selectedBuilding.status]?.variant || "secondary"}>
                  {statusConfig[selectedBuilding.status]?.label || selectedBuilding.status}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">所在城市</p>
                  <p className="font-medium">{selectedBuilding.city}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">所在区域</p>
                  <p className="font-medium">{selectedBuilding.district}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">建成年份</p>
                  <p className="font-medium">{selectedBuilding.buildYear}年</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">楼层数</p>
                  <p className="font-medium">{selectedBuilding.floors}层</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">单元数</p>
                  <p className="font-medium">{selectedBuilding.units}单元</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">总户数</p>
                  <p className="font-medium">{selectedBuilding.households}户</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">建筑结构</p>
                  <p className="font-medium">{selectedBuilding.structure}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">配备电梯</p>
                  <p className="font-medium">{selectedBuilding.elevator ? "是" : "否"}</p>
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
