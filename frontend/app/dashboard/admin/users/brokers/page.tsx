"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Building, Search, Eye, ShieldOff, ShieldCheck, ArrowRightLeft } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { toast } from "sonner"

export default function AdminBrokersPage() {
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState("")
  const [search, setSearch] = useState("")
  const [detail, setDetail] = useState<any>(null)

  const { data, isLoading, refetch } = trpc.admin.listUsers.useQuery({
    page, pageSize: 20, role: "broker", keyword: search || undefined,
  })

  const toggleMutation = trpc.admin.toggleUserStatus.useMutation({
    onSuccess: () => { toast.success("状态已更新"); refetch() },
    onError: (e) => toast.error(e.message),
  })

  const STATUS_MAP: Record<string, { label: string; color: string }> = {
    active: { label: "正常", color: "bg-green-500/20 text-green-400" },
    inactive: { label: "未激活", color: "bg-gray-500/20 text-gray-400" },
    suspended: { label: "已暂停", color: "bg-red-500/20 text-red-400" },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">经纪机构管理</h1>
        <p className="text-muted-foreground text-sm mt-1">管理平台上所有入驻的经纪机构（中介）账号</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "总机构数", value: data?.total ?? "-", icon: Building },
          { label: "本页显示", value: data?.items?.length ?? "-", icon: Eye },
          { label: "已暂停", value: (data?.items as any[])?.filter((u: any) => u.status === "suspended").length ?? 0, icon: ShieldOff },
        ].map(card => (
          <Card key={card.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <card.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">{card.label}</p>
                <p className="text-xl font-bold">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 搜索 */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="搜索机构名称/联系人..." value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => e.key === "Enter" && setSearch(keyword)} />
        </div>
        <Button variant="outline" onClick={() => setSearch(keyword)}>搜索</Button>
        <Button variant="ghost" onClick={() => { setKeyword(""); setSearch("") }}>重置</Button>
      </div>

      {/* 列表 */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building className="w-4 h-4" />经纪机构列表</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>机构名称</TableHead>
                  <TableHead>联系人</TableHead>
                  <TableHead>联系电话</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>注册时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.items as any[])?.map((user: any) => {
                  const status = STATUS_MAP[user.status] || STATUS_MAP.inactive
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.org_name || user.real_name || user.username}</TableCell>
                      <TableCell>{user.real_name || "-"}</TableCell>
                      <TableCell>{user.phone || "-"}</TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString("zh-CN") : "-"}</TableCell>
                      <TableCell><span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setDetail(user)}><Eye className="w-3 h-3" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => toggleMutation.mutate({ userId: user.id, status: user.status === "active" ? "suspended" : "active" })}>
                            {user.status === "active" ? <ShieldOff className="w-3 h-3 text-red-500" /> : <ShieldCheck className="w-3 h-3 text-green-500" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {(!data?.items || data.items.length === 0) && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">暂无经纪机构数据</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 分页 */}
      {data && data.total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
          <span className="text-sm text-muted-foreground flex items-center">第 {page} / {Math.ceil(data.total / 20)} 页</span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(data.total / 20)} onClick={() => setPage(p => p + 1)}>下一页</Button>
        </div>
      )}

      {/* 详情弹窗 */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>机构详情</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              {[
                ["机构名称", detail.org_name || detail.real_name],
                ["联系人", detail.real_name],
                ["用户名", detail.username],
                ["邮箱", detail.email],
                ["电话", detail.phone],
                ["状态", detail.status],
                ["注册时间", detail.created_at ? new Date(detail.created_at).toLocaleString("zh-CN") : "-"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value || "-"}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
