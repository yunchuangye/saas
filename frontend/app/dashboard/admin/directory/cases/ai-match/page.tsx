"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScanSearch, ArrowLeft, Bot, Search, MapPin, Building, Home, Sparkles, Eye, Plus, Check } from "lucide-react"
import Link from "next/link"

// 匹配结果数据
const matchResults = [
  {
    id: 1,
    address: "陆家嘴花园2号楼1502",
    distance: "同小区",
    area: 128,
    layout: "3室2厅",
    floor: "15/32",
    price: 1280,
    unitPrice: 10,
    dealDate: "2024-01-10",
    similarity: 96,
    selected: false,
  },
  {
    id: 2,
    address: "陆家嘴花园5号楼803",
    distance: "同小区",
    area: 122,
    layout: "3室2厅",
    floor: "8/28",
    price: 1195,
    unitPrice: 9.8,
    dealDate: "2024-01-05",
    similarity: 94,
    selected: false,
  },
  {
    id: 3,
    address: "世茂滨江花园3栋1201",
    distance: "500米",
    area: 130,
    layout: "3室2厅",
    floor: "12/35",
    price: 1350,
    unitPrice: 10.4,
    dealDate: "2024-01-08",
    similarity: 89,
    selected: false,
  },
  {
    id: 4,
    address: "仁恒滨江园7号楼2101",
    distance: "800米",
    area: 125,
    layout: "3室2厅",
    floor: "21/30",
    price: 1312,
    unitPrice: 10.5,
    dealDate: "2023-12-28",
    similarity: 85,
    selected: false,
  },
  {
    id: 5,
    address: "浦江名邸A座1803",
    distance: "1.2公里",
    area: 118,
    layout: "3室1厅",
    floor: "18/26",
    price: 1100,
    unitPrice: 9.3,
    dealDate: "2024-01-02",
    similarity: 78,
    selected: false,
  },
]

