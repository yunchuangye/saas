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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, FolderOpen, Eye, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

const statusMap: Record<string, { label: string; variant: "default"|"secondary"|"destructive"|"outline" }> = {
  bidding:   { label: "竞价中",   variant: "secondary" },
  awarded:   { label: "已中标",   variant: "outline" },
  active:    { label: "进行中",   variant: "default" },
  surveying: { label: "勘察中",   variant: "default" },
  reporting: { label: "报告编制", variant: "default" },
  reviewing: { label: "审核中",   variant: "secondary" },
  completed: { label: "已完成",   variant: "outline" },
  cancelled: { label: "已取消",   variant: "destructive" },
}

export default function AdminProjectsPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [detailProject, setDetailProject] = useState<any>(null)
  const [statusDialog, setStatusDialog] = useState<any>(null)
  const [newStatus, setNewStatus] = useState("")
  const [remark, setRemark] = useState("")

  const { data, isLoading, refetch } = trpc.projects.list.useQuery({ page, pageSize: 20, search: search || undefined })
  const updateStatusMutation = trpc.projects.updateStatus.useMutation({
    onSuccess: () => { toast({ title: "项目状态已更新" }); setStatusDialog(null); setRemark(""); refetch() },
    onError: (err) => toast({ title: "操作失败", description: err.message, variant: "destructive" }),
  })

  const projects = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">项目监控</h1>
          <p className="text-muted-foreground">监控和管理所有评估项目</p>
        </div>
        <Badge variant="secondary"><FolderOpen className="mr-1 h-3 w-3" />共 {total} 个项目</Badge>
      </div>
      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="搜索项目编号、名称..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mb-4 opacity-30" /><p>暂无项目数据</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>项目编号</TableHead>
                    <TableHead>项目名称</TableHead>
                    <TableHead>物业地址</TableHead>
                    <TableHead>物业类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.projectNo ?? `PRJ-${p.id}`}</TableCell>
                      <TableCell className="font-medium max-w-[140px] truncate">{p.title}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[140px] truncate">{p.propertyAddress ?? p.address ?? "-"}</TableCell>
                      <TableCell className="text-sm">{p.propertyType ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant={(statusMap[p.status]?.variant ?? "outline") as any}>
                          {statusMap[p.status]?.label ?? p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" title="查看详情" onClick={() => setDetailProject(p)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setStatusDialog(p); setNewStatus(p.status) }}>
                            <RefreshCw className="h-3 w-3 mr-1" />状态
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
                  <Button variant="outline" size="sm" disabled={projects.length < 20} onClick={() => setPage(p => p + 1)}>下一页</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detailProject} onOpenChange={open => !open && setDetailProject(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>项目详情</DialogTitle>
            <DialogDescription>{detailProject?.projectNo ?? `PRJ-${detailProject?.id}`}</DialogDescription>
          </DialogHeader>
          {detailProject && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">项目名称</p><p className="font-medium mt-1">{detailProject.title}</p></div>
                <div><p className="text-muted-foreground">当前状态</p>
                  <Badge className="mt-1" variant={(statusMap[detailProject.status]?.variant ?? "outline") as any}>
                    {statusMap[detailProject.status]?.label ?? detailProject.status}
                  </Badge>
                </div>
                <div><p className="text-muted-foreground">物业地址</p><p className="font-medium mt-1">{detailProject.propertyAddress ?? detailProject.address ?? "-"}</p></div>
                <div><p className="text-muted-foreground">物业类型</p><p className="font-medium mt-1">{detailProject.propertyType ?? "-"}</p></div>
                <div><p className="text-muted-foreground">建筑面积</p><p className="font-medium mt-1">{detailProject.propertyArea ? `${detailProject.propertyArea} m²` : "-"}</p></div>
                <div><p className="text-muted-foreground">评估目的</p><p className="font-medium mt-1">{detailProject.purpose ?? "-"}</p></div>
                <div><p className="text-muted-foreground">创建时间</p><p className="font-medium mt-1">{new Date(detailProject.createdAt).toLocaleString()}</p></div>
                <div><p className="text-muted-foreground">最后更新</p><p className="font-medium mt-1">{detailProject.updatedAt ? new Date(detailProject.updatedAt).toLocaleString() : "-"}</p></div>
              </div>
              {detailProject.description && (
                <div><p className="text-muted-foreground text-sm">项目描述</p><p className="mt-1 text-sm border rounded p-3 bg-muted/30">{detailProject.description}</p></div>
              )}
              <div className="flex gap-2 pt-2 border-t">
                <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50"
                  onClick={() => { setDetailProject(null); setStatusDialog(detailProject); setNewStatus("active") }}>
                  <CheckCircle className="mr-1 h-4 w-4" />审批通过
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => { setDetailProject(null); setStatusDialog(detailProject); setNewStatus("cancelled") }}>
                  <XCircle className="mr-1 h-4 w-4" />拒绝/取消
                </Button>
                <Button size="sm" variant="outline"
                  onClick={() => { setDetailProject(null); setStatusDialog(detailProject); setNewStatus(detailProject.status) }}>
                  <RefreshCw className="mr-1 h-4 w-4" />变更状态
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailProject(null)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!statusDialog} onOpenChange={open => !open && setStatusDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>变更项目状态</DialogTitle>
            <DialogDescription>{statusDialog?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>目标状态</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue placeholder="选择状态" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusMap).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>备注（可选）</Label>
              <Textarea placeholder="填写状态变更原因..." value={remark} onChange={e => setRemark(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(null)}>取消</Button>
            <Button onClick={() => updateStatusMutation.mutate({ id: statusDialog.id, status: newStatus as any })}
              disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? "更新中..." : "确认变更"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
