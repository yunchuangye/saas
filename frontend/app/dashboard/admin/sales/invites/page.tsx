"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Users, Gift, TrendingUp } from "lucide-react"
import { trpc } from "@/lib/trpc"

export default function AdminInvitesPage() {
  const [search, setSearch] = useState("")
  const { data, isLoading } = trpc.sales.listInvites.useQuery({ page: 1, pageSize: 50 })
  const invites = data?.items ?? []
  const filtered = invites.filter(i => i.inviterName?.toLowerCase().includes(search.toLowerCase()) || i.code?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">邀请管理</h1>
        <p className="text-muted-foreground">查看用户邀请记录和奖励情况</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{invites.length}</p>
                <p className="text-sm text-muted-foreground">邀请码总数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{invites.reduce((sum, i) => sum + (i.usedCount ?? 0), 0)}</p>
                <p className="text-sm text-muted-foreground">成功邀请人次</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                <Gift className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">¥{invites.reduce((sum, i) => sum + (i.rewardAmount ?? 0), 0).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">奖励总金额</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="搜索邀请人或邀请码..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>邀请码</TableHead>
                <TableHead>邀请人</TableHead>
                <TableHead>使用次数</TableHead>
                <TableHead>奖励金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">暂无邀请记录</TableCell></TableRow>
              ) : filtered.map(invite => (
                <TableRow key={invite.id}>
                  <TableCell className="font-mono text-sm">{invite.code}</TableCell>
                  <TableCell>{invite.inviterName ?? "-"}</TableCell>
                  <TableCell>{invite.usedCount ?? 0} / {invite.maxUses ?? "∞"}</TableCell>
                  <TableCell>¥{(invite.rewardAmount ?? 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={invite.status === "active" ? "default" : "secondary"}>
                      {invite.status === "active" ? "有效" : invite.status === "expired" ? "已过期" : "已用完"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {invite.createdAt ? new Date(invite.createdAt).toLocaleDateString("zh-CN") : "-"}
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
