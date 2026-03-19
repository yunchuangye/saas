"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function NewTransactionPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    listingId: "", sellerName: "", sellerPhone: "", sellerIdNo: "",
    buyerName: "", buyerPhone: "", buyerIdNo: "",
    agreedPrice: "", commissionRate: "2", paymentMethod: "mortgage",
    expectedSignDate: "", notes: "",
  })

  const { data: listings } = trpc.broker.listListings.useQuery({ page: 1, pageSize: 100, status: "active" })

  const createMutation = trpc.broker.createTransaction.useMutation({
    onSuccess: (data) => {
      toast.success(`交易 ${data.transactionNo} 创建成功！`)
      router.push("/dashboard/broker/transactions")
    },
    onError: (e) => toast.error(e.message),
  })

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

  const commission = form.agreedPrice && form.commissionRate
    ? (Number(form.agreedPrice) * Number(form.commissionRate) / 100 / 10000).toFixed(2)
    : "0"

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/broker/transactions">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />返回</Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">发起新交易</h1>
          <p className="text-sm text-gray-500">录入买卖双方信息，创建二手房交易</p>
        </div>
      </div>

      {/* 房源选择 */}
      <Card>
        <CardHeader><CardTitle className="text-base">选择房源</CardTitle></CardHeader>
        <CardContent>
          <Select value={form.listingId} onValueChange={v => set("listingId", v)}>
            <SelectTrigger><SelectValue placeholder="选择已发布的房源" /></SelectTrigger>
            <SelectContent>
              {(listings?.items as any[])?.map((l: any) => (
                <SelectItem key={l.id} value={String(l.id)}>
                  {l.title} - {l.listing_price ? `¥${(l.listing_price / 10000).toFixed(0)}万` : "价格面议"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 卖方信息 */}
      <Card>
        <CardHeader><CardTitle className="text-base">卖方信息</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>卖方姓名 *</Label>
              <Input className="mt-1" value={form.sellerName} onChange={e => set("sellerName", e.target.value)} />
            </div>
            <div>
              <Label>卖方手机号 *</Label>
              <Input className="mt-1" value={form.sellerPhone} onChange={e => set("sellerPhone", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>卖方身份证号</Label>
            <Input className="mt-1" value={form.sellerIdNo} onChange={e => set("sellerIdNo", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* 买方信息 */}
      <Card>
        <CardHeader><CardTitle className="text-base">买方信息</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>买方姓名 *</Label>
              <Input className="mt-1" value={form.buyerName} onChange={e => set("buyerName", e.target.value)} />
            </div>
            <div>
              <Label>买方手机号 *</Label>
              <Input className="mt-1" value={form.buyerPhone} onChange={e => set("buyerPhone", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>买方身份证号</Label>
            <Input className="mt-1" value={form.buyerIdNo} onChange={e => set("buyerIdNo", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* 交易信息 */}
      <Card>
        <CardHeader><CardTitle className="text-base">交易信息</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>成交价格（元）*</Label>
              <Input className="mt-1" type="number" placeholder="5000000" value={form.agreedPrice} onChange={e => set("agreedPrice", e.target.value)} />
            </div>
            <div>
              <Label>佣金比例（%）</Label>
              <Input className="mt-1" type="number" step="0.1" value={form.commissionRate} onChange={e => set("commissionRate", e.target.value)} />
            </div>
          </div>
          {form.agreedPrice && (
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">预计佣金：<span className="font-bold">¥{commission}万</span>（按 {form.commissionRate}% 计算）</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>付款方式</Label>
              <Select value={form.paymentMethod} onValueChange={v => set("paymentMethod", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_payment">全款</SelectItem>
                  <SelectItem value="mortgage">商业贷款</SelectItem>
                  <SelectItem value="provident_fund">公积金贷款</SelectItem>
                  <SelectItem value="combination">组合贷款</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>预计签约日期</Label>
              <Input className="mt-1" type="date" value={form.expectedSignDate} onChange={e => set("expectedSignDate", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>备注</Label>
            <Textarea className="mt-1" rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Link href="/dashboard/broker/transactions"><Button variant="outline">取消</Button></Link>
        <Button onClick={() => createMutation.mutate({
          listingId: form.listingId ? Number(form.listingId) : undefined,
          sellerName: form.sellerName, sellerPhone: form.sellerPhone, sellerIdNo: form.sellerIdNo || undefined,
          buyerName: form.buyerName, buyerPhone: form.buyerPhone, buyerIdNo: form.buyerIdNo || undefined,
          agreedPrice: form.agreedPrice ? Number(form.agreedPrice) : undefined,
          commissionRate: form.commissionRate ? Number(form.commissionRate) : undefined,
          paymentMethod: form.paymentMethod as any,
          expectedSignDate: form.expectedSignDate || undefined,
          notes: form.notes || undefined,
        })} disabled={createMutation.isPending}>
          {createMutation.isPending ? "创建中..." : "创建交易"}
        </Button>
      </div>
    </div>
  )
}
