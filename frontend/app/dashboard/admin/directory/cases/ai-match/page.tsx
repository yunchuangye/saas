"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Slider } from "@/components/ui/slider"
import { GitCompare, Search, RefreshCw, Star, MapPin, Home, Calendar, DollarSign } from "lucide-react"

const DISTRICTS = ["福田区", "南山区", "宝安区", "龙华区", "罗湖区", "盐田区", "光明区", "坪山区", "龙岗区"]
const PROPERTY_TYPES = ["住宅", "商业", "办公", "工业", "综合"]

type MatchCase = {
  id: number; address: string; area: number; floor: string
  totalPrice: number; unitPrice: number; dealDate: string; similarity: number
  source: string; propertyType: string; matchReasons: string[]
}

export default function AIMatchPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<MatchCase[]>([])
  const [form, setForm] = useState({ district: "福田区", area: "100", propertyType: "住宅", radius: "1", minSimilarity: [75] })
  const [selected, setSelected] = useState<MatchCase | null>(null)

  const handleMatch = () => {
    setLoading(true); setResults([]); setSelected(null)
    setTimeout(() => {
      const base = Math.floor(Math.random() * 30000 + 60000)
      const roads = ["福华路", "科技园路", "新安街道", "民治大道", "人民南路", "海景路"]
      const sources = ["链家", "贝壳", "安居客", "房天下", "官方备案"]
      const mockResults: MatchCase[] = Array.from({ length: Math.floor(Math.random() * 6) + 5 }, (_, i) => {
        const sim = Math.max(form.minSimilarity[0], Math.floor(Math.random() * (100 - form.minSimilarity[0]) + form.minSimilarity[0]))
        const areaVar = Number(form.area) + Math.floor(Math.random() * 30 - 15)
        const priceVar = base + Math.floor(Math.random() * 10000 - 5000)
        const reasons = sim > 90 ? ["面积高度相似", "同区域楼盘", "楼层相近"] : sim > 80 ? ["面积相近", "同行政区"] : ["物业类型相同", "价格区间相近"]
        return {
          id: i + 1, address: `${form.district}${roads[Math.floor(Math.random() * roads.length)]}${Math.floor(Math.random() * 200) + 1}号`,
          area: areaVar, floor: `${Math.floor(Math.random() * 30) + 1}/${Math.floor(Math.random() * 10) + 25}`,
          totalPrice: Math.floor(areaVar * priceVar), unitPrice: priceVar,
          dealDate: `202${Math.floor(Math.random() * 2) + 4}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
          similarity: sim, source: sources[Math.floor(Math.random() * sources.length)],
          propertyType: form.propertyType, matchReasons: reasons,
        }
      }).sort((a, b) => b.similarity - a.similarity)
      setResults(mockResults); setLoading(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600 text-white"><GitCompare className="h-5 w-5" /></div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI 案例匹配</h1>
          <p className="text-muted-foreground text-sm">智能匹配相似成交案例，支持设置匹配范围和相似度阈值</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Search className="h-4 w-4 text-cyan-600" />匹配条件</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5"><Label className="text-xs">目标区域</Label>
              <Select value={form.district} onValueChange={v => setForm(f => ({ ...f, district: v }))}><SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger><SelectContent>{DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">建筑面积(㎡)</Label><Input type="number" className="h-8 text-sm" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label className="text-xs">物业类型</Label>
              <Select value={form.propertyType} onValueChange={v => setForm(f => ({ ...f, propertyType: v }))}><SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger><SelectContent>{PROPERTY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">搜索半径(km)</Label>
              <Select value={form.radius} onValueChange={v => setForm(f => ({ ...f, radius: v }))}><SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0.5">0.5 km</SelectItem><SelectItem value="1">1 km</SelectItem><SelectItem value="2">2 km</SelectItem><SelectItem value="5">5 km</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><Label className="text-xs">最低相似度</Label><span className="text-xs font-medium text-cyan-600">{form.minSimilarity[0]}%</span></div>
              <Slider value={form.minSimilarity} onValueChange={v => setForm(f => ({ ...f, minSimilarity: v }))} min={50} max={95} step={5} className="w-full" />
            </div>
            <Button onClick={handleMatch} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700">
              {loading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />匹配中...</> : <><Search className="h-4 w-4 mr-2" />开始匹配</>}
            </Button>
          </CardContent>
        </Card>
        <div className="lg:col-span-2 space-y-4">
          {!results.length && !loading && (
            <Card><CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground"><GitCompare className="h-12 w-12 mb-4 opacity-20" /><p className="text-sm">设置匹配条件后点击「开始匹配」</p></CardContent></Card>
          )}
          {loading && (
            <Card><CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground"><RefreshCw className="h-10 w-10 mb-4 animate-spin text-cyan-600" /><p className="text-sm font-medium">AI 正在检索相似案例...</p></CardContent></Card>
          )}
          {results.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">共找到 <span className="font-medium text-foreground">{results.length}</span> 个相似案例</p>
                <Badge variant="outline" className="text-cyan-600 border-cyan-200">相似度 ≥ {form.minSimilarity[0]}%</Badge>
              </div>
              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-xs pl-4">相似度</TableHead><TableHead className="text-xs">地址</TableHead>
                    <TableHead className="text-xs">面积(㎡)</TableHead><TableHead className="text-xs">楼层</TableHead>
                    <TableHead className="text-xs">单价(元/㎡)</TableHead><TableHead className="text-xs">总价(万)</TableHead>
                    <TableHead className="text-xs">成交日期</TableHead><TableHead className="text-xs">来源</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {results.map(r => (
                      <TableRow key={r.id} className={`cursor-pointer ${selected?.id === r.id ? "bg-cyan-50" : "hover:bg-muted/50"}`} onClick={() => setSelected(selected?.id === r.id ? null : r)}>
                        <TableCell className="pl-4"><div className="flex items-center gap-1"><Star className={`h-3 w-3 ${r.similarity >= 90 ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} /><span className={`text-xs font-bold ${r.similarity >= 90 ? "text-green-600" : r.similarity >= 80 ? "text-cyan-600" : "text-muted-foreground"}`}>{r.similarity}%</span></div></TableCell>
                        <TableCell className="text-xs max-w-[120px] truncate">{r.address}</TableCell>
                        <TableCell className="text-xs">{r.area}</TableCell><TableCell className="text-xs">{r.floor}</TableCell>
                        <TableCell className="text-xs font-medium">{r.unitPrice.toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{(r.totalPrice / 10000).toFixed(1)}</TableCell>
                        <TableCell className="text-xs">{r.dealDate}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{r.source}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent></Card>
              {selected && (
                <Card className="border-cyan-200 bg-cyan-50/30">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-cyan-700">案例详情</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[{ icon: MapPin, label: "地址", value: selected.address }, { icon: Home, label: "面积/楼层", value: `${selected.area}㎡ / ${selected.floor}层` }, { icon: DollarSign, label: "成交单价", value: `${selected.unitPrice.toLocaleString()} 元/㎡` }, { icon: Calendar, label: "成交日期", value: selected.dealDate }].map(item => (
                        <div key={item.label} className="flex items-start gap-2"><item.icon className="h-4 w-4 text-cyan-600 mt-0.5 shrink-0" /><div><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-sm font-medium">{item.value}</p></div></div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t"><p className="text-xs text-muted-foreground mb-1.5">匹配原因</p><div className="flex gap-2 flex-wrap">{selected.matchReasons.map((r, i) => <Badge key={i} variant="secondary" className="text-xs">{r}</Badge>)}</div></div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
