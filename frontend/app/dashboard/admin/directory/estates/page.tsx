"use client"

import { useState } from "react"
import { Building, Plus, Search, Edit, Trash2, Eye, MoreHorizontal, Filter, Download, MapPin } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LocationPicker } from "@/components/map/location-picker"

// 模拟数据
const estates = [
  {
    id: "1",
    name: "万科金域华府",
    city: "广州市",
    district: "天河区",
    address: "天河区黄埔大道西668号",
    type: "住宅",
    developer: "万科地产",
    buildYear: 2018,
    buildings: 12,
    units: 2400,
    avgPrice: 68000,
    status: "active",
    createdAt: "2023-05-10",
  },
  {
    id: "2",
    name: "保利天悦",
    city: "广州市",
    district: "海珠区",
    address: "海珠区新港东路1168号",
    type: "住宅",
    developer: "保利地产",
    buildYear: 2020,
    buildings: 8,
    units: 1560,
    avgPrice: 75000,
    status: "active",
    createdAt: "2023-06-15",
  },
  {
    id: "3",
    name: "珠江新城广场",
    city: "广州市",
    district: "天河区",
    address: "天河区珠江新城华夏路28号",
    type: "商业",
    developer: "珠江实业",
    buildYear: 2015,
    buildings: 2,
    units: 580,
    avgPrice: 120000,
    status: "active",
    createdAt: "2023-03-20",
  },
  {
    id: "4",
    name: "深圳湾一号",
    city: "深圳市",
    district: "南山区",
    address: "南山区深圳湾口岸东侧",
    type: "住宅",
    developer: "鸿荣源集团",
    buildYear: 2016,
    buildings: 6,
    units: 420,
    avgPrice: 250000,
    status: "active",
    createdAt: "2023-02-08",
  },
  {
    id: "5",
    name: "龙湖天街",
    city: "杭州市",
    district: "滨江区",
    address: "滨江区江南大道558号",
    type: "商业",
    developer: "龙湖集团",
    buildYear: 2019,
    buildings: 3,
    units: 320,
    avgPrice: 85000,
    status: "pending",
    createdAt: "2024-01-10",
  },
  {
    id: "6",
    name: "融创壹号院",
    city: "上海市",
    district: "浦东新区",
    address: "浦东新区世纪大道1568号",
    type: "住宅",
    developer: "融创中国",
    buildYear: 2021,
    buildings: 10,
    units: 1800,
    avgPrice: 135000,
    status: "active",
    createdAt: "2023-08-22",
  },
]

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  active: { label: "已上线", variant: "default" },
  pending: { label: "待审核", variant: "secondary" },
  inactive: { label: "已下线", variant: "outline" },
}

