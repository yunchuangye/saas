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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Building, Plus, Pencil, Trash2, MapPin, X } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

export default function BuildingsPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [cityId, setCityId] = useState<number | undefined>(undefined)
  const [estateId, setEstateId] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [editBuilding, setEditBuilding] = useState<any>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteBuilding, setDeleteBuilding] = useState<any>(null)
  const [form, setForm] = useState({ name: "", estateId: "", floors: "", unitsPerFloor: "", buildYear: "" })

  const { data: citiesData } = trpc.directory.cities.list.useQuery({ pageSize: 100 })
  const cities = citiesData?.items ?? []

  const { data: estatesData } = trpc.directory.listEstates.useQuery({ pageSize: 200, cityId: cityId || undefined })
  const estateOptions = estatesData?.items ?? []

  const { data, isLoading, refetch } = trpc.directory.listBuildings.useQuery({
    page, pageSize: 20,
    search: search || undefined,
    cityId: cityId || undefined,
    estateId: estateId || undefined,
  })
  const buildingsList = data?.items ?? []
  const total = data?.total ?? 0

  const createMutation = trpc.directory.buildings.create.useMutation({
    onSuccess: () => { toast({ title: "楼栋已添加" }); setCreateOpen(false); setForm({ name: "", estateId: "", floors: "", unitsPerFloor: "", buildYear: "" }); refetch() },
    onError: (err) => toast({ title: "添加失败", description: err.message, variant: "destructive" }),
  })
  const updateMutation = trpc.directory.buildings.update.useMutation({
    onSuccess: () => { toast({ title: "楼栋信息已更新" }); setEditBuilding(null); refetch() },
    onError: (err) => toast({ title: "更新失败", description: err.message, variant: "destructive" }),
  })
  const deleteMutation = trpc.directory.buildings.delete.useMutation({
    onSuccess: () => { toast({ title: "楼栋已删除" }); setDeleteBuilding(null); refetch() },
    onError: (err) => toast({ title: "删除失败", description: err.message, variant: "destructive" }),
  })

  const selectedCityName = cities.find((c: any) => c.id === cityId)?.name
  const selectedEstateName = estateOptions.find((e: any) => e.id === estateId)?.name

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">楼栋管理</h1>
          <p className="text-muted-foreground">管理系统中的楼栋数据</p>
        </div>
        <Button onClick={() => { setForm({ name: "", estateId: estateId ? String(estateId) : "", floors: "", unitsPerFloor: "", buildYear: "" }); setCreateOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />新增楼栋
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Select value={cityId ? String(cityId) : "all"} onValueChange={v => { setCityId(v === "all" ? undefined : Number(v)); setEstateId(undefined); setPage(1) }}>
                <SelectTrigger className="w-36"><SelectValue placeholder="选择城市" /></SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  <SelectItem value="all">全部城市</SelectItem>
                  {cities.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Select value={estateId ? String(estateId) : "all"} onValueChange={v => { setEstateId(v === "all" ? undefined : Number(v)); setPage(1) }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="选择楼盘" /></SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                <SelectItem value="all">全部楼盘</SelectItem>
                {estateOptions.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-40 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索楼栋名称..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
            {(cityId || estateId || search) && (
              <Button variant="ghost" size="sm" onClick={() => { setCityId(undefined); setEstateId(undefined); setSearch(""); setPage(1) }}>
                <X className="mr-1 h-3 w-3" />清除筛选
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : buildingsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Building className="h-12 w-12 mb-4 opacity-30" /><p>暂无楼栋数据</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>楼栋名称</TableHead>
                    <TableHead>所属楼盘</TableHead>
                    <TableHead>楼层数</TableHead>
                    <TableHead>单元数</TableHead>
                    <TableHead>建成年份</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buildingsList.map((b: any) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{b.estateName ?? "-"}</TableCell>
                      <TableCell>{b.floors ?? "-"}</TableCell>
                      <TableCell><Badge variant="secondary">{b.unitCount ?? 0}</Badge></TableCell>
                      <TableCell>{b.buildYear ?? "-"}</TableCell>
                      <TableCell className="text-sm">{new Date(b.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setEditBuilding(b); setForm({ name: b.name, estateId: String(b.estateId ?? ""), floors: String(b.floors ?? ""), unitsPerFloor: String(b.unitsPerFloor ?? ""), buildYear: String(b.buildYear ?? "") }) }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteBuilding(b)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  {selectedEstateName ? selectedEstateName + " · " : selectedCityName ? selectedCityName + " · " : ""}共 {total} 栋
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
                  <span className="flex items-center text-sm text-muted-foreground px-2">第 {page} 页</span>
                  <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>下一页</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新增楼栋</DialogTitle><DialogDescription>添加新楼栋到楼盘</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>所属楼盘 *</Label>
              <Select value={form.estateId || ""} onValueChange={v => setForm(f => ({ ...f, estateId: v }))}>
                <SelectTrigger><SelectValue placeholder="请选择楼盘" /></SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {estateOptions.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>楼栋名称 *</Label><Input placeholder="如：1号楼、A栋" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>楼层数</Label><Input type="number" placeholder="如：32" value={form.floors} onChange={e => setForm(f => ({ ...f, floors: e.target.value }))} /></div>
              <div className="space-y-2"><Label>每层单元数</Label><Input type="number" placeholder="如：4" value={form.unitsPerFloor} onChange={e => setForm(f => ({ ...f, unitsPerFloor: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>建成年份</Label><Input type="number" placeholder="如：2018" value={form.buildYear} onChange={e => setForm(f => ({ ...f, buildYear: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={() => createMutation.mutate({ estateId: Number(form.estateId), name: form.name, floors: form.floors ? Number(form.floors) : undefined, unitsPerFloor: form.unitsPerFloor ? Number(form.unitsPerFloor) : undefined })} disabled={createMutation.isPending || !form.name || !form.estateId}>
              {createMutation.isPending ? "添加中..." : "添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editBuilding} onOpenChange={open => !open && setEditBuilding(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>编辑楼栋</DialogTitle><DialogDescription>修改楼栋基本信息</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>楼栋名称 *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>楼层数</Label><Input type="number" value={form.floors} onChange={e => setForm(f => ({ ...f, floors: e.target.value }))} /></div>
              <div className="space-y-2"><Label>每层单元数</Label><Input type="number" value={form.unitsPerFloor} onChange={e => setForm(f => ({ ...f, unitsPerFloor: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>建成年份</Label><Input type="number" value={form.buildYear} onChange={e => setForm(f => ({ ...f, buildYear: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBuilding(null)}>取消</Button>
            <Button onClick={() => updateMutation.mutate({ id: editBuilding.id, name: form.name, floors: form.floors ? Number(form.floors) : undefined })} disabled={updateMutation.isPending || !form.name}>
              {updateMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteBuilding} onOpenChange={open => !open && setDeleteBuilding(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除楼栋「{deleteBuilding?.name}」吗？该操作将同时删除关联的房屋单元数据，且不可恢复。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate({ id: deleteBuilding.id })}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
