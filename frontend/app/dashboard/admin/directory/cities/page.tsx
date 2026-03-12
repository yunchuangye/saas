"use client"

import { useState } from "react"
import { MapPin, Plus, Search, Edit, Trash2, ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react"
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
const provinces = [
  {
    id: "1",
    name: "广东省",
    code: "440000",
    cities: [
      { id: "1-1", name: "广州市", code: "440100", districts: 11, estates: 2456, status: "active" },
      { id: "1-2", name: "深圳市", code: "440300", districts: 10, estates: 3120, status: "active" },
      { id: "1-3", name: "东莞市", code: "441900", districts: 33, estates: 1890, status: "active" },
      { id: "1-4", name: "佛山市", code: "440600", districts: 5, estates: 1560, status: "active" },
    ],
  },
  {
    id: "2",
    name: "北京市",
    code: "110000",
    cities: [
      { id: "2-1", name: "北京市", code: "110100", districts: 16, estates: 4500, status: "active" },
    ],
  },
  {
    id: "3",
    name: "上海市",
    code: "310000",
    cities: [
      { id: "3-1", name: "上海市", code: "310100", districts: 16, estates: 3800, status: "active" },
    ],
  },
  {
    id: "4",
    name: "浙江省",
    code: "330000",
    cities: [
      { id: "4-1", name: "杭州市", code: "330100", districts: 13, estates: 2100, status: "active" },
      { id: "4-2", name: "宁波市", code: "330200", districts: 10, estates: 1450, status: "active" },
      { id: "4-3", name: "温州市", code: "330300", districts: 12, estates: 980, status: "inactive" },
    ],
  },
]

export default function CitiesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedProvinces, setExpandedProvinces] = useState<string[]>(["1"])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const toggleProvince = (provinceId: string) => {
    setExpandedProvinces(prev =>
      prev.includes(provinceId)
        ? prev.filter(id => id !== provinceId)
        : [...prev, provinceId]
    )
  }

  const totalCities = provinces.reduce((acc, p) => acc + p.cities.length, 0)
  const totalEstates = provinces.reduce(
    (acc, p) => acc + p.cities.reduce((cityAcc, c) => cityAcc + c.estates, 0),
    0
  )

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">城市管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理平台覆盖的城市区域，支持省/市/区三级结构
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              添加城市
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加城市</DialogTitle>
              <DialogDescription>
                添加新的城市到平台覆盖范围
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="province">所属省份</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="选择省份" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cityName">城市名称</Label>
                <Input id="cityName" placeholder="请输入城市名称" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cityCode">城市编码</Label>
                <Input id="cityCode" placeholder="请输入行政区划代码" />
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

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">覆盖省份</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{provinces.length}</div>
            <p className="text-xs text-muted-foreground">个省/直辖市</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">覆盖城市</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCities}</div>
            <p className="text-xs text-muted-foreground">个城市</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">楼盘总数</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEstates.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">个楼盘</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃城市</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {provinces.reduce((acc, p) => acc + p.cities.filter(c => c.status === "active").length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">个城市已启用</p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>城市列表</CardTitle>
          <CardDescription>按省份分组展示所有城市</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索城市名称或编码..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">已启用</SelectItem>
                <SelectItem value="inactive">已停用</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 省份-城市列表 */}
          <div className="space-y-2">
            {provinces.map((province) => (
              <div key={province.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleProvince(province.id)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedProvinces.includes(province.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="font-medium">{province.name}</span>
                    <Badge variant="secondary">{province.code}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {province.cities.length} 个城市
                  </span>
                </button>
                {expandedProvinces.includes(province.id) && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>城市名称</TableHead>
                        <TableHead>行政编码</TableHead>
                        <TableHead>区/县数量</TableHead>
                        <TableHead>楼盘数量</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {province.cities
                        .filter(city =>
                          city.name.includes(searchTerm) || city.code.includes(searchTerm)
                        )
                        .map((city) => (
                          <TableRow key={city.id}>
                            <TableCell className="font-medium">{city.name}</TableCell>
                            <TableCell>{city.code}</TableCell>
                            <TableCell>{city.districts}</TableCell>
                            <TableCell>{city.estates.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={city.status === "active" ? "default" : "secondary"}>
                                {city.status === "active" ? "已启用" : "已停用"}
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
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    编辑
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <MapPin className="mr-2 h-4 w-4" />
                                    管理区县
                                  </DropdownMenuItem>
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
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
