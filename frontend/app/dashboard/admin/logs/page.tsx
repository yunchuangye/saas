"use client"

import { useState } from "react"
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
import { Search, Filter, Download, User, Settings, FileText, Shield } from "lucide-react"

const logs = [
  {
    id: 1,
    action: "用户登录",
    user: "王经理",
    role: "评估公司",
    ip: "192.168.1.***",
    time: "2024-03-10 10:30:25",
    type: "auth",
    status: "success",
  },
  {
    id: 2,
    action: "提交报告",
    user: "李四",
    role: "评估公司",
    ip: "192.168.1.***",
    time: "2024-03-10 10:28:15",
    type: "report",
    status: "success",
  },
  {
    id: 3,
    action: "发起需求",
    user: "刘主任",
    role: "银行机构",
    ip: "10.0.0.***",
    time: "2024-03-10 10:25:00",
    type: "project",
    status: "success",
  },
  {
    id: 4,
    action: "修改系统配置",
    user: "管理员",
    role: "运营管理",
    ip: "172.16.0.***",
    time: "2024-03-10 10:20:00",
    type: "system",
    status: "success",
  },
  {
    id: 5,
    action: "登录失败",
    user: "未知用户",
    role: "-",
    ip: "203.0.113.***",
    time: "2024-03-10 10:15:30",
    type: "auth",
    status: "failed",
  },
]

const typeIcons: Record<string, React.ElementType> = {
  auth: User,
  report: FileText,
  project: FileText,
  system: Settings,
}

const statusColors: Record<string, string> = {
  success: "bg-success/10 text-success",
  failed: "bg-destructive/10 text-destructive",
}

export default function AdminLogsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredLogs = logs.filter(
    (log) =>
      log.action.includes(searchQuery) ||
      log.user.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">操作日志</h1>
          <p className="text-muted-foreground">查看系统操作日志和审计记录</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          导出日志
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>日志记录</CardTitle>
              <CardDescription>系统操作审计日志</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索日志..."
                  className="pl-8 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>类型</TableHead>
                <TableHead>操作</TableHead>
                <TableHead>用户</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>IP地址</TableHead>
                <TableHead>时间</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => {
                const Icon = typeIcons[log.type] || Shield
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="p-2 rounded-full bg-muted w-fit">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.role}</TableCell>
                    <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                    <TableCell>{log.time}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[log.status]}>
                        {log.status === "success" ? "成功" : "失败"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
