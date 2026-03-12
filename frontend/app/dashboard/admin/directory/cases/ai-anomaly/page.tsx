"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, ArrowLeft, Bot, Search, Shield, ShieldAlert, ShieldCheck, ShieldX, Eye, CheckCircle2, XCircle, Sparkles, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"

// 异常类型统计
const anomalyStats = [
  { type: "price_high", name: "价格过高", icon: TrendingUp, count: 45, color: "red" },
  { type: "price_low", name: "价格过低", icon: TrendingDown, count: 28, color: "orange" },
  { type: "area_mismatch", name: "面积异常", icon: ShieldAlert, count: 12, color: "yellow" },
  { type: "data_conflict", name: "数据冲突", icon: ShieldX, count: 8, color: "purple" },
]

// 异常案例数据
const anomalyCases = [
  {
    id: "A001",
    address: "上海市浦东新区陆家嘴花园3号楼1201",
    area: 125,
    reportPrice: 1850,
    marketPrice: 1250,
    deviation: "+48%",
    type: "price_high",
    severity: "high",
    reason: "报价显著高于同区域同类型房源市场均价",
    status: "pending",
  },
  {
    id: "A002",
    address: "北京市朝阳区望京SOHO T1 2305",
    area: 89,
    reportPrice: 520,
    marketPrice: 890,
    deviation: "-42%",
    type: "price_low",
    severity: "high",
    reason: "报价显著低于同区域同类型房源市场均价",
    status: "pending",
  },
  {
    id: "A003",
    address: "深圳市南山区科技园深南花园A座501",
    area: 256,
    reportPrice: 1500,
    marketPrice: 1560,
    deviation: "-4%",
    type: "area_mismatch",
    severity: "medium",
    reason: "建筑面积256㎡与户型数据不符，疑似录入错误",
    status: "reviewed",
  },
  {
    id: "A004",
    address: "广州市天河区珠江新城富力天河华府1802",
    area: 120,
    reportPrice: 720,
    marketPrice: 680,
    deviation: "+6%",
    type: "data_conflict",
    severity: "low",
    reason: "同一房源在不同平台存在价格冲突(差异>5%)",
    status: "resolved",
  },
  {
    id: "A005",
    address: "杭州市西湖区西溪湿地旁绿城西溪诚园5栋301",
    area: 145,
    reportPrice: 280,
    marketPrice: 520,
    deviation: "-46%",
    type: "price_low",
    severity: "high",
    reason: "报价显著低于同区域同类型房源市场均价，疑似虚假信息",
    status: "pending",
  },
]