const typeConfig: Record<string, { label: string; color: string }> = {
  "住宅": { label: "住宅", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  "商业": { label: "商业", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  "办公": { label: "办公", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
  "工业": { label: "工业", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
}

export default function EstatesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedEstate, setSelectedEstate] = useState<typeof estates[0] | null>(null)
  const [selectedCity, setSelectedCity] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [estateLocation, setEstateLocation] = useState<{ lat: number; lng: number; address?: string } | undefined>()

  const filteredEstates = estates.filter(estate => {
    const matchesSearch = estate.name.includes(searchTerm) || estate.address.includes(searchTerm)
    const matchesCity = selectedCity === "all" || estate.city === selectedCity
    const matchesType = selectedType === "all" || estate.type === selectedType
    return matchesSearch && matchesCity && matchesType
  })

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">楼盘管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理平台的楼盘基础数据，包括楼盘信息、位置、价格等
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
                添加楼盘
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>添加楼盘</DialogTitle>
                <DialogDescription>
                  添加新的楼盘信息到平台数据库
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="estateName">楼盘名称</Label>
                    <Input id="estateName" placeholder="请输入楼盘名称" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="estateType">物业类型</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="住宅">住宅</SelectItem>
                        <SelectItem value="商业">商业</SelectItem>
                        <SelectItem value="办公">办公</SelectItem>
                        <SelectItem value="工业">工业</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">所在城市</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择城市" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="广州市">广州市</SelectItem>
                        <SelectItem value="深圳市">深圳市</SelectItem>
                        <SelectItem value="上海市">上海市</SelectItem>
                        <SelectItem value="杭州市">杭州市</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="district">所在区县</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择区县" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="天河区">天河区</SelectItem>
                        <SelectItem value="海珠区">海珠区</SelectItem>
                        <SelectItem value="越秀区">越秀区</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">详细地址</Label>
                  <Input id="address" placeholder="请输入详细地址" />
                </div>
                <div className="grid gap-2">
                  <Label>地理位置</Label>
                  <LocationPicker
                    value={estateLocation}
                    onChange={setEstateLocation}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="developer">开发商</Label>
                    <Input id="developer" placeholder="开发商名称" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="buildYear">建成年份</Label>
                    <Input id="buildYear" type="number" placeholder="如 2020" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="avgPrice">参考均价</Label>
                    <Input id="avgPrice" type="number" placeholder="元/平米" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">楼盘描述</Label>
                  <Textarea id="description" placeholder="请输入楼盘描述信息" rows={3} />
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
            <CardTitle className="text-sm font-medium">楼盘总数</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estates.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">个楼盘</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已上线</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estates.filter(e => e.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">个楼盘</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审核</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estates.filter(e => e.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">个楼盘</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">覆盖城市</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(estates.map(e => e.city)).size}
            </div>
            <p className="text-xs text-muted-foreground">个城市</p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>楼盘列表</CardTitle>
          <CardDescription>管理平台所有楼盘数据</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索楼盘名称或地址..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="选择城市" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部城市</SelectItem>
                <SelectItem value="广州市">广州市</SelectItem>
                <SelectItem value="深圳市">深圳市</SelectItem>
                <SelectItem value="上海市">上海市</SelectItem>
                <SelectItem value="杭州市">杭州市</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="物业类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="住宅">住宅</SelectItem>
                <SelectItem value="商业">商业</SelectItem>
                <SelectItem value="办公">办公</SelectItem>
                <SelectItem value="工业">工业</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>楼盘名称</TableHead>
                <TableHead>所在位置</TableHead>
                <TableHead>物业类型</TableHead>
                <TableHead>开发商</TableHead>
                <TableHead>建成年份</TableHead>
                <TableHead>楼栋数</TableHead>
                <TableHead>参考均价</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEstates.map((estate) => (
                <TableRow key={estate.id}>
                  <TableCell className="font-medium">{estate.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{estate.city} {estate.district}</div>
                      <div className="text-muted-foreground text-xs">{estate.address}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${typeConfig[estate.type]?.color || "bg-muted text-muted-foreground"}`}>
                      {estate.type}
                    </span>
                  </TableCell>
                  <TableCell>{estate.developer}</TableCell>
                  <TableCell>{estate.buildYear}</TableCell>
                  <TableCell>{estate.buildings}</TableCell>
                  <TableCell>{estate.avgPrice.toLocaleString()} 元/m²</TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[estate.status]?.variant || "secondary"}>
                      {statusConfig[estate.status]?.label || estate.status}
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
                          setSelectedEstate(estate)
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
                          <Building className="mr-2 h-4 w-4" />
                          管理楼栋
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除楼盘
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
            <DialogTitle>楼盘详情</DialogTitle>
            <DialogDescription>查看楼盘的详细信息</DialogDescription>
          </DialogHeader>
          {selectedEstate && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedEstate.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedEstate.developer}</p>
                  </div>
                </div>
                <Badge variant={statusConfig[selectedEstate.status]?.variant || "secondary"}>
                  {statusConfig[selectedEstate.status]?.label || selectedEstate.status}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">所在城市</p>
                  <p className="font-medium">{selectedEstate.city}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">所在区域</p>
                  <p className="font-medium">{selectedEstate.district}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">物业类型</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${typeConfig[selectedEstate.type]?.color || "bg-muted text-muted-foreground"}`}>
                    {selectedEstate.type}
                  </span>
                </div>
                <div className="col-span-3">
                  <p className="text-sm text-muted-foreground">详细地址</p>
                  <p className="font-medium">{selectedEstate.address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">建成年份</p>
                  <p className="font-medium">{selectedEstate.buildYear}年</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">楼栋数量</p>
                  <p className="font-medium">{selectedEstate.buildings}栋</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">总户数</p>
                  <p className="font-medium">{selectedEstate.units}户</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">参考均价</p>
                  <p className="font-medium text-primary">{selectedEstate.avgPrice.toLocaleString()} 元/m²</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">录入日期</p>
                  <p className="font-medium">{selectedEstate.createdAt}</p>
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
