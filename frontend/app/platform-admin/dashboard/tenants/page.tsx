"use client"
import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Building2, Search, CheckCircle, XCircle, Eye, Shield, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: "正常", color: "bg-green-500/20 text-green-400" },
  suspended: { label: "已暂停", color: "bg-red-500/20 text-red-400" },
  pending: { label: "待审核", color: "bg-yellow-500/20 text-yellow-400" },
  cancelled: { label: "已注销", color: "bg-gray-500/20 text-gray-400" },
}

export default function PlatformAdminTenantsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState("all")
  const [keyword, setKeyword] = useState("")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<any>(null)
  const [reason, setReason] = useState("")

  const { data, isLoading, refetch } = trpc.platformAdmin.listTenants.useQuery({
    page, pageSize: 15, status: status as any, keyword: search || undefined,
  })

  const updateMutation = trpc.platformAdmin.updateTenantStatus.useMutation({
    onSuccess: () => { toast.success("操作成功"); refetch(); setSelected(null); },
    onError: (e) => toast.error(e.message),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">租户管理</h1>
        <p className="text-gray-400 text-sm mt-1">管理所有 SaaS 租户机构，审核、暂停、注销</p>
      </div>

      {/* 筛选 */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            placeholder="搜索机构名称、联系人..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && setSearch(keyword)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36 bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待审核</SelectItem>
            <SelectItem value="active">正常</SelectItem>
            <SelectItem value="suspended">已暂停</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="border-gray-700 text-gray-300" onClick={() => setSearch(keyword)}>
          搜索
        </Button>
      </div>

      {/* 租户列表 */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>
      ) : (
        <div className="space-y-3">
          {(data?.items as any[])?.map((tenant: any) => (
            <Card key={tenant.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      {tenant.logo ? (
                        <img src={tenant.logo} alt="" className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <Building2 className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{tenant.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_MAP[tenant.status]?.color}`}>
                          {STATUS_MAP[tenant.status]?.label}
                        </span>
                        {tenant.plan_id && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                            {tenant.plan_id}套餐
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-gray-400">
                        {tenant.contact_name && <span>联系人：{tenant.contact_name}</span>}
                        {tenant.contact_phone && <span>{tenant.contact_phone}</span>}
                        {tenant.contact_email && <span>{tenant.contact_email}</span>}
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-gray-500">
                        <span>注册：{tenant.created_at ? new Date(tenant.created_at).toLocaleDateString("zh-CN") : "-"}</span>
                        {tenant.user_count !== undefined && <span>用户数：{tenant.user_count}</span>}
                        {tenant.report_count !== undefined && <span>报告数：{tenant.report_count}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {tenant.status === "pending" && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateMutation.mutate({ orgId: tenant.id, status: "active", reason: "审核通过" })}>
                          <CheckCircle className="w-3 h-3 mr-1" />通过
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={() => { setSelected({ ...tenant, action: "reject" }); }}>
                          <XCircle className="w-3 h-3 mr-1" />拒绝
                        </Button>
                      </>
                    )}
                    {tenant.status === "active" && (
                      <Button size="sm" variant="outline" className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10" onClick={() => setSelected({ ...tenant, action: "suspend" })}>
                        <AlertTriangle className="w-3 h-3 mr-1" />暂停
                      </Button>
                    )}
                    {tenant.status === "suspended" && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => updateMutation.mutate({ orgId: tenant.id, status: "active", reason: "恢复正常" })}>
                        恢复
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!data?.items || data.items.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无租户数据</p>
            </div>
          )}
        </div>
      )}

      {/* 分页 */}
      {data && data.total > 15 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" className="border-gray-700 text-gray-300" disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
          <span className="text-sm text-gray-500 flex items-center">第 {page} 页 / 共 {Math.ceil(data.total / 15)} 页</span>
          <Button variant="outline" size="sm" className="border-gray-700 text-gray-300" disabled={page >= Math.ceil(data.total / 15)} onClick={() => setPage(p => p + 1)}>下一页</Button>
        </div>
      )}

      {/* 操作确认弹窗 */}
      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setReason(""); }}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>{selected?.action === "suspend" ? "暂停租户" : "拒绝租户审核"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-gray-400 text-sm">
              确认要{selected?.action === "suspend" ? "暂停" : "拒绝"}租户「{selected?.name}」吗？
            </p>
            <div>
              <label className="text-gray-300 text-sm">操作原因（必填）</label>
              <Input
                className="mt-1 bg-gray-800 border-gray-700 text-white"
                placeholder="请输入原因..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" className="border-gray-700 text-gray-300" onClick={() => { setSelected(null); setReason(""); }}>取消</Button>
              <Button
                className={selected?.action === "suspend" ? "bg-yellow-600 hover:bg-yellow-700" : "bg-red-600 hover:bg-red-700"}
                onClick={() => {
                  if (!reason) { toast.error("请填写操作原因"); return; }
                  updateMutation.mutate({
                    orgId: selected.id,
                    status: selected.action === "suspend" ? "suspended" : "cancelled",
                    reason,
                  })
                }}
                disabled={updateMutation.isPending}
              >
                确认{selected?.action === "suspend" ? "暂停" : "拒绝"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
