"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Search, Activity, LogIn, LogOut, User, KeyRound, RefreshCw } from "lucide-react"
import { trpc } from "@/lib/trpc"

const ACTION_ICONS: Record<string, React.ReactNode> = {
  "用户登录": <LogIn className="h-3.5 w-3.5" />,
  "用户登出": <LogOut className="h-3.5 w-3.5" />,
  "用户注册": <User className="h-3.5 w-3.5" />,
  "修改密码": <KeyRound className="h-3.5 w-3.5" />,
  "更新个人信息": <User className="h-3.5 w-3.5" />,
}

const ACTION_COLORS: Record<string, string> = {
  "用户登录": "bg-blue-50 text-blue-700 border-blue-200",
  "用户登出": "bg-gray-50 text-gray-600 border-gray-200",
  "用户注册": "bg-green-50 text-green-700 border-green-200",
  "修改密码": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "更新个人信息": "bg-purple-50 text-purple-700 border-purple-200",
}

function formatUA(ua: string | null | undefined): string {
  if (!ua) return "-"
  let browser = "未知"
  let os = "未知"
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome"
  else if (ua.includes("Firefox")) browser = "Firefox"
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari"
  else if (ua.includes("Edg")) browser = "Edge"
  else if (ua.includes("curl")) browser = "curl"
  if (ua.includes("Windows")) os = "Windows"
  else if (ua.includes("Mac OS")) os = "macOS"
  else if (ua.includes("Linux")) os = "Linux"
  else if (ua.includes("Android")) os = "Android"
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS"
  return `${browser} / ${os}`
}

function formatTime(d: string | Date | null | undefined): string {
  if (!d) return "-"
  return new Date(d).toLocaleString("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  })
}

export default function AdminLogsPage() {
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = trpc.logs.list.useQuery({
    page, pageSize: 30,
    search: search || undefined,
    action: actionFilter || undefined,
    status: statusFilter || undefined,
  })
  const logs = data?.items ?? []
  const total = data?.total ?? 0

  const handleSearch = () => { setSearch(searchInput); setPage(1) }
  const handleReset = () => { setSearch(""); setSearchInput(""); setActionFilter(""); setStatusFilter(""); setPage(1) }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">操作日志</h1>
            <p className="text-muted-foreground">记录用户登录、登出及关键操作行为</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">共 {total} 条记录</Badge>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />刷新
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="搜索用户名、操作、IP..." className="pl-9" value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()} />
              </div>
              <Select value={actionFilter || "all"} onValueChange={v => { setActionFilter(v === "all" ? "" : v); setPage(1) }}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="操作类型" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部操作</SelectItem>
                  <SelectItem value="用户登录">用户登录</SelectItem>
                  <SelectItem value="用户登出">用户登出</SelectItem>
                  <SelectItem value="用户注册">用户注册</SelectItem>
                  <SelectItem value="修改密码">修改密码</SelectItem>
                  <SelectItem value="更新个人信息">更新个人信息</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter || "all"} onValueChange={v => { setStatusFilter(v === "all" ? "" : v); setPage(1) }}>
                <SelectTrigger className="w-[110px]"><SelectValue placeholder="状态" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="success">成功</SelectItem>
                  <SelectItem value="failed">失败</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleSearch}>搜索</Button>
              <Button size="sm" variant="ghost" onClick={handleReset}>重置</Button>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Activity className="h-12 w-12 mb-4 opacity-30" />
                <p className="font-medium">暂无日志数据</p>
                <p className="text-sm mt-1">用户登录后将自动记录操作日志</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[130px]">操作类型</TableHead>
                      <TableHead className="w-[110px]">操作用户</TableHead>
                      <TableHead>操作详情</TableHead>
                      <TableHead className="w-[130px]">IP 地址</TableHead>
                      <TableHead className="w-[140px]">客户端</TableHead>
                      <TableHead className="w-[70px]">状态</TableHead>
                      <TableHead className="w-[155px]">时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: any) => (
                      <TableRow key={log.id} className={log.status === "failed" ? "bg-red-50/30" : ""}>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${ACTION_COLORS[log.action] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                            {ACTION_ICONS[log.action] ?? <Activity className="h-3.5 w-3.5" />}
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                              {(log.username || "?")[0].toUpperCase()}
                            </div>
                            <span className="text-sm font-medium">{log.username || <span className="text-muted-foreground">系统</span>}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{log.detail || log.details || "-"}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-muted-foreground">{log.ip || log.ipAddress || "-"}</span>
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-muted-foreground cursor-help underline decoration-dotted">
                                {formatUA(log.userAgent)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-xs break-all">
                              {log.userAgent || "未知"}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.status === "success" ? "default" : "destructive"} className="text-xs">
                            {log.status === "success" ? "成功" : "失败"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatTime(log.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">第 {page} 页，共 {total} 条记录</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p-1)}>上一页</Button>
                    <span className="flex items-center px-3 text-sm text-muted-foreground">第 {page} 页</span>
                    <Button variant="outline" size="sm" disabled={logs.length < 30} onClick={() => setPage(p => p+1)}>下一页</Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
