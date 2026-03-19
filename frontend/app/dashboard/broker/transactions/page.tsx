"use client"
import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRightLeft, Plus, Search, CheckCircle, Clock, AlertCircle, FileText } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  negotiating: { label: "洽谈中", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  signed: { label: "已签约", color: "bg-blue-100 text-blue-700", icon: FileText },
  loan_processing: { label: "贷款办理", color: "bg-purple-100 text-purple-700", icon: Clock },
  transfer_processing: { label: "过户办理", color: "bg-orange-100 text-orange-700", icon: Clock },
  completed: { label: "已完成", color: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelled: { label: "已取消", color: "bg-gray-100 text-gray-500", icon: AlertCircle },
}

const STEPS = [
  { key: "negotiating", label: "洽谈" },
  { key: "signed", label: "签约" },
  { key: "loan_processing", label: "贷款" },
  { key: "transfer_processing", label: "过户" },
  { key: "completed", label: "完成" },
]

export default function BrokerTransactionsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState("all")
  const [keyword, setKeyword] = useState("")
  const [search, setSearch] = useState("")

  const { data, isLoading, refetch } = trpc.broker.listTransactions.useQuery({
    page, pageSize: 10, status: status as any, keyword: search || undefined,
  })

  const advanceMutation = trpc.broker.advanceTransaction.useMutation({
    onSuccess: () => { toast.success("交易状态已更新"); refetch(); },
    onError: (e) => toast.error(e.message),
  })

  const requestValuationMutation = trpc.broker.requestValuation.useMutation({
    onSuccess: () => toast.success("估价委托已发起，请等待评估师报价"),
    onError: (e) => toast.error(e.message),
  })

  const NEXT_STATUS: Record<string, string> = {
    negotiating: "signed",
    signed: "loan_processing",
    loan_processing: "transfer_processing",
    transfer_processing: "completed",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">二手房交易</h1>
          <p className="text-sm text-gray-500 mt-1">管理买卖双方交易全流程</p>
        </div>
        <Link href="/dashboard/broker/transactions/new">
          <Button><Plus className="w-4 h-4 mr-1" />发起新交易</Button>
        </Link>
      </div>

      {/* 状态筛选 */}
      <div className="flex gap-2 flex-wrap">
        {[{ key: "all", label: "全部" }, ...STEPS, { key: "cancelled", label: "已取消" }].map(s => (
          <Button key={s.key} size="sm" variant={status === s.key ? "default" : "outline"} onClick={() => setStatus(s.key)}>
            {s.label}
          </Button>
        ))}
      </div>

      {/* 搜索 */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="搜索交易编号、房源标题..." value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => e.key === "Enter" && setSearch(keyword)} />
        </div>
        <Button variant="outline" onClick={() => setSearch(keyword)}>搜索</Button>
      </div>

      {/* 交易列表 */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <div className="space-y-4">
          {(data?.items as any[])?.map((tx: any) => {
            const StatusIcon = STATUS_MAP[tx.status]?.icon || Clock
            const currentStepIdx = STEPS.findIndex(s => s.key === tx.status)
            return (
              <Card key={tx.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{tx.transaction_no}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_MAP[tx.status]?.color}`}>
                          {STATUS_MAP[tx.status]?.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{tx.listing_title || "房源信息"}</p>
                      <div className="flex gap-4 mt-1 text-xs text-gray-500">
                        {tx.seller_name && <span>卖方：{tx.seller_name}</span>}
                        {tx.buyer_name && <span>买方：{tx.buyer_name}</span>}
                        {tx.agreed_price && <span className="text-red-600 font-medium">成交价：¥{(tx.agreed_price / 10000).toFixed(0)}万</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      {tx.commission_amount && (
                        <div>
                          <p className="text-xs text-gray-400">预计佣金</p>
                          <p className="font-bold text-green-600">¥{(tx.commission_amount / 10000).toFixed(2)}万</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="flex items-center gap-1 mb-4">
                    {STEPS.map((step, idx) => (
                      <div key={step.key} className="flex items-center flex-1">
                        <div className={`flex-1 h-1.5 rounded-full ${idx <= currentStepIdx ? "bg-blue-500" : "bg-gray-200"}`} />
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${idx <= currentStepIdx ? "bg-blue-500" : "bg-gray-200"}`} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mb-4">
                    {STEPS.map(s => <span key={s.key}>{s.label}</span>)}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    {NEXT_STATUS[tx.status] && (
                      <Button size="sm" onClick={() => advanceMutation.mutate({ id: tx.id, status: NEXT_STATUS[tx.status] as any })}>
                        推进至「{STATUS_MAP[NEXT_STATUS[tx.status]]?.label}」
                      </Button>
                    )}
                    {!tx.valuation_project_id && tx.listing_id && (
                      <Button size="sm" variant="outline" onClick={() => requestValuationMutation.mutate({ transactionId: tx.id, listingId: tx.listing_id })}>
                        <FileText className="w-3 h-3 mr-1" />委托估价
                      </Button>
                    )}
                    {tx.valuation_project_id && (
                      <Link href={`/dashboard/broker/projects/${tx.valuation_project_id}`}>
                        <Button size="sm" variant="outline">查看估价报告</Button>
                      </Link>
                    )}
                    {tx.status !== "completed" && tx.status !== "cancelled" && (
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => advanceMutation.mutate({ id: tx.id, status: "cancelled" })}>
                        取消交易
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {(!data?.items || data.items.length === 0) && (
            <div className="text-center py-12 text-gray-400">
              <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无交易记录，点击"发起新交易"开始</p>
            </div>
          )}
        </div>
      )}

      {data && data.total > 10 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
          <span className="text-sm text-gray-500 flex items-center">第 {page} 页 / 共 {Math.ceil(data.total / 10)} 页</span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(data.total / 10)} onClick={() => setPage(p => p + 1)}>下一页</Button>
        </div>
      )}
    </div>
  )
}
