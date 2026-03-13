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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Search, MapPin, Plus, Pencil, Trash2 } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

export default function CitiesPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [editCity, setEditCity] = useState<any>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteCity, setDeleteCity] = useState<any>(null)
  const [form, setForm] = useState({ name: "", province: "", code: "" })

  const { data, isLoading, refetch } = trpc.directory.listCities.useQuery({ search: search || undefined })
  const cities = data?.items ?? []

  const createMutation = trpc.directory.cities.create.useMutation({
    onSuccess: () => { toast({ title: "城市已添加" }); setCreateOpen(false); setForm({ name: "", province: "", code: "" }); refetch() },
    onError: (err) => toast({ title: "添加失败", description: err.message, variant: "destructive" }),
  })
  const updateMutation = trpc.directory.cities.update.useMutation({
    onSuccess: () => { toast({ title: "城市信息已更新" }); setEditCity(null); refetch() },
    onError: (err) => toast({ title: "更新失败", description: err.message, variant: "destructive" }),
  })
  const deleteMutation = trpc.directory.cities.delete.useMutation({
    onSuccess: () => { toast({ title: "城市已删除" }); setDeleteCity(null); refetch() },
    onError: (err) => toast({ title: "删除失败", description: err.message, variant: "destructive" }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">城市管理</h1>
          <p className="text-muted-foreground">管理系统中的城市数据</p>
        </div>
        <Button onClick={() => { setForm({ name: "", province: "", code: "" }); setCreateOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />新增城市
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="搜索城市名称..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : cities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <MapPin className="h-12 w-12 mb-4 opacity-30" /><p>暂无城市数据</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>城市名称</TableHead><TableHead>省份</TableHead><TableHead>城市代码</TableHead>
                  <TableHead>楼盘数量</TableHead><TableHead>创建时间</TableHead><TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cities.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.province ?? "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{c.code ?? "-"}</TableCell>
                    <TableCell><Badge variant="secondary">{c.estateCount ?? 0}</Badge></TableCell>
                    <TableCell className="text-sm">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditCity(c); setForm({ name: c.name, province: c.province ?? "", code: c.code ?? "" }) }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteCity(c)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新增城市</DialogTitle><DialogDescription>添加新的城市到数据目录</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>城市名称 *</Label><Input placeholder="如：北京" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>省份</Label><Input placeholder="如：北京市" value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} /></div>
            <div className="space-y-2"><Label>城市代码</Label><Input placeholder="如：110000" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={() => createMutation.mutate({ name: form.name, province: form.province || undefined, code: form.code || undefined })} disabled={createMutation.isPending || !form.name}>
              {createMutation.isPending ? "添加中..." : "添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editCity} onOpenChange={open => !open && setEditCity(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>编辑城市</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>城市名称 *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>省份</Label><Input value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} /></div>
            <div className="space-y-2"><Label>城市代码</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCity(null)}>取消</Button>
            <Button onClick={() => updateMutation.mutate({ id: editCity.id, name: form.name, province: form.province || undefined, code: form.code || undefined })} disabled={updateMutation.isPending || !form.name}>
              {updateMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCity} onOpenChange={open => !open && setDeleteCity(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除城市「{deleteCity?.name}」吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate({ id: deleteCity.id })}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