export default function AIMatchPage() {
  const [isMatching, setIsMatching] = useState(false)
  const [showResults, setShowResults] = useState(true)
  const [selectedCases, setSelectedCases] = useState<number[]>([])
  const [matchRange, setMatchRange] = useState([2])

  const handleMatch = () => {
    setIsMatching(true)
    setShowResults(false)
    setTimeout(() => {
      setIsMatching(false)
      setShowResults(true)
    }, 1500)
  }

  const toggleSelect = (id: number) => {
    if (selectedCases.includes(id)) {
      setSelectedCases(selectedCases.filter(i => i !== id))
    } else {
      setSelectedCases([...selectedCases, id])
    }
  }

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 90) return "bg-green-100 text-green-700"
    if (similarity >= 80) return "bg-blue-100 text-blue-700"
    if (similarity >= 70) return "bg-yellow-100 text-yellow-700"
    return "bg-gray-100 text-gray-700"
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/directory/cases">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
                <ScanSearch className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold">AI案例匹配</h1>
              <Badge variant="secondary" className="ml-2">OpenClaw</Badge>
            </div>
            <p className="text-muted-foreground mt-1">智能匹配相似案例，为评估提供可靠参考依据</p>
          </div>
        </div>
        {selectedCases.length > 0 && (
          <Button className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700">
            <Plus className="mr-2 h-4 w-4" />
            添加{selectedCases.length}个案例到报告
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左侧：目标房源信息 */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">目标房源</CardTitle>
              <CardDescription>输入需要匹配的房源信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>城市</Label>
                <Select defaultValue="shanghai">
                  <SelectTrigger>
                    <SelectValue placeholder="选择城市" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shanghai">上海</SelectItem>
                    <SelectItem value="beijing">北京</SelectItem>
                    <SelectItem value="shenzhen">深圳</SelectItem>
                    <SelectItem value="guangzhou">广州</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>小区名称</Label>
                <Input placeholder="输入小区名称" defaultValue="陆家嘴花园" />
              </div>

              <div className="space-y-2">
                <Label>详细地址</Label>
                <Input placeholder="楼栋门牌号" defaultValue="3号楼1201室" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>建筑面积(㎡)</Label>
                  <Input type="number" placeholder="面积" defaultValue="125" />
                </div>
                <div className="space-y-2">
                  <Label>户型</Label>
                  <Select defaultValue="3room">
                    <SelectTrigger>
                      <SelectValue placeholder="户型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1room">一室</SelectItem>
                      <SelectItem value="2room">两室</SelectItem>
                      <SelectItem value="3room">三室</SelectItem>
                      <SelectItem value="4room">四室</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>所在楼层</Label>
                  <Input type="number" placeholder="楼层" defaultValue="12" />
                </div>
                <div className="space-y-2">
                  <Label>总楼层</Label>
                  <Input type="number" placeholder="总层" defaultValue="32" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>建成年份</Label>
                <Input type="number" placeholder="年份" defaultValue="2010" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">匹配条件</CardTitle>
              <CardDescription>设置案例匹配参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>匹配范围: {matchRange[0]}公里</Label>
                <Slider 
                  value={matchRange} 
                  onValueChange={setMatchRange}
                  max={5} 
                  min={0.5}
                  step={0.5}
                  className="mt-2"
                />
              </div>

              <div className="space-y-2">
                <Label>案例时间</Label>
                <Select defaultValue="6m">
                  <SelectTrigger>
                    <SelectValue placeholder="选择时间范围" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3m">近3个月</SelectItem>
                    <SelectItem value="6m">近6个月</SelectItem>
                    <SelectItem value="12m">近12个月</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>案例类型</Label>
                <Select defaultValue="deal">
                  <SelectTrigger>
                    <SelectValue placeholder="选择案例类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deal">成交案例</SelectItem>
                    <SelectItem value="quote">报价案例</SelectItem>
                    <SelectItem value="all">全部案例</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>最低相似度</Label>
                <Select defaultValue="70">
                  <SelectTrigger>
                    <SelectValue placeholder="选择最低相似度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90%以上</SelectItem>
                    <SelectItem value="80">80%以上</SelectItem>
                    <SelectItem value="70">70%以上</SelectItem>
                    <SelectItem value="60">60%以上</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700" 
                onClick={handleMatch}
                disabled={isMatching}
              >
                {isMatching ? (
                  <>
                    <Bot className="mr-2 h-4 w-4 animate-pulse" />
                    智能匹配中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    开始智能匹配
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：匹配结果 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 匹配统计 */}
          <div className="grid sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <ScanSearch className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">5</div>
                    <div className="text-sm text-muted-foreground">匹配案例</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">2</div>
                    <div className="text-sm text-muted-foreground">高相似度</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">2</div>
                    <div className="text-sm text-muted-foreground">同小区</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Home className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">10.0</div>
                    <div className="text-sm text-muted-foreground">均价(万/㎡)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 匹配结果列表 */}
          {showResults && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">匹配案例列表</CardTitle>
                    <CardDescription>按相似度排序，选择案例添加到评估报告</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    已选中 {selectedCases.length} 个
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>房源地址</TableHead>
                      <TableHead>距离</TableHead>
                      <TableHead>面积</TableHead>
                      <TableHead>户型</TableHead>
                      <TableHead>楼层</TableHead>
                      <TableHead>成交价</TableHead>
                      <TableHead>单价</TableHead>
                      <TableHead>相似度</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matchResults.map((item) => (
                      <TableRow key={item.id} className={selectedCases.includes(item.id) ? "bg-orange-50" : ""}>
                        <TableCell>
                          <Button 
                            variant={selectedCases.includes(item.id) ? "default" : "outline"} 
                            size="icon" 
                            className={`h-7 w-7 ${selectedCases.includes(item.id) ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                            onClick={() => toggleSelect(item.id)}
                          >
                            {selectedCases.includes(item.id) ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{item.address}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.distance}</Badge>
                        </TableCell>
                        <TableCell>{item.area}㎡</TableCell>
                        <TableCell>{item.layout}</TableCell>
                        <TableCell>{item.floor}</TableCell>
                        <TableCell className="font-medium">{item.price}万</TableCell>
                        <TableCell>{item.unitPrice}万/㎡</TableCell>
                        <TableCell>
                          <Badge className={getSimilarityColor(item.similarity)}>
                            {item.similarity}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* 分析摘要 */}
          {showResults && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-lg">AI分析摘要</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p>
                    <span className="font-medium">匹配概况：</span>
                    共找到5个相似案例，其中2个为同小区成交案例，高度可比。
                  </p>
                  <p>
                    <span className="font-medium">价格分析：</span>
                    匹配案例成交均价为10.0万/㎡，价格区间9.3-10.5万/㎡，与目标房源条件相当。
                  </p>
                  <p>
                    <span className="font-medium">建议估值：</span>
                    根据可比案例分析，建议估值区间为<span className="font-bold text-orange-600">1200-1300万</span>，中间值约<span className="font-bold text-orange-600">1250万</span>。
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
