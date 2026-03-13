"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Globe, RefreshCw, Save } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

export default function OpenClawPage() {
  const { toast } = useToast()
  const [apiKey, setApiKey] = useState("")
  const { data, isLoading } = trpc.openclaw.listTasks.useQuery({ page: 1, pageSize: 20 })
  const tasks = data?.items ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">OpenClaw 爬虫配置</h1>
        <p className="text-muted-foreground">管理数据爬取任务和 API 配置</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>API 配置</CardTitle>
          </div>
          <CardDescription>配置 OpenClaw 数据爬取服务</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input type="password" placeholder="输入 OpenClaw API Key" value={apiKey} onChange={e => setApiKey(e.target.value)} />
          </div>
          <Button onClick={() => toast({ title: "配置已保存" })}>
            <Save className="mr-2 h-4 w-4" />保存配置
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>爬取任务</CardTitle>
              <CardDescription>数据爬取任务记录</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Globe className="h-12 w-12 mb-4 opacity-30" /><p>暂无爬取任务</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>任务名称</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>数据量</TableHead>
                  <TableHead>执行时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === "completed" ? "default" : t.status === "running" ? "secondary" : "outline"}>
                        {t.status === "completed" ? "完成" : t.status === "running" ? "运行中" : t.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.dataCount ?? 0} 条</TableCell>
                    <TableCell>{new Date(t.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
