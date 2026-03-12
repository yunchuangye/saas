"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, ArrowLeft, Bot, Search, Calendar, Building, MapPin, Sparkles, ChevronUp, ChevronDown, Minus } from "lucide-react"
import Link from "next/link"

// 预测历史记录
const predictionHistory = [
  { 
    id: "P001", 
    address: "上海市浦东新区陆家嘴花园3号楼1201",
    area: 125,
    currentPrice: 1250,
    predictPrice: 1320,
    trend: "up",
    change: "+5.6%",
    confidence: 92,
    time: "2024-01-15 15:30" 
  },
  { 
    id: "P002", 
    address: "北京市朝阳区望京SOHO T1 2305",
    area: 89,
    currentPrice: 890,
    predictPrice: 865,
    trend: "down",
    change: "-2.8%",
    confidence: 88,
    time: "2024-01-15 14:20" 
  },
  { 
    id: "P003", 
    address: "深圳市南山区科技园深南花园A座501",
    area: 156,
    currentPrice: 1500,
    predictPrice: 1580,
    trend: "up",
    change: "+5.3%",
    confidence: 95,
    time: "2024-01-15 13:10" 
  },
  { 
    id: "P004", 
    address: "广州市天河区珠江新城富力天河华府1802",
    area: 120,
    currentPrice: 680,
    predictPrice: 680,
    trend: "stable",
    change: "0%",
    confidence: 90,
    time: "2024-01-15 11:45" 
  },
]

// 区域走势数据
const areatrends = [
  { area: "浦东新区", current: 8.5, predict: 8.9, change: "+4.7%" },
  { area: "徐汇区", current: 9.2, predict: 9.5, change: "+3.3%" },
  { area: "静安区", current: 10.1, predict: 10.3, change: "+2.0%" },
  { area: "黄浦区", current: 11.5, predict: 11.8, change: "+2.6%" },
  { area: "长宁区", current: 8.8, predict: 9.0, change: "+2.3%" },
]

export default function AIPredictPage() {
  const [isPredicting, setIsPredicting] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [predictionResult, setPredictionResult] = useState({
    currentPrice: 1250,
    predictPrice: 1320,
    change: "+5.6%",
    confidence: 92,
    factors: [
      { name: "地段位置", impact: "+3.2%", description: "核心商圈，配套成熟" },
      { name: "交通便利", impact: "+1.5%", description: "地铁500米，多条公交线路" },
      { name: "学区资源", impact: "+1.8%", description: "对口市重点小学" },
      { name: "房龄因素", impact: "-0.9%", description: "建成年限15年" },
    ]
  })

  const handlePredict = () => {
    setIsPredicting(true)
    setShowResult(false)
    setTimeout(() => {
      setIsPredicting(false)
      setShowResult(true)
    }, 2000)
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
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold">AI价格预测</h1>
              <Badge variant="secondary" className="ml-2">OpenClaw</Badge>
            </div>
            <p className="text-muted-foreground mt-1">基于历史案例和市场数据预测房屋价格走势</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左侧：预测表单 */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">价格预测</CardTitle>
              <CardDescription>输入房屋信息进行价格预测</CardDescription>
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
                <Label>区域</Label>
                <Select defaultValue="pudong">
                  <SelectTrigger>
                    <SelectValue placeholder="选择区域" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pudong">浦东新区</SelectItem>
                    <SelectItem value="xuhui">徐汇区</SelectItem>
                    <SelectItem value="jingan">静安区</SelectItem>
                    <SelectItem value="huangpu">黄浦区</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>小区名称</Label>
                <Input placeholder="输入小区名称" defaultValue="陆家嘴花园" />
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
                  <Label>楼层</Label>
                  <Input type="number" placeholder="楼层" defaultValue="12" />
                </div>
                <div className="space-y-2">
                  <Label>总层数</Label>
                  <Input type="number" placeholder="总层数" defaultValue="32" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>建成年份</Label>
                <Input type="number" placeholder="年份" defaultValue="2010" />
              </div>

              <div className="space-y-2">
                <Label>预测时间范围</Label>
                <Select defaultValue="3m">
                  <SelectTrigger>
                    <SelectValue placeholder="选择预测周期" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">未来1个月</SelectItem>
                    <SelectItem value="3m">未来3个月</SelectItem>
                    <SelectItem value="6m">未来6个月</SelectItem>
                    <SelectItem value="12m">未来12个月</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" 
                onClick={handlePredict}
                disabled={isPredicting}
              >
                {isPredicting ? (
                  <>
                    <Bot className="mr-2 h-4 w-4 animate-pulse" />
                    AI分析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    开始预测
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 区域走势 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">区域价格走势</CardTitle>
              <CardDescription>上海各区域3个月预测</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {areatrends.map((item) => (
                  <div key={item.area} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">{item.area}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.current}万/㎡ → {item.predict}万/㎡
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      <ChevronUp className="h-3 w-3 mr-1" />
                      {item.change}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：预测结果和历史 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 预测结果 */}
          {showResult && (
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  <CardTitle>AI预测结果</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-sm text-muted-foreground mb-1">当前估值</div>
                    <div className="text-3xl font-bold">{predictionResult.currentPrice}万</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-sm text-muted-foreground mb-1">预测价格(3个月)</div>
                    <div className="text-3xl font-bold text-purple-600">{predictionResult.predictPrice}万</div>
                    <Badge className="mt-2 bg-green-100 text-green-700">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {predictionResult.change}
                    </Badge>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-sm text-muted-foreground mb-1">置信度</div>
                    <div className="text-3xl font-bold text-blue-600">{predictionResult.confidence}%</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="font-medium">影响因素分析</div>
                  {predictionResult.factors.map((factor, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div>
                        <div className="font-medium">{factor.name}</div>
                        <div className="text-sm text-muted-foreground">{factor.description}</div>
                      </div>
                      <Badge variant={factor.impact.startsWith('+') ? 'default' : 'secondary'} 
                        className={factor.impact.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {factor.impact.startsWith('+') ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                        {factor.impact}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 预测历史 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">预测历史记录</CardTitle>
              <CardDescription>查看历史价格预测记录</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>房源地址</TableHead>
                    <TableHead>面积</TableHead>
                    <TableHead>当前价格</TableHead>
                    <TableHead>预测价格</TableHead>
                    <TableHead>涨跌幅</TableHead>
                    <TableHead>置信度</TableHead>
                    <TableHead>预测时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {predictionHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium max-w-xs truncate">{item.address}</TableCell>
                      <TableCell>{item.area}㎡</TableCell>
                      <TableCell>{item.currentPrice}万</TableCell>
                      <TableCell className="font-medium">{item.predictPrice}万</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={
                          item.trend === 'up' ? 'bg-green-100 text-green-700' : 
                          item.trend === 'down' ? 'bg-red-100 text-red-700' : 
                          'bg-gray-100 text-gray-700'
                        }>
                          {item.trend === 'up' && <ChevronUp className="h-3 w-3 mr-1" />}
                          {item.trend === 'down' && <ChevronDown className="h-3 w-3 mr-1" />}
                          {item.trend === 'stable' && <Minus className="h-3 w-3 mr-1" />}
                          {item.change}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-600 rounded-full" 
                              style={{ width: `${item.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm">{item.confidence}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
