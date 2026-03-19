"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart3,
  Play,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
} from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

const SAMPLE_DATA = `深南大道1号,120,15,30,8
福田区福华路2号,88,5,18,12
南山区科技园3号,150,20,33,5
宝安区新安街道4号,65,3,7,15
龙华区民治街道5号,95,8,18,10`

export default function BatchValuationPage() {
  const { toast } = useToast()
  const [cityId, setCityId] = useState("1")
  const [csvText, setCsvText] = useState(SAMPLE_DATA)
  const [threshold, setThreshold] = useState("15")
  const [result, setResult] = useState<any>(null)

  const batchMutation = trpc.valuationAlerts.batchStressTest.useMutation({
    onSuccess: (data) => {
      setResult(data)
      toast({
        title: "压力测试完成",
        description: `成功 ${data.successCount} 条，失败 ${data.failCount} 条，耗时 ${data.elapsed}ms`,
      })
    },
    onError: (err: any) => toast({ title: "测试失败", description: err.message, variant: "destructive" }),
  })

  const parseCSV = () => {
    const lines = csvText.trim().split("\n").filter(l => l.trim())
    const items: any[] = []
    const errors: string[] = []

    lines.forEach((line, idx) => {
      const parts = line.split(",").map(s => s.trim())
      if (parts.length < 4) {
        errors.push(`第 ${idx + 1} 行格式错误（需要：地址,面积,楼层,总楼层[,楼龄]）`)
        return
      }
      const [address, area, floor, totalFloors, buildingAge] = parts
      if (!address || isNaN(Number(area)) || isNaN(Number(floor)) || isNaN(Number(totalFloors))) {
        errors.push(`第 ${idx + 1} 行数据无效`)
        return
      }
      items.push({
        address,
        area: Number(area),
        floor: Number(floor),
        totalFloors: Number(totalFloors),
        buildingAge: buildingAge ? Number(buildingAge) : 10,
        propertyType: "residential",
      })
    })

    return { items, errors }
  }

  const handleRun = () => {
    if (!cityId || isNaN(Number(cityId))) {
      toast({ title: "请输入有效的城市 ID", variant: "destructive" })
      return
    }
    const { items, errors } = parseCSV()
    if (errors.length > 0) {
      toast({ title: "数据格式错误", description: errors.join("\n"), variant: "destructive" })
      return
    }
    if (items.length === 0) {
      toast({ title: "请输入至少一条数据", variant: "destructive" })
      return
    }
    batchMutation.mutate({
      cityId: Number(cityId),
      items,
      deviationThreshold: Number(threshold) / 100,
    })
  }

  const handleExport = () => {
    if (!result) return
    const rows = [["地址", "面积(㎡)", "楼层", "总楼层", "估价(元)", "单价(元/㎡)", "状态"]]
    result.results.forEach((r: any) => {
      rows.push([r.address, r.area, r.floor, r.totalFloors, r.estimatedValue ?? "—", r.unitPrice ?? "—", r.status === "success" ? "成功" : "失败"])
    })
    const csv = rows.map(r => r.join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `批量估价结果_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "-")}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">批量估价压力测试</h1>
        <p className="text-muted-foreground">批量对房产进行 AVM 自动估价，统计分布并识别异常值</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 输入区 */}
        <Card>
          <CardHeader>
            <CardTitle>输入数据</CardTitle>
            <CardDescription>
              每行一条记录，格式：地址,面积,楼层,总楼层[,楼龄]
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>城市 ID</Label>
                <Input
                  type="number"
                  placeholder="如：1"
                  value={cityId}
                  onChange={e => setCityId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>异常偏差阈值 (%)</Label>
                <Input
                  type="number"
                  placeholder="15"
                  value={threshold}
                  onChange={e => setThreshold(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>房产数据（CSV 格式）</Label>
              <Textarea
                rows={10}
                className="font-mono text-sm"
                placeholder="地址,面积,楼层,总楼层,楼龄"
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                示例：深南大道1号,120,15,30,8（最多 100 条）
              </p>
            </div>
            <Button
              className="w-full"
              onClick={handleRun}
              disabled={batchMutation.isPending}
            >
              {batchMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />正在估价...</>
              ) : (
                <><Play className="h-4 w-4 mr-2" />开始批量估价</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 统计摘要 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              统计摘要
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mb-4 opacity-30" />
                <p>运行测试后查看统计结果</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">成功</p>
                    <p className="text-2xl font-bold text-green-600">{result.successCount}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">失败</p>
                    <p className="text-2xl font-bold text-red-600">{result.failCount}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">异常值</p>
                    <p className="text-2xl font-bold text-orange-600">{result.outlierCount}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">耗时</p>
                    <p className="text-2xl font-bold">{result.elapsed}ms</p>
                  </div>
                </div>
                {result.stats && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">平均单价</span>
                      <span className="font-medium">{result.stats.avgUnitPrice?.toLocaleString()} 元/㎡</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">最低估价</span>
                      <span className="font-medium">{(result.stats.min / 10000).toFixed(0)} 万元</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">中位数</span>
                      <span className="font-medium">{(result.stats.median / 10000).toFixed(0)} 万元</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">最高估价</span>
                      <span className="font-medium">{(result.stats.max / 10000).toFixed(0)} 万元</span>
                    </div>
                  </div>
                )}
                {result.outliers?.length > 0 && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                    <p className="text-sm font-medium text-orange-700 mb-2">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      异常值 ({result.outliers.length} 条)
                    </p>
                    {result.outliers.slice(0, 3).map((o: any, i: number) => (
                      <p key={i} className="text-xs text-orange-600 truncate">
                        {o.address}：偏差 {o.deviation}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 详细结果 */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>详细结果</CardTitle>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                导出 CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>地址</TableHead>
                  <TableHead>面积</TableHead>
                  <TableHead>楼层</TableHead>
                  <TableHead>估价</TableHead>
                  <TableHead>单价</TableHead>
                  <TableHead>参考案例</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.results.map((r: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="max-w-[180px] truncate">{r.address}</TableCell>
                    <TableCell className="text-sm">{r.area} ㎡</TableCell>
                    <TableCell className="text-sm">{r.floor}/{r.totalFloors}</TableCell>
                    <TableCell className="font-medium">
                      {r.estimatedValue ? `${(r.estimatedValue / 10000).toFixed(0)} 万` : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.unitPrice ? `${r.unitPrice.toLocaleString()} 元/㎡` : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.comparableCount ? `${r.comparableCount} 条` : "—"}
                    </TableCell>
                    <TableCell>
                      {r.status === "success" ? (
                        <Badge variant="outline" className="text-green-600 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />成功
                        </Badge>
                      ) : r.status === "no_data" ? (
                        <Badge variant="secondary" className="text-xs">无数据</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          <XCircle className="h-3 w-3 mr-1" />失败
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
