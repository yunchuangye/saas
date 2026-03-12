"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Zap, ArrowLeft, Bot, Upload, Download, Play, CheckCircle2, Clock, FileText, Sparkles, Eye, RefreshCw } from "lucide-react"
import Link from "next/link"

// 批量估价任务数据
const batchTasks = [
  {
    id: "B001",
    name: "浦东新区住宅批量估价",
    total: 256,
    completed: 256,
    status: "completed",
    createTime: "2024-01-15 14:00",
    duration: "12分钟",
    avgPrice: 1250,
    models: ["市场法", "收益法"],
  },
  {
    id: "B002",
    name: "徐汇区商业物业估价",
    total: 128,
    completed: 85,
    status: "running",
    createTime: "2024-01-15 15:30",
    duration: "-",
    avgPrice: null,
    models: ["收益法"],
  },
  {
    id: "B003",
    name: "静安区写字楼估价",
    total: 64,
    completed: 64,
    status: "completed",
    createTime: "2024-01-14 10:00",
    duration: "8分钟",
    avgPrice: 3560,
    models: ["市场法", "成本法"],
  },
]

// 待估价房源列表
const pendingProperties = [
  { id: 1, address: "上海市浦东新区陆家嘴花园3号楼1201", area: 125, type: "住宅", status: "待估价", selected: true },
  { id: 2, address: "上海市浦东新区世茂滨江花园5栋802", area: 156, type: "住宅", status: "待估价", selected: true },
  { id: 3, address: "上海市徐汇区汇金广场A座1501", area: 230, type: "商业", status: "待估价", selected: true },
  { id: 4, address: "上海市静安区恒隆广场写字楼2203", area: 180, type: "写字楼", status: "待估价", selected: false },
  { id: 5, address: "上海市黄浦区外滩中心3号楼1801", area: 200, type: "住宅", status: "待估价", selected: true },
  { id: 6, address: "上海市长宁区虹桥天街B栋1205", area: 145, type: "商业", status: "待估价", selected: false },
]

// 估价结果
const valuationResults = [
  { id: 1, address: "陆家嘴花园3号楼1201", area: 125, marketValue: 1250, costValue: 1180, incomeValue: null, finalValue: 1250, confidence: 95 },
  { id: 2, address: "世茂滨江花园5栋802", area: 156, marketValue: 1560, costValue: 1480, incomeValue: null, finalValue: 1560, confidence: 92 },
  { id: 3, address: "汇金广场A座1501", area: 230, marketValue: 2300, costValue: null, incomeValue: 2450, finalValue: 2380, confidence: 88 },
  { id: 4, address: "外滩中心3号楼1801", area: 200, marketValue: 2800, costValue: 2650, incomeValue: null, finalValue: 2800, confidence: 94 },
]

