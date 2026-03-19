"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserPlus, Users, Pencil, Building2, ShieldCheck } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

export default function TeamPage() {
  const { toast } = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [form, setForm] = useState({ username: "", realName: "", email: "", phone: "", password: "" })

  const { data: meData } = trpc.auth.me.useQuery()
  const { data, isLoading, refetch } = trpc.team.listMembers.useQuery({})

  const createMutation = trpc.team.createMember.useMutation({
    onSuccess: () => { toast({ title: "子账户已创建成功" }); setCreateOpen(false); setForm({ username: "", realName: "", email: "", phone: "", password: "" }); refetch() },
    onError: (err) => toast({ title: "创建失败", description: err.message, variant: "destructive" }),
  })
  const updateMutation = trpc.team.updateMember.useMutation({
    onSuccess: () => { toast({ title: "成员信息已更新" }); setEditUser(null); refetch() },
    onError: (err) => toast({ title: "更新失败", description: err.message, variant: "destructive" }),
  })
  const toggleMutation = trpc.team.toggleMember.useMutation({
    onSuccess: () => { toast({ title: "状态已更新" }); refetch() },
    onError: (err) => toast({ title: "操作失败", description: err.message, variant: "destructive" }),
  })

  const members = data?.members ?? []
  const org = data?.org

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">团队管理</h1>
          <p className="text-muted-foreground">管理本机构的子账户和成员权限</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />开设子账户
        </Button>
      </div>

      {/* 机构信息卡片 */}
      {org && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />机构信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">机构名称</p>
                <p className="font-medium mt-1">{org.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">机构类型</p>
                <p className="font-medium mt-1">银行机构</p>
              </div>
              <div>
                <p className="text-muted-foreground">联系人</p>
                <p className="font-medium mt-1">{org.contactName ?? "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">联系电话</p>
                <p className="font-medium mt-1">{org.contactPhone ?? "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 成员列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />成员列表
              </CardTitle>
              <CardDescription>共 {members.length} 名成员</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mb-3 opacity-30" />
              <p>暂无团队成员，点击"开设子账户"添加</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>手机</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>加入时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                        {m.id === meData?.id && <ShieldCheck className="h-3 w-3 text-primary" />}
                        {m.username}
                      </div>
                    </TableCell>
                    <TableCell>{m.realName ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{m.email ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{m.phone ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={m.isActive ? "default" : "destructive"}>
                        {m.isActive ? "正常" : "禁用"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(m.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {m.id !== meData?.id && (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setEditUser(m); setForm({ username: m.username, realName: m.realName ?? "", email: m.email ?? "", phone: m.phone ?? "", password: "" }) }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => toggleMutation.mutate({ userId: m.id, isActive: !m.isActive })}>
                            {m.isActive ? "禁用" : "启用"}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 开设子账户弹窗 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>开设子账户</DialogTitle>
            <DialogDescription>为本机构创建新的员工账户，该账户将自动关联到本机构</DialogDescription>
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
              <Input type="password" placeholder="设置初始登录密码" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={() => createMutation.mutate({ username: form.username, realName: form.realName, email: form.email, phone: form.phone, password: form.password })}
              disabled={createMutation.isPending || !form.username || !form.password}>
              {createMutation.isPending ? "创建中..." : "创建账户"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑成员弹窗 */}
      <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑成员信息</DialogTitle>
            <DialogDescription>修改团队成员的基本信息</DialogDescription>
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
            <Button onClick={() => updateMutation.mutate({ userId: editUser.id, username: form.username, realName: form.realName, email: form.email, phone: form.phone, password: form.password || undefined })}
              disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
