"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Users, UserPlus, Pencil, Building2 } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

export default function UsersPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [editUser, setEditUser] = useState<any>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ username: "", realName: "", email: "", phone: "", password: "" })

  const { data, isLoading, refetch } = trpc.adminUsers.list.useQuery({ page, pageSize: 20, role: "appraiser", search: search || undefined })
  const toggleStatusMutation = trpc.adminUsers.toggleStatus.useMutation({
    onSuccess: () => { toast({ title: "状态已更新" }); refetch() },
    onError: (err) => toast({ title: "操作失败", description: err.message, variant: "destructive" }),
  })
  const updateMutation = trpc.adminUsers.update.useMutation({
    onSuccess: () => { toast({ title: "用户信息已更新" }); setEditUser(null); refetch() },
    onError: (err) => toast({ title: "更新失败", description: err.message, variant: "destructive" }),
  })
  const createMutation = trpc.adminUsers.create.useMutation({
    onSuccess: () => { toast({ title: "账户已创建" }); setCreateOpen(false); setForm({ username: "", realName: "", email: "", phone: "", password: "" }); refetch() },
    onError: (err) => toast({ title: "创建失败", description: err.message, variant: "destructive" }),
  })

  const users = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">评估公司用户</h1>
          <p className="text-muted-foreground">管理评估公司账号</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary"><Users className="mr-1 h-3 w-3" />共 {total} 名用户</Badge>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <UserPlus className="mr-1 h-4 w-4" />新建账户
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索用户..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mb-4 opacity-30" /><p>暂无用户数据</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户名</TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>所属机构</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>手机</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>注册时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell>{u.realName ?? "-"}</TableCell>
                      <TableCell>
                        {u.orgName ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{u.orgName}</span>
                          </div>
                        ) : <span className="text-muted-foreground text-xs">未关联</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{u.email ?? "-"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{u.phone ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant={u.isActive ? "default" : "destructive"}>
                          {u.isActive ? "正常" : "禁用"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setEditUser(u); setForm({ username: u.username, realName: u.realName ?? "", email: u.email ?? "", phone: u.phone ?? "", password: "" }) }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm"
                            onClick={() => toggleStatusMutation.mutate({ userId: u.id, status: u.isActive ? "inactive" : "active" })}>
                            {u.isActive ? "禁用" : "启用"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>共 {total} 条记录</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
                  <Button variant="outline" size="sm" disabled={users.length < 20} onClick={() => setPage(p => p + 1)}>下一页</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户信息</DialogTitle>
            <DialogDescription>修改用户的基本信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>用户名</Label>
                <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>姓名</Label>
                <Input value={form.realName} onChange={e => setForm(f => ({ ...f, realName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>手机号</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>新密码（留空不修改）</Label>
              <Input type="password" placeholder="留空则不修改密码" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>取消</Button>
            <Button onClick={() => updateMutation.mutate({ id: editUser.id, realName: form.realName, email: form.email, phone: form.phone, password: form.password || undefined })}
              disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建评估公司账户</DialogTitle>
            <DialogDescription>为评估公司创建新的登录账户</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>用户名 *</Label>
                <Input placeholder="登录用户名" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>姓名</Label>
                <Input placeholder="真实姓名" value={form.realName} onChange={e => setForm(f => ({ ...f, realName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input type="email" placeholder="邮箱地址" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>手机号</Label>
              <Input placeholder="手机号码" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>初始密码 *</Label>
              <Input type="password" placeholder="设置初始密码" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={() => createMutation.mutate({ username: form.username, realName: form.realName, email: form.email, phone: form.phone, password: form.password, role: "appraiser" })}
              disabled={createMutation.isPending || !form.username || !form.password}>
              {createMutation.isPending ? "创建中..." : "创建账户"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
