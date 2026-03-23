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
import { Search, Home, Plus, Pencil, Trash2, MapPin, X, ChevronRight } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

export default function UnitsPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [cityId, setCityId] = useState<number | undefined>(undefined)
  const [districtId, setDistrictId] = useState<number | undefined>(undefined)
  const [estateId, setEstateId] = useState<number | undefined>(undefined)
  const [buildingId, setBuildingId] = useState<number | undefined>(undefined)
  const [estateSearch, setEstateSearch] = useState("")
  const [page, setPage] = useState(1)
  const [editUnit, setEditUnit] = useState<any>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteUnit, setDeleteUnit] = useState<any>(null)
  const [form, setForm] = useState({ unitNumber: "", buildingId: "", estateId: "", floor: "", area: "", rooms: "", orientation: "" })

  const { data: citiesData } = trpc.directory.cities.list.useQuery({ pageSize: 500 })
  const cities = citiesData?.items ?? []

  // 地区列表（选中城市后加载）
  const { data: districtsData } = trpc.directory.listDistricts.useQuery(
    { cityId: cityId! },
    { enabled: !!cityId, staleTime: 60000 }
  )
  const districts = districtsData?.items ?? []

  // 楼盘列表（支持拼音首字母搜索）
  const { data: estatesData } = trpc.directory.listEstates.useQuery({
    pageSize: 200,
    cityId: cityId || undefined,
    districtId: districtId || undefined,
    search: estateSearch || undefined,
  })
  const estateOptions = estatesData?.items ?? []

  const { data: buildingsData } = trpc.directory.listBuildings.useQuery({
    pageSize: 500,
    cityId: cityId || undefined,
    districtId: districtId || undefined,
    estateId: estateId || undefined,
  })
  const buildingOptions = buildingsData?.items ?? []

  const { data, isLoading, refetch } = trpc.directory.listUnits.useQuery({
    page, pageSize: 20,
    search: search || undefined,
    cityId: cityId || undefined,
    districtId: districtId || undefined,
    estateId: estateId || undefined,
    buildingId: buildingId || undefined,
  })
  const unitsList = data?.items ?? []
  const total = data?.total ?? 0

  const createMutation = trpc.directory.units.create.useMutation({
    onSuccess: () => { toast({ title: "房屋单元已添加" }); setCreateOpen(false); setForm({ unitNumber: "", buildingId: "", estateId: "", floor: "", area: "", rooms: "", orientation: "" }); refetch() },
    onError: (err) => toast({ title: "添加失败", description: err.message, variant: "destructive" }),
  })
  const updateMutation = trpc.directory.units.update.useMutation({
    onSuccess: () => { toast({ title: "房屋信息已更新" }); setEditUnit(null); refetch() },
    onError: (err) => toast({ title: "更新失败", description: err.message, variant: "destructive" }),
  })
  const deleteMutation = trpc.directory.units.delete.useMutation({
    onSuccess: () => { toast({ title: "房屋单元已删除" }); setDeleteUnit(null); refetch() },
    onError: (err) => toast({ title: "删除失败", description: err.message, variant: "destructive" }),
  })

  const selectedCityName = cities.find((c: any) => c.id === cityId)?.name
  const selectedDistrictName = districts.find((d: any) => d.id === districtId)?.name
  const selectedEstateName = estateOptions.find((e: any) => e.id === estateId)?.name
  const selectedBuildingName = buildingOptions.find((b: any) => b.id === buildingId)?.name

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">房屋单元管理</h1>
          <p className="text-muted-foreground">管理系统中的房屋单元数据</p>
        </div>
        <Button onClick={() => { setForm({ unitNumber: "", buildingId: buildingId ? String(buildingId) : "", estateId: estateId ? String(estateId) : "", floor: "", area: "", rooms: "", orientation: "" }); setCreateOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />新增房屋
        </Button>
      </div>

      {(cityId || estateId || buildingId) && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
          <MapPin className="h-3 w-3" />
          {selectedCityName && <span>{selectedCityName}</span>}
          {selectedDistrictName && <><ChevronRight className="h-3 w-3" /><span>{selectedDistrictName}</span></>}
          {selectedEstateName && <><ChevronRight className="h-3 w-3" /><span>{selectedEstateName}</span></>}
          {selectedBuildingName && <><ChevronRight className="h-3 w-3" /><span>{selectedBuildingName}</span></>}
          <span className="ml-2 font-medium text-foreground">共 {total} 套房屋</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3 items-center">
            {/* 城市 */}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Select value={cityId ? String(cityId) : "all"} onValueChange={v => { setCityId(v === "all" ? undefined : Number(v)); setDistrictId(undefined); setEstateId(undefined); setBuildingId(undefined); setPage(1) }}>
                <SelectTrigger className="w-28"><SelectValue placeholder="城市" /></SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  <SelectItem value="all">全部城市</SelectItem>
                  {cities.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* 地区（选中城市后显示） */}
            {cityId && (
              <>
                <span className="text-muted-foreground text-sm">›</span>
                <Select value={districtId ? String(districtId) : "all"} onValueChange={v => { setDistrictId(v === "all" ? undefined : Number(v)); setEstateId(undefined); setBuildingId(undefined); setPage(1) }}>
                  <SelectTrigger className="w-28"><SelectValue placeholder="地区" /></SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    <SelectItem value="all">全部地区</SelectItem>
                    {districts.map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </>
            )}
            {/* 楼盘搜索 + 选择（选中城市后显示） */}
            {cityId && (
              <>
                <span className="text-muted-foreground text-sm">›</span>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="搜楼盘名/拼音"
                    className="pl-8 w-36 h-9 text-sm"
                    value={estateSearch}
                    onChange={e => { setEstateSearch(e.target.value); setEstateId(undefined); setBuildingId(undefined) }}
                  />
                </div>
                <Select value={estateId ? String(estateId) : "all"} onValueChange={v => { setEstateId(v === "all" ? undefined : Number(v)); setBuildingId(undefined); setPage(1) }}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="选择楼盘" /></SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    <SelectItem value="all">全部楼盘</SelectItem>
                    {estateOptions.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </>
            )}
            {/* 楼栋（选中楼盘后显示） */}
            {estateId && (
              <>
                <span className="text-muted-foreground text-sm">›</span>
                <Select value={buildingId ? String(buildingId) : "all"} onValueChange={v => { setBuildingId(v === "all" ? undefined : Number(v)); setPage(1) }}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="选择楼栋" /></SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    <SelectItem value="all">全部楼栋</SelectItem>
                    {buildingOptions.map((b: any) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            {/* 房号搜索 */}
            <div className="relative flex-1 min-w-28 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索房号..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
            {(cityId || districtId || estateId || buildingId || search) && (
              <Button variant="ghost" size="sm" onClick={() => { setCityId(undefined); setDistrictId(undefined); setEstateId(undefined); setBuildingId(undefined); setEstateSearch(""); setSearch(""); setPage(1) }}>
                <X className="mr-1 h-3 w-3" />清除
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : unitsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Home className="h-12 w-12 mb-4 opacity-30" />
              <p>{buildingId ? (selectedBuildingName + " 暂无房屋数据") : "请选择楼盘或楼栋查看房屋数据"}</p>
              <p className="text-xs mt-1">数据量较大，建议先选择城市 → 楼盘 → 楼栋后查看</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>房号</TableHead>
                    <TableHead>所属楼盘</TableHead>
                    <TableHead>所属楼栋</TableHead>
                    <TableHead>楼层</TableHead>
                    <TableHead>面积(㎡)</TableHead>
                    <TableHead>户型</TableHead>
                    <TableHead>朝向</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unitsList.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.unitNumber ?? "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-32 truncate">{u.estateName ?? "-"}</TableCell>
                      <TableCell className="text-sm">{u.buildingName ?? "-"}</TableCell>
                      <TableCell>{u.floor ?? "-"}</TableCell>
                      <TableCell>{u.area ? Number(u.area).toFixed(1) : "-"}</TableCell>
                      <TableCell>{u.rooms ? <Badge variant="outline" className="text-xs">{u.rooms}室</Badge> : "-"}</TableCell>
                      <TableCell className="text-sm">{u.orientation ?? "-"}</TableCell>
                      <TableCell className="text-sm">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setEditUnit(u)
                            setForm({ unitNumber: u.unitNumber ?? "", buildingId: String(u.buildingId ?? ""), estateId: String(u.estateId ?? ""), floor: String(u.floor ?? ""), area: u.area ? String(Number(u.area)) : "", rooms: String(u.rooms ?? ""), orientation: u.orientation ?? "" })
                          }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteUnit(u)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">共 {total} 套房屋</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
                  <span className="flex items-center text-sm text-muted-foreground px-2">第 {page} / {Math.ceil(total / 20)} 页</span>
                  <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>下一页</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新增房屋单元</DialogTitle><DialogDescription>添加新的房屋单元</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>所属楼盘 *</Label>
              <Select value={form.estateId || ""} onValueChange={v => setForm(f => ({ ...f, estateId: v, buildingId: "" }))}>
                <SelectTrigger><SelectValue placeholder="请选择楼盘" /></SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {estateOptions.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>所属楼栋 *</Label>
              <Select value={form.buildingId || ""} onValueChange={v => setForm(f => ({ ...f, buildingId: v }))}>
                <SelectTrigger><SelectValue placeholder="请先选择楼盘" /></SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {buildingOptions
                    .filter((b: any) => !form.estateId || String(b.estateId) === form.estateId)
                    .map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)
                  }
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>房号 *</Label><Input placeholder="如：101、A1201" value={form.unitNumber} onChange={e => setForm(f => ({ ...f, unitNumber: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>楼层</Label><Input type="number" placeholder="如：12" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} /></div>
              <div className="space-y-2"><Label>面积(㎡)</Label><Input type="number" placeholder="如：89.5" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} /></div>
              <div className="space-y-2"><Label>室数</Label><Input type="number" placeholder="如：3" value={form.rooms} onChange={e => setForm(f => ({ ...f, rooms: e.target.value }))} /></div>
            </div>
            <div className="space-y-2">
              <Label>朝向</Label>
              <Select value={form.orientation || ""} onValueChange={v => setForm(f => ({ ...f, orientation: v }))}>
                <SelectTrigger><SelectValue placeholder="请选择朝向" /></SelectTrigger>
                <SelectContent>
                  {["南","北","东","西","东南","西南","东北","西北","南北通透"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={() => createMutation.mutate({ buildingId: Number(form.buildingId), estateId: Number(form.estateId), unitNumber: form.unitNumber, floor: form.floor ? Number(form.floor) : undefined, area: form.area ? Number(form.area) : undefined, rooms: form.rooms ? Number(form.rooms) : undefined })} disabled={createMutation.isPending || !form.unitNumber || !form.buildingId || !form.estateId}>
              {createMutation.isPending ? "添加中..." : "添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUnit} onOpenChange={open => !open && setEditUnit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>编辑房屋单元</DialogTitle><DialogDescription>修改房屋基本信息</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>所属楼盘</Label><Input value={editUnit?.estateName ?? "-"} disabled className="bg-muted" /></div>
              <div className="space-y-2"><Label>所属楼栋</Label><Input value={editUnit?.buildingName ?? "-"} disabled className="bg-muted" /></div>
            </div>
            <div className="space-y-2"><Label>房号 *</Label><Input value={form.unitNumber} onChange={e => setForm(f => ({ ...f, unitNumber: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>楼层</Label><Input type="number" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} /></div>
              <div className="space-y-2"><Label>面积(㎡)</Label><Input type="number" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} /></div>
              <div className="space-y-2"><Label>室数</Label><Input type="number" value={form.rooms} onChange={e => setForm(f => ({ ...f, rooms: e.target.value }))} /></div>
            </div>
            <div className="space-y-2">
              <Label>朝向</Label>
              <Select value={form.orientation || ""} onValueChange={v => setForm(f => ({ ...f, orientation: v }))}>
                <SelectTrigger><SelectValue placeholder="请选择朝向" /></SelectTrigger>
                <SelectContent>
                  {["南","北","东","西","东南","西南","东北","西北","南北通透"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUnit(null)}>取消</Button>
            <Button onClick={() => updateMutation.mutate({ id: editUnit.id, unitNumber: form.unitNumber, floor: form.floor ? Number(form.floor) : undefined, area: form.area ? Number(form.area) : undefined })} disabled={updateMutation.isPending || !form.unitNumber}>
              {updateMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteUnit} onOpenChange={open => !open && setDeleteUnit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除房屋「{deleteUnit?.unitNumber}」（{deleteUnit?.estateName} · {deleteUnit?.buildingName} · {deleteUnit?.floor}层）吗？此操作不可恢复。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate({ id: deleteUnit.id })}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
