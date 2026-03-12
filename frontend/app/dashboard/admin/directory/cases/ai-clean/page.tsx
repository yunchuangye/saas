"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Play, CheckCircle2, XCircle, AlertTriangle, Trash2, ArrowLeft, Bot, FileWarning, Copy, Merge, Sparkles } from "lucide-react"
import Link from "next/link"

// 异常数据类型
const issueTypes = [
  { id: "duplicate", name: "重复数据", icon: Copy, count: 256, description: "相同房源的重复记录" },
  { id: "missing", name: "缺失字段", icon: FileWarning, count: 128, description: "关键字段信息缺失" },
  { id: "outlier", name: "价格异常", icon: AlertTriangle, count: 89, description: "价格明显偏离市场" },
  { id: "conflict", name: "数据冲突", icon: Merge, count: 45, description: "同一房源信息不一致" },
]

// 待清洗数据
const cleaningData = [
  { id: 1, address: "上海市浦东新区陆家嘴花园3号楼1201", issue: "duplicate", detail: "与ID:2345重复", price: "1250万", source: "链家", selected: true },
  { id: 2, address: "北京市朝阳区望京SOHO T1 2305", issue: "missing", detail: "缺少面积信息", price: "890万", source: "贝壳", selected: true },
  { id: 3, address: "深圳市南山区科技园深南花园A座501", issue: "outlier", detail: "单价15万/㎡(均价8万)", price: "1500万", source: "安居客", selected: false },
  { id: 4, address: "广州市天河区珠江新城富力天河华府1802", issue: "conflict", detail: "面积数据冲突:120㎡/135㎡", price: "680万", source: "房天下", selected: true },
  { id: 5, address: "杭州市西湖区西溪湿地旁绿城西溪诚园5栋301", issue: "duplicate", detail: "与ID:3456重复", price: "520万", source: "链家", selected: true },
  { id: 6, address: "成都市高新区金融城国际中心A座1501", issue: "missing", detail: "缺少户型信息", price: "450万", source: "贝壳", selected: false },
]

// 清洗历史
const cleanHistory = [
  { id: "C001", time: "2024-01-15 15:30", total: 1256, cleaned: 1180, deleted: 56, merged: 20, status: "completed" },
  { id: "C002", time: "2024-01-14 10:00", total: 890, cleaned: 856, deleted: 28, merged: 6, status: "completed" },
  { id: "C003", time: "2024-01-13 14:20", total: 2345, cleaned: 2100, deleted: 180, merged: 65, status: "completed" },
]

export default function AICleanPage() {
  const [isCleaning, setIsCleaning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedIssues, setSelectedIssues] = useState<string[]>(["duplicate", "missing"])

  const startClean = () => {
    setIsCleaning(true)
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsCleaning(false)
          return 100
        }
        return prev + Math.random() * 20
      })
    }, 400)
  }

  const getIssueIcon = (issue: string) => {
    switch (issue) {
      case "duplicate": return <Copy className="h-4 w-4 text-blue-500" />
      case "missing": return <FileWarning className="h-4 w-4 text-orange-500" />
      case "outlier": return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "conflict": return <Merge className="h-4 w-4 text-purple-500" />
      default: return null
    }
  }

  const getIssueBadge = (issue: string) => {
    switch (issue) {
      case "duplicate": return <Badge variant="secondary" className="bg-blue-100 text-blue-700">重复</Badge>
      case "missing": return <Badge variant="secondary" className="bg-orange-100 text-orange-700">缺失</Badge>
      case "outlier": return <Badge variant="secondary" className="bg-red-100 text-red-700">异常</Badge>
      case "conflict": return <Badge variant="secondary" className="bg-purple-100 text-purple-700">冲突</Badge>
      default: return null
    }
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
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <RefreshCw className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold">AI数据清洗</h1>
              <Badge variant="secondary" className="ml-2">OpenClaw</Badge>
            </div>
            <p className="text-muted-foreground mt-1">智能识别并清洗重复、缺失、异常数据</p>
          </div>
        </div>
        <Button 
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          onClick={startClean}
          disabled={isCleaning}
        >
          {isCleaning ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              清洗中...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              开始智能清洗
            </>
          )}
        </Button>
      </div>

      {/* 清洗进度 */}
      {isCleaning && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-green-100 animate-pulse">
                <Bot className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">OpenClaw 正在清洗数据...</span>
                  <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold text-lg">518</div>
                <div className="text-muted-foreground">待处理</div>
              </div>
              <div>
                <div className="font-semibold text-lg text-green-600">256</div>
                <div className="text-muted-foreground">已清洗</div>
              </div>
              <div>
                <div className="font-semibold text-lg text-red-600">45</div>
                <div className="text-muted-foreground">已删除</div>
              </div>
              <div>
                <div className="font-semibold text-lg text-blue-600">12</div>
                <div className="text-muted-foreground">已合并</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 问题类型统计 */}
      <div className="grid sm:grid-cols-4 gap-4">
        {issueTypes.map((type) => (
          <Card 
            key={type.id} 
            className={`cursor-pointer transition-all ${selectedIssues.includes(type.id) ? 'ring-2 ring-primary' : ''}`}
            onClick={() => {
              if (selectedIssues.includes(type.id)) {
                setSelectedIssues(selectedIssues.filter(i => i !== type.id))
              } else {
                setSelectedIssues([...selectedIssues, type.id])
              }
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    type.id === 'duplicate' ? 'bg-blue-100' :
                    type.id === 'missing' ? 'bg-orange-100' :
                    type.id === 'outlier' ? 'bg-red-100' : 'bg-purple-100'
                  }`}>
                    <type.icon className={`h-5 w-5 ${
                      type.id === 'duplicate' ? 'text-blue-600' :
                      type.id === 'missing' ? 'text-orange-600' :
                      type.id === 'outlier' ? 'text-red-600' : 'text-purple-600'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium">{type.name}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </div>
                <div className="text-2xl font-bold">{type.count}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">待清洗数据</TabsTrigger>
          <TabsTrigger value="history">清洗历史</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">待清洗数据列表</CardTitle>
                <CardDescription>选择需要清洗的数据，OpenClaw将智能处理</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  全选
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除选中
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>房源地址</TableHead>
                    <TableHead>问题类型</TableHead>
                    <TableHead>问题详情</TableHead>
                    <TableHead>价格</TableHead>
                    <TableHead>来源</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cleaningData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox defaultChecked={item.selected} />
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">{item.address}</TableCell>
                      <TableCell>{getIssueBadge(item.issue)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.detail}</TableCell>
                      <TableCell>{item.price}</TableCell>
                      <TableCell>{item.source}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">修复</Button>
                          <Button variant="ghost" size="sm" className="text-red-600">删除</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">清洗历史记录</CardTitle>
              <CardDescription>查看历史数据清洗任务</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>任务ID</TableHead>
                    <TableHead>执行时间</TableHead>
                    <TableHead>处理总数</TableHead>
                    <TableHead>已清洗</TableHead>
                    <TableHead>已删除</TableHead>
                    <TableHead>已合并</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cleanHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.id}</TableCell>
                      <TableCell>{item.time}</TableCell>
                      <TableCell>{item.total.toLocaleString()}</TableCell>
                      <TableCell className="text-green-600">{item.cleaned.toLocaleString()}</TableCell>
                      <TableCell className="text-red-600">{item.deleted}</TableCell>
                      <TableCell className="text-blue-600">{item.merged}</TableCell>
                      <TableCell>
                        <Badge variant="default">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          已完成
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
