"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, Brain, RefreshCw, ArrowUp, ArrowDown, Minus, BarChart3, MapPin, Home } from "lucide-react"

const DISTRICTS = ["福田区", "南山区", "宝安区", "龙华区", "罗湖区", "盐田区", "光明区", "坪山区", "大鹏新区", "龙岗区"]
const PROPERTY_TYPES = ["住宅", "商业", "办公", "工业", "综合"]

type PredictResult = {
  currentPrice: number; predict3m: number; predict6m: number; predict12m: number
  trend: "up" | "down" | "flat"; confidence: number
  factors: { name: string; impact: "positive" | "negative" | "neutral"; weight: number; desc: string }[]
  comparables: { address: string; area: number; price: number; date: string; similarity: number }[]
}

export default function AIPredictPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictResult | null>(null)
  const [form, setForm] = useState({ district: "福田区", estate: "", area: "100", floor: "15", totalFloors: "30", propertyType: "住宅", buildYear: "2015" })

  const handlePredict = () => {
    if (!form.estate || !form.area) return
    setLoading(true); setResult(null)
    setTimeout(() => {
      const base = Math.floor(Math.random() * 30000 + 60000)
      const trend = Math.random() > 0.4 ? "up" : Math.random() > 0.5 ? "down" : "flat"
      const d3 = trend === "up" ? 1.02 + Math.random() * 0.03 : trend === "down" ? 0.97 - Math.random() * 0.02 : 1.0
      const d6 = trend === "up" ? 1.04 + Math.random() * 0.05 : trend === "down" ? 0.94 - Math.random() * 0.03 : 1.0
      const d12 = trend === "up" ? 1.08 + Math.random() * 0.08 : trend === "down" ? 0.90 - Math.random() * 0.05 : 1.0
      setResult({
        currentPrice: base, predict3m: Math.floor(base * d3), predict6m: Math.floor(base * d6), predict12m: Math.floor(base * d12),
        trend: trend as "up" | "down" | "flat", confidence: Math.floor(Math.random() * 15 + 78),
        factors: [
          { name: "地段价值", impact: "positive", weight: 85, desc: `${form.district}核心区域，交通配套完善` },
          { name: "楼层溢价", impact: Number(form.floor) > Number(form.totalFloors) * 0.6 ? "positive" : "neutral", weight: 72, desc: `${form.floor}/${form.totalFloors}层，采光视野良好` },
          { name: "房龄折旧", impact: Number(form.buildYear) < 2010 ? "negative" : "neutral", weight: 60, desc: `建于${form.buildYear}年，房龄${2026 - Number(form.buildYear)}年` },
          { name: "市场供需", impact: trend === "up" ? "positive" : "negative", weight: 78, desc: trend === "up" ? "区域供应偏紧，需求旺盛" : "市场供应充足，竞争激烈" },
          { name: "政策环境", impact: "neutral", weight: 65, desc: "当前限购政策稳定，无重大变化" },
          { name: "学区配套", impact: "positive", weight: 70, desc: "周边优质学校资源丰富" },
        ],
        comparables: [
          { address: `${form.district}${form.estate}附近A盘`, area: Number(form.area) + Math.floor(Math.random() * 20 - 10), price: base + Math.floor(Math.random() * 5000 - 2500), date: "2026-02-15", similarity: 94 },
          { address: `${form.district}${form.estate}附近B盘`, area: Number(form.area) + Math.floor(Math.random() * 20 - 10), price: base + Math.floor(Math.random() * 8000 - 4000), date: "2026-01-28", similarity: 88 },
          { address: `${form.district}${form.estate}附近C盘`, area: Number(form.area) + Math.floor(Math.random() * 30 - 15), price: base + Math.floor(Math.random() * 10000 - 5000), date: "2025-12-20", similarity: 82 },
          { address: `${form.district}${form.estate}附近D盘`, area: Number(form.area) + Math.floor(Math.random() * 30 - 15), price: base + Math.floor(Math.random() * 12000 - 6000), date: "2025-11-10", similarity: 76 },
        ],
      })
      setLoading(false)
    }, 1800)
  }

  const TrendIcon = result?.trend === "up" ? ArrowUp : result?.trend === "down" ? ArrowDown : Minus
  const trendColor = result?.trend === "up" ? "text-green-600" : result?.trend === "down" ? "text-red-500" : "text-yellow-500"
  const trendLabel = result?.trend === "up" ? "上涨趋势" : result?.trend === "down" ? "下跌趋势" : "平稳趋势"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600 text-white"><TrendingUp className="h-5 w-5" /></div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI 价格预测</h1>
          <p className="text-muted-foreground text-sm">输入房屋信息，AI 预测未来价格走势及影响因素分析</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Home className="h-4 w-4 text-violet-600" />房屋信息</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5"><Label className="text-xs">所在区域</Label>
              <Select value={form.district} onValueChange={v => setForm(f => ({ ...f, district: v }))}><SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger><SelectContent>{DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">楼盘名称 *</Label><Input className="h-8 text-sm" placeholder="如：华润城" value={form.estate} onChange={e => setForm(f => ({ ...f, estate: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">建筑面积(㎡) *</Label><Input type="number" className="h-8 text-sm" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">物业类型</Label>
                <Select value={form.propertyType} onValueChange={v => setForm(f => ({ ...f, propertyType: v }))}><SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger><SelectContent>{PROPERTY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">所在楼层</Label><Input type="number" className="h-8 text-sm" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">总楼层</Label><Input type="number" className="h-8 text-sm" value={form.totalFloors} onChange={e => setForm(f => ({ ...f, totalFloors: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">建成年份</Label><Input type="number" className="h-8 text-sm" value={form.buildYear} onChange={e => setForm(f => ({ ...f, buildYear: e.target.value }))} /></div>
            <Button onClick={handlePredict} disabled={loading || !form.estate || !form.area} className="w-full bg-violet-600 hover:bg-violet-700">
              {loading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />预测中...</> : <><Brain className="h-4 w-4 mr-2" />开始预测</>}
            </Button>
          </CardContent>
        </Card>
        <div className="lg:col-span-2 space-y-4">
          {!result && !loading && (
            <Card><CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground"><TrendingUp className="h-12 w-12 mb-4 opacity-20" /><p className="text-sm">填写左侧房屋信息后点击「开始预测」</p></CardContent></Card>
          )}
          {loading && (
            <Card><CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground"><RefreshCw className="h-10 w-10 mb-4 animate-spin text-violet-600" /><p className="text-sm font-medium">AI 模型分析中...</p><p className="text-xs mt-1">正在匹配历史案例，计算价格趋势</p></CardContent></Card>
          )}
          {result && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[{ label: "当前估价", value: result.currentPrice, sub: "元/㎡", hl: false }, { label: "3个月后", value: result.predict3m, sub: `${((result.predict3m / result.currentPrice - 1) * 100).toFixed(1)}%`, hl: true }, { label: "6个月后", value: result.predict6m, sub: `${((result.predict6m / result.currentPrice - 1) * 100).toFixed(1)}%`, hl: true }, { label: "12个月后", value: result.predict12m, sub: `${((result.predict12m / result.currentPrice - 1) * 100).toFixed(1)}%`, hl: true }].map(item => (
                  <Card key={item.label} className={item.hl ? "border-violet-200 bg-violet-50/50" : ""}><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-xl font-bold mt-1">{item.value.toLocaleString()}</p><p className={`text-xs mt-0.5 ${item.hl ? trendColor : "text-muted-foreground"}`}>{item.sub}</p></CardContent></Card>
                ))}
              </div>
              <Card><CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><TrendIcon className={`h-8 w-8 ${trendColor}`} /><div><p className={`text-lg font-bold ${trendColor}`}>{trendLabel}</p><p className="text-xs text-muted-foreground">预测置信度 {result.confidence}%</p></div></div>
                  <Badge variant="outline" className="text-violet-600 border-violet-200">AI 预测</Badge>
                </div>
              </CardContent></Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4 text-violet-600" />影响因素分析</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {result.factors.map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-20 shrink-0"><p className="text-xs font-medium">{f.name}</p><Badge variant={f.impact === "positive" ? "default" : f.impact === "negative" ? "destructive" : "secondary"} className="text-xs mt-0.5">{f.impact === "positive" ? "利好" : f.impact === "negative" ? "利空" : "中性"}</Badge></div>
                      <div className="flex-1"><div className="h-2 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${f.impact === "positive" ? "bg-green-500" : f.impact === "negative" ? "bg-red-500" : "bg-yellow-400"}`} style={{ width: `${f.weight}%` }} /></div></div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{f.weight}%</span>
                      <p className="text-xs text-muted-foreground flex-1 hidden lg:block">{f.desc}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><MapPin className="h-4 w-4 text-violet-600" />参考成交案例</CardTitle></CardHeader>
                <CardContent>
                  <Table><TableHeader><TableRow><TableHead className="text-xs">地址</TableHead><TableHead className="text-xs">面积(㎡)</TableHead><TableHead className="text-xs">单价(元/㎡)</TableHead><TableHead className="text-xs">成交日期</TableHead><TableHead className="text-xs">相似度</TableHead></TableRow></TableHeader>
                    <TableBody>{result.comparables.map((c, i) => (<TableRow key={i}><TableCell className="text-xs">{c.address}</TableCell><TableCell className="text-xs">{c.area}</TableCell><TableCell className="text-xs font-medium">{c.price.toLocaleString()}</TableCell><TableCell className="text-xs">{c.date}</TableCell><TableCell><Badge variant="outline" className="text-xs text-violet-600 border-violet-200">{c.similarity}%</Badge></TableCell></TableRow>))}</TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
