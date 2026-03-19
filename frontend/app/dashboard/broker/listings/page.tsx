"use client"
import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Plus, Search, MapPin, Eye, Edit, Share2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "bg-gray-100 text-gray-600" },
  active: { label: "在售", color: "bg-green-100 text-green-700" },
  reserved: { label: "已预订", color: "bg-yellow-100 text-yellow-700" },
  sold: { label: "已售", color: "bg-blue-100 text-blue-700" },
  offline: { label: "已下架", color: "bg-red-100 text-red-700" },
}

export default function BrokerListingsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState("all")
  const [keyword, setKeyword] = useState("")
  const [search, setSearch] = useState("")

  const { data, isLoading, refetch } = trpc.broker.listListings.useQuery({
    page, pageSize: 12, status: status as any, keyword: search || undefined,
  })

  const { data: stats } = trpc.broker.listingStats.useQuery()

  const updateMutation = trpc.broker.updateListing.useMutation({
    onSuccess: () => { toast.success("操作成功"); refetch(); },
    onError: (e) => toast.error(e.message),
  })

  const createLinkMutation = trpc.broker.createMarketingLink.useMutation({
    onSuccess: (data) => {
      toast.success("分享链接已生成！")
      navigator.clipboard?.writeText(`${window.location.origin}${data.shareUrl}`)
      toast.info("链接已复制到剪贴板")
    },
    onError: (e) => toast.error(e.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">房源管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理所有在售和历史房源</p>
        </div>
        <Link href="/dashboard/broker/listings/new">
          <Button><Plus className="w-4 h-4 mr-1" />发布新房源</Button>
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { key: "total", label: "全部" },
          { key: "active", label: "在售" },
          { key: "reserved", label: "已预订" },
          { key: "sold", label: "已售" },
          { key: "draft", label: "草稿" },
        ].map((s) => (
          <Card key={s.key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatus(s.key === "total" ? "all" : s.key)}>
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold">{(stats as any)?.[s.key] ?? 0}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 搜索和筛选 */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="搜索楼盘名称、地址..." value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setSearch(keyword)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-32"><SelectValue placeholder="状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="active">在售</SelectItem>
            <SelectItem value="reserved">已预订</SelectItem>
            <SelectItem value="sold">已售</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="offline">已下架</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setSearch(keyword)}>搜索</Button>
      </div>

      {/* 房源列表 */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.items as any[])?.map((listing: any) => (
            <Card key={listing.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                {/* 封面图 */}
                <div className="h-40 bg-gradient-to-br from-blue-100 to-blue-200 rounded-t-lg flex items-center justify-center relative">
                  {listing.cover_image ? (
                    <img src={listing.cover_image} alt={listing.title} className="w-full h-full object-cover rounded-t-lg" />
                  ) : (
                    <Building2 className="w-12 h-12 text-blue-400" />
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_MAP[listing.status]?.color}`}>
                      {STATUS_MAP[listing.status]?.label}
                    </span>
                  </div>
                  {listing.vr_url && (
                    <div className="absolute bottom-2 left-2">
                      <span className="text-xs bg-black/60 text-white px-2 py-1 rounded">VR看房</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{listing.title}</h3>
                  <div className="flex items-center gap-1 mt-1 text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span className="text-xs line-clamp-1">{listing.address || listing.district || "暂无地址"}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {listing.rooms && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{listing.rooms}</span>}
                    {listing.area && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{listing.area}㎡</span>}
                    {listing.floor && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{listing.floor}层</span>}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <span className="text-lg font-bold text-red-600">
                        {listing.listing_price ? `¥${(listing.listing_price / 10000).toFixed(0)}万` : "价格面议"}
                      </span>
                      {listing.unit_price && (
                        <span className="text-xs text-gray-400 ml-1">{Math.round(listing.unit_price)}元/㎡</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Eye className="w-3 h-3" />
                      <span>{listing.view_count}</span>
                    </div>
                  </div>
                  {/* 操作按钮 */}
                  <div className="flex gap-2 mt-3">
                    <Link href={`/dashboard/broker/listings/${listing.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full">
                        <Edit className="w-3 h-3 mr-1" />编辑
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => createLinkMutation.mutate({ linkType: "listing", listingId: listing.id, title: listing.title })}>
                      <Share2 className="w-3 h-3 mr-1" />分享
                    </Button>
                    {listing.status === "draft" && (
                      <Button size="sm" className="flex-1" onClick={() => updateMutation.mutate({ id: listing.id, status: "active" })}>
                        上架
                      </Button>
                    )}
                    {listing.status === "active" && (
                      <Button size="sm" variant="destructive" className="flex-1" onClick={() => updateMutation.mutate({ id: listing.id, status: "offline" })}>
                        下架
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!data?.items || data.items.length === 0) && (
            <div className="col-span-3 text-center py-12 text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无房源，点击"发布新房源"开始</p>
            </div>
          )}
        </div>
      )}

      {/* 分页 */}
      {data && data.total > 12 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
          <span className="text-sm text-gray-500 flex items-center">第 {page} 页 / 共 {Math.ceil(data.total / 12)} 页</span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(data.total / 12)} onClick={() => setPage(p => p + 1)}>下一页</Button>
        </div>
      )}
    </div>
  )
}