export default function AIAnomalyPage() {
  const [isDetecting, setIsDetecting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedType, setSelectedType] = useState("all")

  const startDetect = () => {
    setIsDetecting(true)
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsDetecting(false)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 300)
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high": return <Badge className="bg-red-100 text-red-700">高风险</Badge>
      case "medium": return <Badge className="bg-yellow-100 text-yellow-700">中风险</Badge>
      case "low": return <Badge className="bg-blue-100 text-blue-700">低风险</Badge>
      default: return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary">待审核</Badge>
      case "reviewed": return <Badge className="bg-blue-100 text-blue-700">已审核</Badge>
      case "resolved": return <Badge className="bg-green-100 text-green-700">已处理</Badge>
      default: return null
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "price_high": return <Badge className="bg-red-100 text-red-700">价格过高</Badge>
      case "price_low": return <Badge className="bg-orange-100 text-orange-700">价格过低</Badge>
      case "area_mismatch": return <Badge className="bg-yellow-100 text-yellow-700">面积异常</Badge>
      case "data_conflict": return <Badge className="bg-purple-100 text-purple-700">数据冲突</Badge>
      default: return null
    }
  }

  const filteredCases = selectedType === "all" 
    ? anomalyCases 
    : anomalyCases.filter(c => c.type === selectedType)

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
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-500">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold">AI异常检测</h1>
              <Badge variant="secondary" className="ml-2">OpenClaw</Badge>
            </div>
            <p className="text-muted-foreground mt-1">智能检测价格异常、数据错误等问题案例</p>
          </div>
        </div>
        <Button 
          className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
          onClick={startDetect}
          disabled={isDetecting}
        >
          {isDetecting ? (
            <>
              <Bot className="mr-2 h-4 w-4 animate-pulse" />
              检测中...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              开始检测
            </>
          )}
        </Button>
      </div>

      {/* 检测进度 */}
      {isDetecting && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-red-100 animate-pulse">
                <Bot className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">OpenClaw 正在检测异常数据...</span>
                  <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold text-lg">12,580</div>
                <div className="text-muted-foreground">已扫描</div>
              </div>
              <div>
                <div className="font-semibold text-lg text-red-600">93</div>
                <div className="text-muted-foreground">发现异常</div>
              </div>
              <div>
                <div className="font-semibold text-lg text-orange-600">45</div>
                <div className="text-muted-foreground">高风险</div>
              </div>
              <div>
                <div className="font-semibold text-lg">00:01:25</div>
                <div className="text-muted-foreground">已用时</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 异常类型统计 */}
      <div className="grid sm:grid-cols-4 gap-4">
        {anomalyStats.map((stat) => (
          <Card 
            key={stat.type} 
            className={`cursor-pointer transition-all ${selectedType === stat.type ? 'ring-2 ring-red-500' : ''}`}
            onClick={() => setSelectedType(selectedType === stat.type ? "all" : stat.type)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    stat.color === 'red' ? 'bg-red-100' :
                    stat.color === 'orange' ? 'bg-orange-100' :
                    stat.color === 'yellow' ? 'bg-yellow-100' : 'bg-purple-100'
                  }`}>
                    <stat.icon className={`h-5 w-5 ${
                      stat.color === 'red' ? 'text-red-600' :
                      stat.color === 'orange' ? 'text-orange-600' :
                      stat.color === 'yellow' ? 'text-yellow-600' : 'text-purple-600'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium">{stat.name}</div>
                    <div className="text-xs text-muted-foreground">点击筛选</div>
                  </div>
                </div>
                <div className="text-2xl font-bold">{stat.count}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 整体风险评估 */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100">
              <ShieldCheck className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">99.3%</div>
              <div className="text-sm text-muted-foreground">数据健康度</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-100">
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600">93</div>
              <div className="text-sm text-muted-foreground">异常案例总数</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-orange-100">
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">45</div>
              <div className="text-sm text-muted-foreground">待处理高风险</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 异常案例列表 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">异常案例列表</CardTitle>
            <CardDescription>
              {selectedType === "all" ? "显示所有异常类型" : `筛选: ${anomalyStats.find(s => s.type === selectedType)?.name}`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="筛选类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="price_high">价格过高</SelectItem>
                <SelectItem value="price_low">价格过低</SelectItem>
                <SelectItem value="area_mismatch">面积异常</SelectItem>
                <SelectItem value="data_conflict">数据冲突</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              批量处理
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>案例ID</TableHead>
                <TableHead>房源地址</TableHead>
                <TableHead>报价</TableHead>
                <TableHead>市场价</TableHead>
                <TableHead>偏差</TableHead>
                <TableHead>异常类型</TableHead>
                <TableHead>风险等级</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.id}</TableCell>
                  <TableCell className="font-medium max-w-xs truncate">{item.address}</TableCell>
                  <TableCell>{item.reportPrice}万</TableCell>
                  <TableCell>{item.marketPrice}万</TableCell>
                  <TableCell>
                    <span className={item.deviation.startsWith('+') ? 'text-red-600 font-medium' : 'text-orange-600 font-medium'}>
                      {item.deviation}
                    </span>
                  </TableCell>
                  <TableCell>{getTypeBadge(item.type)}</TableCell>
                  <TableCell>{getSeverityBadge(item.severity)}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
