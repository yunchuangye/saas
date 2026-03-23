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
import { Search, Building2, Plus, Pencil, Trash2, MapPin, X } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

export default function EstatesPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [cityId, setCityId] = useState<number | undefined>(undefined)
  const [districtId, setDistrictId] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [editEstate, setEditEstate] = useState<any>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteEstate, setDeleteEstate] = useState<any>(null)
  const [form, setForm] = useState({ name: "", address: "", cityId: "", districtId: "", developer: "", propertyType: "" })

  const { data: citiesData } = trpc.directory.cities.list.useQuery({ pageSize: 500 })
  const cities = citiesData?.items ?? []

  // 根据选中城市加载地区列表
  const { data: districtsData } = trpc.directory.listDistricts.useQuery(
    { cityId: cityId! },
    { enabled: !!cityId, staleTime: 60000 }
  )
  const districts = districtsData?.items ?? []

  const { data, isLoading, refetch } = trpc.directory.listEstates.useQuery({
    page, pageSize: 20,
    search: search || undefined,
    cityId: cityId || undefined,
    districtId: districtId || undefined,
  })
  const estates = data?.items ?? []
  const total = data?.total ?? 0

  const createMutation = trpc.directory.estates.create.useMutation({
    onSuccess: () => { toast({ title: "楼盘已添加" }); setCreateOpen(false); setForm({ name: "", address: "", cityId: "", districtId: "", developer: "", propertyType: "" }); refetch() },
    onError: (err) => toast({ title: "添加失败", description: err.message, variant: "destructive" }),
  })
  const updateMutation = trpc.directory.estates.update.useMutation({
    onSuccess: () => { toast({ title: "楼盘信息已更新" }); setEditEstate(null); refetch() },
    onError: (err) => toast({ title: "更新失败", description: err.message, variant: "destructive" }),
  })
  const deleteMutation = trpc.directory.estates.delete.useMutation({
    onSuccess: () => { toast({ title: "楼盘已删除" }); setDeleteEstate(null); refetch() },
    onError: (err) => toast({ title: "删除失败", description: err.message, variant: "destructive" }),
  })

  const selectedCityName = cities.find((c: any) => c.id === cityId)?.name
  const selectedDistrictName = districts.find((d: any) => d.id === districtId)?.name

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">楼盘管理</h1>
          <p className="text-muted-foreground">管理系统中的楼盘数据</p>
        </div>
        <Button onClick={() => { setForm({ name: "", address: "", cityId: cityId ? String(cityId) : "", districtId: districtId ? String(districtId) : "", developer: "", propertyType: "" }); setCreateOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />新增楼盘
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3 items-center">
            {/* 城市筛选 */}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Select value={cityId ? String(cityId) : "all"} onValueChange={v => { setCityId(v === "all" ? undefined : Number(v)); setDistrictId(undefined); setPage(1) }}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="选择城市" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  <SelectItem value="all">全部城市</SelectItem>
                  {cities.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* 地区筛选（选中城市后显示） */}
            {cityId && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">›</span>
                <Select value={districtId ? String(districtId) : "all"} onValueChange={v => { setDistrictId(v === "all" ? undefined : Number(v)); setPage(1) }}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="选择地区" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    <SelectItem value="all">全部地区</SelectItem>
                    {districts.map((d: any) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* 搜索框：支持楼盘名称 + 拼音首字母 */}
            <div className="relative flex-1 min-w-48 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索楼盘名称或拼音首字母（如 WKJY）..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
            {(cityId || districtId || search) && (
              <Button variant="ghost" size="sm" onClick={() => { setCityId(undefined); setDistrictId(undefined); setSearch(""); setPage(1) }}>
                <X className="mr-1 h-3 w-3" />清除筛选
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : estates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Building2 className="h-12 w-12 mb-4 opacity-30" />
              <p>{cityId ? `${selectedCityName}暂无楼盘数据` : "暂无楼盘数据"}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>楼盘名称</TableHead>
                    <TableHead>拼音首字母</TableHead>
                    <TableHead>城市</TableHead>
                    <TableHead>地址</TableHead>
                    <TableHead>物业类型</TableHead>
                    <TableHead>楼栋数</TableHead>
                    <TableHead>案例数</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estates.map((e: any) => {
                    const city = cities.find((c: any) => c.id === e.cityId)
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.name}</TableCell>
                        <TableCell>
                          {e.pinyin ? <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{e.pinyin}</span> : <span className="text-muted-foreground text-xs">-</span>}
                        </TableCell>
                        <TableCell>
                          {city ? <Badge variant="outline" className="text-xs">{city.name}</Badge> : <span className="text-muted-foreground text-xs">-</span>}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{e.address ?? "-"}</TableCell>
                        <TableCell className="text-sm">{e.propertyType ?? "-"}</TableCell>
                        <TableCell><Badge variant="secondary">{e.buildingCount ?? 0}</Badge></TableCell>
                        <TableCell><Badge variant="outline">{e.caseCount ?? 0}</Badge></TableCell>
                        <TableCell className="text-sm">{new Date(e.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setEditEstate(e); setForm({ name: e.name, address: e.address ?? "", cityId: String(e.cityId ?? ""), districtId: "", developer: e.developer ?? "", propertyType: e.propertyType ?? "" }) }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteEstate(e)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  {selectedCityName && <span>{selectedCityName}{selectedDistrictName ? ` › ${selectedDistrictName}` : ""} · </span>}
                  共 {total.toLocaleString()} 条楼盘
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
          <DialogHeader><DialogTitle>新增楼盘</DialogTitle><DialogDescription>添加新的楼盘到数据目录</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>楼盘名称 *</Label><Input placeholder="如：碧桂园·天悦" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>所在城市 *</Label>
              <Select value={form.cityId || ""} onValueChange={v => setForm(f => ({ ...f, cityId: v }))}>
                <SelectTrigger><SelectValue placeholder="请选择城市" /></SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {cities.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>详细地址</Label><Input placeholder="如：广州市天河区..." value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div className="space-y-2"><Label>开发商</Label><Input placeholder="如：碧桂园集团" value={form.developer} onChange={e => setForm(f => ({ ...f, developer: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>物业类型</Label>
              <Select value={form.propertyType || ""} onValueChange={v => setForm(f => ({ ...f, propertyType: v }))}>
                <SelectTrigger><SelectValue placeholder="请选择物业类型" /></SelectTrigger>
                <SelectContent>
                  {["住宅","商业","办公","工业","综合"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={() => createMutation.mutate({ name: form.name, address: form.address || undefined, cityId: form.cityId ? Number(form.cityId) : 1, developer: form.developer || undefined, propertyType: form.propertyType || undefined })} disabled={createMutation.isPending || !form.name || !form.cityId}>
              {createMutation.isPending ? "添加中..." : "添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editEstate} onOpenChange={open => !open && setEditEstate(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>编辑楼盘</DialogTitle><DialogDescription>修改楼盘基本信息</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>楼盘名称 *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>所在城市</Label>
              <Select value={form.cityId || ""} onValueChange={v => setForm(f => ({ ...f, cityId: v }))}>
                <SelectTrigger><SelectValue placeholder="请选择城市" /></SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {cities.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>详细地址</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div className="space-y-2"><Label>开发商</Label><Input value={form.developer} onChange={e => setForm(f => ({ ...f, developer: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>物业类型</Label>
              <Select value={form.propertyType || ""} onValueChange={v => setForm(f => ({ ...f, propertyType: v }))}>
                <SelectTrigger><SelectValue placeholder="请选择物业类型" /></SelectTrigger>
                <SelectContent>
                  {["住宅","商业","办公","工业","综合"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEstate(null)}>取消</Button>
            <Button onClick={() => updateMutation.mutate({ id: editEstate.id, name: form.name, address: form.address || undefined })} disabled={updateMutation.isPending || !form.name}>
              {updateMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteEstate} onOpenChange={open => !open && setDeleteEstate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除楼盘「{deleteEstate?.name}」吗？该操作将同时影响关联的楼栋和房屋数据，且不可恢复。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate({ id: deleteEstate.id })}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
