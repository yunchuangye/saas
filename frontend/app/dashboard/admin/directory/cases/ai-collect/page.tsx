"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sparkles, Play, Pause, Settings, RefreshCw, CheckCircle2, XCircle, Clock, Globe, Database, ArrowLeft, Bot } from "lucide-react"
import Link from "next/link"

// 数据源配置
const dataSources = [
  { id: "lianjia", name: "链家", logo: "链", status: "connected", lastSync: "2024-01-15 14:30", records: 125680 },
  { id: "anjuke", name: "安居客", logo: "安", status: "connected", lastSync: "2024-01-15 13:45", records: 98540 },
  { id: "beike", name: "贝壳找房", logo: "贝", status: "connected", lastSync: "2024-01-15 12:00", records: 156320 },
  { id: "58", name: "58同城", logo: "58", status: "disconnected", lastSync: "-", records: 0 },
  { id: "fang", name: "房天下", logo: "房", status: "connected", lastSync: "2024-01-14 18:00", records: 67890 },
]

// 采集任务历史
const taskHistory = [
  { id: "T001", source: "链家", city: "上海", type: "报价", startTime: "2024-01-15 14:00", duration: "32分钟", records: 1256, status: "completed" },
  { id: "T002", source: "贝壳找房", city: "北京", type: "成交", startTime: "2024-01-15 13:00", duration: "45分钟", records: 2341, status: "completed" },
  { id: "T003", source: "安居客", city: "深圳", type: "报价", startTime: "2024-01-15 12:00", duration: "-", records: 856, status: "running" },
  { id: "T004", source: "房天下", city: "广州", type: "成交", startTime: "2024-01-15 10:00", duration: "28分钟", records: 987, status: "completed" },
  { id: "T005", source: "链家", city: "杭州", type: "报价", startTime: "2024-01-15 09:00", duration: "-", records: 0, status: "failed" },
]

export default function AICollectPage() {
  const [isCollecting, setIsCollecting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedSources, setSelectedSources] = useState<string[]>(["lianjia", "beike"])

  const startCollect = () => {
    setIsCollecting(true)
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsCollecting(false)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 500)
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
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold">AI智能采集</h1>
              <Badge variant="secondary" className="ml-2">OpenClaw</Badge>
            </div>
            <p className="text-muted-foreground mt-1">自动采集各大房产平台的市场报价和成交数据</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            采集设置
          </Button>
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            同步数据源
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左侧：采集配置 */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">采集配置</CardTitle>
              <CardDescription>选择数据源和采集参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 城市选择 */}
              <div className="space-y-2">
                <Label>目标城市</Label>
                <Select defaultValue="shanghai">
                  <SelectTrigger>
                    <SelectValue placeholder="选择城市" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shanghai">上海</SelectItem>
                    <SelectItem value="beijing">北京</SelectItem>
                    <SelectItem value="shenzhen">深圳</SelectItem>
                    <SelectItem value="guangzhou">广州</SelectItem>
                    <SelectItem value="hangzhou">杭州</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 数据类型 */}
              <div className="space-y-2">
                <Label>数据类型</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="quote" defaultChecked />
                    <label htmlFor="quote" className="text-sm">市场报价</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="deal" defaultChecked />
                    <label htmlFor="deal" className="text-sm">成交案例</label>
                  </div>
                </div>
              </div>

              {/* 数据源选择 */}
              <div className="space-y-3">
                <Label>数据源</Label>
                {dataSources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        id={source.id} 
                        checked={selectedSources.includes(source.id)}
                        disabled={source.status === "disconnected"}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSources([...selectedSources, source.id])
                          } else {
                            setSelectedSources(selectedSources.filter(s => s !== source.id))
                          }
                        }}
                      />
                      <div className="flex items-center justify-center h-8 w-8 rounded bg-primary/10 text-primary font-bold text-sm">
                        {source.logo}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{source.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {source.status === "connected" ? `${source.records.toLocaleString()} 条数据` : "未连接"}
                        </div>
                      </div>
                    </div>
                    <Badge variant={source.status === "connected" ? "default" : "secondary"}>
                      {source.status === "connected" ? "已连接" : "未连接"}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* 采集时间范围 */}
              <div className="space-y-2">
                <Label>时间范围</Label>
                <Select defaultValue="7d">
                  <SelectTrigger>
                    <SelectValue placeholder="选择时间范围" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">最近1天</SelectItem>
                    <SelectItem value="7d">最近7天</SelectItem>
                    <SelectItem value="30d">最近30天</SelectItem>
                    <SelectItem value="90d">最近90天</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 开始采集按钮 */}
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700" 
                onClick={startCollect}
                disabled={isCollecting || selectedSources.length === 0}
              >
                {isCollecting ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    采集中...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    开始智能采集
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：采集状态和历史 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 采集进度 */}
          {isCollecting && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-full bg-blue-100 animate-pulse">
                    <Bot className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">OpenClaw 正在采集数据...</span>
                      <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="font-semibold text-lg">2</div>
                    <div className="text-muted-foreground">数据源</div>
                  </div>
                  <div>
                    <div className="font-semibold text-lg">1,256</div>
                    <div className="text-muted-foreground">已采集</div>
                  </div>
                  <div>
                    <div className="font-semibold text-lg">00:03:25</div>
                    <div className="text-muted-foreground">已用时</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 统计卡片 */}
          <div className="grid sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Globe className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">5</div>
                    <div className="text-sm text-muted-foreground">数据源</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Database className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">448K</div>
                    <div className="text-sm text-muted-foreground">总数据量</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <CheckCircle2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">156</div>
                    <div className="text-sm text-muted-foreground">今日采集</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">32</div>
                    <div className="text-sm text-muted-foreground">任务次数</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 采集历史 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">采集任务历史</CardTitle>
              <CardDescription>查看历史采集任务记录</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>任务ID</TableHead>
                    <TableHead>数据源</TableHead>
                    <TableHead>城市</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>开始时间</TableHead>
                    <TableHead>耗时</TableHead>
                    <TableHead>采集数量</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskHistory.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-mono text-sm">{task.id}</TableCell>
                      <TableCell>{task.source}</TableCell>
                      <TableCell>{task.city}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{task.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{task.startTime}</TableCell>
                      <TableCell>{task.duration}</TableCell>
                      <TableCell>{task.records.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            task.status === "completed" ? "default" : 
                            task.status === "running" ? "secondary" : "destructive"
                          }
                        >
                          {task.status === "completed" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                          {task.status === "running" && <RefreshCw className="mr-1 h-3 w-3 animate-spin" />}
                          {task.status === "failed" && <XCircle className="mr-1 h-3 w-3" />}
                          {task.status === "completed" ? "已完成" : task.status === "running" ? "进行中" : "失败"}
                        </Badge>
                      </TableCell>
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
