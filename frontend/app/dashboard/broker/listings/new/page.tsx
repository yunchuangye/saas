"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Building2, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function NewListingPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: "", estateName: "", buildingName: "", unitNo: "",
    floor: "", totalFloors: "", area: "", rooms: "",
    orientation: "", decoration: "", city: "深圳", district: "",
    address: "", listingPrice: "", ownershipType: "商品房",
    ownershipYears: "70", isOnlyHouse: false, hasMortgage: false,
    mortgageAmount: "", vrUrl: "",
  })

  const createMutation = trpc.broker.createListing.useMutation({
    onSuccess: (data) => {
      toast.success(`房源 ${data.listingNo} 创建成功！`)
      router.push("/dashboard/broker/listings")
    },
    onError: (e) => toast.error(e.message),
  })

  const handleSubmit = (asDraft = true) => {
    if (!form.title) { toast.error("请填写房源标题"); return; }
    createMutation.mutate({
      title: form.title,
      estateName: form.estateName || undefined,
      buildingName: form.buildingName || undefined,
      unitNo: form.unitNo || undefined,
      floor: form.floor ? Number(form.floor) : undefined,
      totalFloors: form.totalFloors ? Number(form.totalFloors) : undefined,
      area: form.area ? Number(form.area) : undefined,
      rooms: form.rooms || undefined,
      orientation: form.orientation || undefined,
      decoration: form.decoration || undefined,
      city: form.city || undefined,
      district: form.district || undefined,
      address: form.address || undefined,
      listingPrice: form.listingPrice ? Number(form.listingPrice) : undefined,
      ownershipType: form.ownershipType || undefined,
      ownershipYears: form.ownershipYears ? Number(form.ownershipYears) : undefined,
      isOnlyHouse: form.isOnlyHouse,
      hasMortgage: form.hasMortgage,
      mortgageAmount: form.mortgageAmount ? Number(form.mortgageAmount) : undefined,
      vrUrl: form.vrUrl || undefined,
    })
  }

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/broker/listings">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />返回</Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">发布新房源</h1>
          <p className="text-sm text-gray-500">填写房源信息，发布后可在列表中管理</p>
        </div>
      </div>

      {/* 基本信息 */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4" />基本信息</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>房源标题 *</Label>
            <Input className="mt-1" placeholder="如：南山科技园旁精装3房，采光好，业主急售" value={form.title} onChange={e => set("title", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>楼盘名称</Label>
              <Input className="mt-1" placeholder="如：万科城" value={form.estateName} onChange={e => set("estateName", e.target.value)} />
            </div>
            <div>
              <Label>楼栋/单元</Label>
              <Input className="mt-1" placeholder="如：A栋1单元" value={form.buildingName} onChange={e => set("buildingName", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>房号</Label>
              <Input className="mt-1" placeholder="如：1801" value={form.unitNo} onChange={e => set("unitNo", e.target.value)} />
            </div>
            <div>
              <Label>楼层</Label>
              <Input className="mt-1" type="number" placeholder="18" value={form.floor} onChange={e => set("floor", e.target.value)} />
            </div>
            <div>
              <Label>总楼层</Label>
              <Input className="mt-1" type="number" placeholder="33" value={form.totalFloors} onChange={e => set("totalFloors", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>建筑面积(㎡)</Label>
              <Input className="mt-1" type="number" placeholder="89.5" value={form.area} onChange={e => set("area", e.target.value)} />
            </div>
            <div>
              <Label>户型</Label>
              <Input className="mt-1" placeholder="3室2厅2卫" value={form.rooms} onChange={e => set("rooms", e.target.value)} />
            </div>
            <div>
              <Label>朝向</Label>
              <Select value={form.orientation} onValueChange={v => set("orientation", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="选择朝向" /></SelectTrigger>
                <SelectContent>
                  {["南北通透","纯南向","东南向","西南向","东向","西向","北向"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>装修情况</Label>
              <Select value={form.decoration} onValueChange={v => set("decoration", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="选择装修" /></SelectTrigger>
                <SelectContent>
                  {["精装修","简装修","毛坯","豪华装修"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>VR看房链接</Label>
              <Input className="mt-1" placeholder="https://..." value={form.vrUrl} onChange={e => set("vrUrl", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 地址信息 */}
      <Card>
        <CardHeader><CardTitle className="text-base">地址信息</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>城市</Label>
              <Input className="mt-1" value={form.city} onChange={e => set("city", e.target.value)} />
            </div>
            <div>
              <Label>区域</Label>
              <Input className="mt-1" placeholder="如：南山区" value={form.district} onChange={e => set("district", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>详细地址</Label>
            <Input className="mt-1" placeholder="如：深圳市南山区科技南十二路..." value={form.address} onChange={e => set("address", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* 价格与产权 */}
      <Card>
        <CardHeader><CardTitle className="text-base">价格与产权</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>挂牌价格（元）</Label>
              <Input className="mt-1" type="number" placeholder="5000000" value={form.listingPrice} onChange={e => set("listingPrice", e.target.value)} />
              {form.listingPrice && form.area && (
                <p className="text-xs text-gray-400 mt-1">单价：{Math.round(Number(form.listingPrice) / Number(form.area))} 元/㎡</p>
              )}
            </div>
            <div>
              <Label>产权类型</Label>
              <Select value={form.ownershipType} onValueChange={v => set("ownershipType", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["商品房","经济适用房","限价房","共有产权房","小产权房"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>产权年限（年）</Label>
              <Select value={form.ownershipYears} onValueChange={v => set("ownershipYears", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["70","50","40"].map(y => <SelectItem key={y} value={y}>{y}年</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.isOnlyHouse} onCheckedChange={v => set("isOnlyHouse", v)} />
              <Label>唯一住房（免增值税）</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.hasMortgage} onCheckedChange={v => set("hasMortgage", v)} />
              <Label>有抵押贷款</Label>
            </div>
          </div>
          {form.hasMortgage && (
            <div>
              <Label>抵押金额（元）</Label>
              <Input className="mt-1" type="number" placeholder="1000000" value={form.mortgageAmount} onChange={e => set("mortgageAmount", e.target.value)} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 提交按钮 */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => handleSubmit(true)} disabled={createMutation.isPending}>
          <Save className="w-4 h-4 mr-1" />保存草稿
        </Button>
        <Button onClick={() => handleSubmit(false)} disabled={createMutation.isPending}>
          {createMutation.isPending ? "发布中..." : "发布上架"}
        </Button>
      </div>
    </div>
  )
}