export default function AIBatchPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [showResults, setShowResults] = useState(false)

  const startBatch = () => {
    setIsProcessing(true)
    setProgress(0)
    setShowResults(false)
    
    const steps = ["数据预处理", "模型选择", "批量计算", "结果验证", "生成报告"]
    let stepIndex = 0
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 8
        
        if (newProgress > (stepIndex + 1) * 20 && stepIndex < steps.length - 1) {
          stepIndex++
          setCurrentStep(stepIndex)
        }
        
        if (newProgress >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          setShowResults(true)
          return 100
        }
        return newProgress
      })
    }, 300)
  }

  const steps = ["数据预处理", "模型选择", "批量计算", "结果验证", "生成报告"]

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
              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold">AI批量估价</h1>
              <Badge variant="secondary" className="ml-2">OpenClaw</Badge>
            </div>
            <p className="text-muted-foreground mt-1">一键批量生成多房源估价结果，支持多种估价方法</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            导入房源
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            导出结果
          </Button>
        </div>
      </div>

      {/* 处理进度 */}
      {isProcessing && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-full bg-yellow-100 animate-pulse">
                <Bot className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">OpenClaw 正在批量估价...</span>
                  <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
            
            {/* 步骤指示器 */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step} className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index < currentStep ? 'bg-yellow-500 text-white' :
                    index === currentStep ? 'bg-yellow-500 text-white animate-pulse' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {index < currentStep ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                  </div>
                  <span className={`text-xs ${index <= currentStep ? 'text-yellow-700 font-medium' : 'text-muted-foreground'}`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左侧：估价配置 */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">估价配置</CardTitle>
              <CardDescription>选择估价方法和参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>估价方法</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="market" defaultChecked />
                    <label htmlFor="market" className="text-sm">市场比较法</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="cost" defaultChecked />
                    <label htmlFor="cost" className="text-sm">成本法</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="income" />
                    <label htmlFor="income" className="text-sm">收益法</label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>估价基准日</Label>
                <Input type="date" defaultValue="2024-01-15" />
              </div>

              <div className="space-y-2">
                <Label>估价目的</Label>
                <Select defaultValue="mortgage">
                  <SelectTrigger>
                    <SelectValue placeholder="选择估价目的" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mortgage">抵押贷款</SelectItem>
                    <SelectItem value="transaction">交易参考</SelectItem>
                    <SelectItem value="insurance">保险理赔</SelectItem>
                    <SelectItem value="tax">税务申报</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>AI模型</Label>
                <Select defaultValue="v3">
                  <SelectTrigger>
                    <SelectValue placeholder="选择AI模型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="v3">OpenClaw V3 (推荐)</SelectItem>
                    <SelectItem value="v2">OpenClaw V2</SelectItem>
                    <SelectItem value="fast">OpenClaw Fast</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700" 
                onClick={startBatch}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    开始批量估价
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 历史任务 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">历史任务</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {batchTasks.map((task) => (
                <div key={task.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm truncate">{task.name}</span>
                    <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                      {task.status === "completed" ? "已完成" : "进行中"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{task.total}个房源</span>
                    <span>{task.createTime}</span>
                  </div>
                  {task.status === "running" && (
                    <Progress value={(task.completed / task.total) * 100} className="h-1 mt-2" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 右侧：房源列表和结果 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 统计卡片 */}
          <div className="grid sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-100">
                    <FileText className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">6</div>
                    <div className="text-sm text-muted-foreground">待估价</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">384</div>
                    <div className="text-sm text-muted-foreground">已估价</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">2.5s</div>
                    <div className="text-sm text-muted-foreground">平均耗时</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">92%</div>
                    <div className="text-sm text-muted-foreground">平均置信度</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 待估价房源 / 估价结果 */}
          {!showResults ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">待估价房源</CardTitle>
                  <CardDescription>选择需要批量估价的房源</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  全选
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>房源地址</TableHead>
                      <TableHead>面积</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingProperties.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox defaultChecked={item.selected} />
                        </TableCell>
                        <TableCell className="font-medium">{item.address}</TableCell>
                        <TableCell>{item.area}㎡</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-green-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <CardTitle className="text-lg">估价结果</CardTitle>
                    <CardDescription>批量估价已完成，共处理4个房源</CardDescription>
                  </div>
                </div>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  导出报告
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>房源地址</TableHead>
                      <TableHead>面积</TableHead>
                      <TableHead>市场法</TableHead>
                      <TableHead>成本法</TableHead>
                      <TableHead>收益法</TableHead>
                      <TableHead>最终估值</TableHead>
                      <TableHead>置信度</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {valuationResults.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.address}</TableCell>
                        <TableCell>{item.area}㎡</TableCell>
                        <TableCell>{item.marketValue ? `${item.marketValue}万` : '-'}</TableCell>
                        <TableCell>{item.costValue ? `${item.costValue}万` : '-'}</TableCell>
                        <TableCell>{item.incomeValue ? `${item.incomeValue}万` : '-'}</TableCell>
                        <TableCell className="font-bold text-primary">{item.finalValue}万</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-600 rounded-full" 
                                style={{ width: `${item.confidence}%` }}
                              />
                            </div>
                            <span className="text-sm">{item.confidence}%</span>
                          </div>
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
        </div>
      </div>
    </div>
  )
}
