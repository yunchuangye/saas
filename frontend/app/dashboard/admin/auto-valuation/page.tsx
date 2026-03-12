"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Edit,
  Download,
  Calculator,
  Building2,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react"

// 模拟自动估价记录数据
const valuationRecords = [
  {
    id: "AV20240315001",
    bankName: "中国银行朝阳支行",
    bankUser: "张经理",
    propertyAddress: "北京市朝阳区望京SOHO T3-1205",
    propertyArea: 125.5,
    originalPrice: 8250000,
    adjustedPrice: null,
    unitPrice: 65737,
    status: "pending",
    confidence: 88.5,
    applyTime: "2024-03-15 14:30",
    reviewTime: null,
    reviewer: null,
  },
  {
    id: "AV20240315002",
    bankName: "工商银行海淀支行",
    bankUser: "李主管",
    propertyAddress: "北京市海淀区中关村软件园二期8号楼302",
    propertyArea: 98.2,
    originalPrice: 6850000,
    adjustedPrice: 6750000,
    unitPrice: 68737,
    status: "approved",
    confidence: 92.3,
    applyTime: "2024-03-14 10:15",
    reviewTime: "2024-03-14 16:30",
    reviewer: "王审核",
  },
  {
    id: "AV20240314003",
    bankName: "建设银行西城支行",
    bankUser: "赵专员",
    propertyAddress: "北京市西城区金融街购物中心A座1801",
    propertyArea: 156.8,
    originalPrice: 12500000,
    adjustedPrice: null,
    unitPrice: 79719,
    status: "rejected",
    confidence: 75.2,
    applyTime: "2024-03-14 09:00",
    reviewTime: "2024-03-14 11:20",
    reviewer: "王审核",
    rejectReason: "可比案例不足，置信度偏低，建议委托专业评估",
  },
  {
    id: "AV20240313004",
    bankName: "农业银行通州支行",
    bankUser: "钱经理",
    propertyAddress: "北京市通州区万达广场B座605",
    propertyArea: 88.6,
    originalPrice: 4250000,
    adjustedPrice: 4350000,
    unitPrice: 49096,
    status: "approved",
    confidence: 90.1,
    applyTime: "2024-03-13 15:45",
    reviewTime: "2024-03-13 17:30",
    reviewer: "李审核",
  },
  {
    id: "AV20240312005",
    bankName: "招商银行朝阳支行",
    bankUser: "孙主管",
    propertyAddress: "北京市朝阳区国贸中心三期A座2305",
    propertyArea: 210.5,
    originalPrice: 25800000,
    adjustedPrice: null,
    unitPrice: 122565,
    status: "pending",
    confidence: 85.8,
    applyTime: "2024-03-12 11:20",
    reviewTime: null,
    reviewer: null,
  },
]

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  pending: { label: "待审核", variant: "secondary", className: "bg-warning/10 text-warning border-warning/20" },
  approved: { label: "已通过", variant: "secondary", className: "bg-success/10 text-success border-success/20" },
  rejected: { label: "已驳回", variant: "destructive", className: "bg-destructive/10 text-destructive border-destructive/20" },
}

export default function AdminAutoValuationPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<typeof valuationRecords[0] | null>(null)
  const [adjustedPrice, setAdjustedPrice] = useState("")
  const [adjustReason, setAdjustReason] = useState("")
  const [rejectReason, setRejectReason] = useState("")

  const filteredRecords = valuationRecords.filter((record) => {
    const matchesSearch =
      record.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || record.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingCount = valuationRecords.filter((r) => r.status === "pending").length
  const approvedCount = valuationRecords.filter((r) => r.status === "approved").length
  const rejectedCount = valuationRecords.filter((r) => r.status === "rejected").length

  const handleApprove = () => {
    const finalPrice = adjustedPrice ? parseInt(adjustedPrice) : selectedRecord?.originalPrice
    alert(`已通过审核\n报告编号: ${selectedRecord?.id}\n最终估价: ${finalPrice?.toLocaleString()} 元${adjustedPrice ? `\n调整原因: ${adjustReason}` : ""}`)
    setIsReviewDialogOpen(false)
    setAdjustedPrice("")
    setAdjustReason("")
  }

  const handleReject = () => {
    alert(`已驳回\n报告编号: ${selectedRecord?.id}\n驳回原因: ${rejectReason}`)
    setIsReviewDialogOpen(false)
    setRejectReason("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">自动估价管理</h1>
          <p className="text-muted-foreground">
            审核银行用户提交的自动估价申请，可调整估价结果
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总申请数</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{valuationRecords.length}</div>
            <p className="text-xs text-muted-foreground">累计自动估价申请</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审核</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">需要处理的申请</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已通过</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">审核通过的申请</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已驳回</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">未通过的申请</p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>估价记录</CardTitle>
              <CardDescription>管理所有银行用户的自动估价申请</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索编号、银行、地址..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[280px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">待审核</SelectItem>
                  <SelectItem value="approved">已通过</SelectItem>
                  <SelectItem value="rejected">已驳回</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>报告编号</TableHead>
                <TableHead>申请银行</TableHead>
                <TableHead>物业地址</TableHead>
                <TableHead className="text-right">面积(m²)</TableHead>
                <TableHead className="text-right">系统估价</TableHead>
                <TableHead className="text-right">调整后估价</TableHead>
                <TableHead>置信度</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>申请时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono text-sm">{record.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{record.bankName}</p>
                      <p className="text-sm text-muted-foreground">{record.bankUser}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={record.propertyAddress}>
                    {record.propertyAddress}
                  </TableCell>
                  <TableCell className="text-right">{record.propertyArea}</TableCell>
                  <TableCell className="text-right font-medium">
                    {record.originalPrice.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {record.adjustedPrice ? (
                      <span className="font-medium text-primary">
                        {record.adjustedPrice.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div
                        className={`h-2 w-16 rounded-full bg-muted overflow-hidden`}
                      >
                        <div
                          className={`h-full rounded-full ${
                            record.confidence >= 85
                              ? "bg-success"
                              : record.confidence >= 75
                              ? "bg-warning"
                              : "bg-destructive"
                          }`}
                          style={{ width: `${record.confidence}%` }}
                        />
                      </div>
                      <span className="text-sm">{record.confidence.toFixed(1)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusConfig[record.status]?.variant || "secondary"}
                      className={statusConfig[record.status]?.className || ""}
                    >
                      {statusConfig[record.status]?.label || record.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {record.applyTime}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRecord(record)
                            setIsViewDialogOpen(true)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </DropdownMenuItem>
                        {record.status === "pending" && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedRecord(record)
                              setAdjustedPrice("")
                              setAdjustReason("")
                              setRejectReason("")
                              setIsReviewDialogOpen(true)
                            }}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            审核处理
                          </DropdownMenuItem>
                        )}
                        {record.status === "approved" && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedRecord(record)
                              setAdjustedPrice(
                                (record.adjustedPrice || record.originalPrice).toString()
                              )
                              setIsAdjustDialogOpen(true)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            调整价格
                          </DropdownMenuItem>
                        )}
                        {record.status === "approved" && (
                          <DropdownMenuItem
                            onClick={() => {
                              alert(`下载估价报告: ${record.id}`)
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            下载报告
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 查看详情对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>估价报告详情</DialogTitle>
            <DialogDescription>{selectedRecord?.id}</DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calculator className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">自动估价报告</h3>
                    <p className="text-sm text-muted-foreground">{selectedRecord.applyTime}</p>
                  </div>
                </div>
                <Badge
                  variant={statusConfig[selectedRecord.status]?.variant || "secondary"}
                  className={statusConfig[selectedRecord.status]?.className || ""}
                >
                  {statusConfig[selectedRecord.status]?.label || selectedRecord.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm text-muted-foreground">申请银行</p>
                  <p className="font-medium">{selectedRecord.bankName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">申请人</p>
                  <p className="font-medium">{selectedRecord.bankUser}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  物业信息
                </h4>
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">物业地址</p>
                    <p className="font-medium">{selectedRecord.propertyAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">建筑面积</p>
                    <p className="font-medium">{selectedRecord.propertyArea} m²</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">单价</p>
                    <p className="font-medium">{selectedRecord.unitPrice.toLocaleString()} 元/m²</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  估价结果
                </h4>
                <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">系统估价</p>
                    <p className="font-semibold text-lg">
                      {selectedRecord.originalPrice.toLocaleString()} 元
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">调整后估价</p>
                    <p className="font-semibold text-lg text-primary">
                      {selectedRecord.adjustedPrice
                        ? `${selectedRecord.adjustedPrice.toLocaleString()} 元`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">置信度</p>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            selectedRecord.confidence >= 85
                              ? "bg-success"
                              : selectedRecord.confidence >= 75
                              ? "bg-warning"
                              : "bg-destructive"
                          }`}
                          style={{ width: `${selectedRecord.confidence}%` }}
                        />
                      </div>
                      <span className="font-medium">{selectedRecord.confidence.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedRecord.status === "rejected" && selectedRecord.rejectReason && (
                <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <div className="flex items-center gap-2 text-destructive mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">驳回原因</span>
                  </div>
                  <p className="text-sm">{selectedRecord.rejectReason}</p>
                </div>
              )}

              {selectedRecord.reviewTime && (
                <div className="text-sm text-muted-foreground">
                  审核时间: {selectedRecord.reviewTime} | 审核人: {selectedRecord.reviewer}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              关闭
            </Button>
            {selectedRecord?.status === "approved" && (
              <Button
                onClick={() => {
                  alert(`下载估价报告: ${selectedRecord.id}`)
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                下载报告
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 审核对话框 */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>审核自动估价</DialogTitle>
            <DialogDescription>
              审核 {selectedRecord?.bankName} 提交的估价申请
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <Tabs defaultValue="approve" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="approve">通过审核</TabsTrigger>
                <TabsTrigger value="reject">驳回申请</TabsTrigger>
              </TabsList>
              <TabsContent value="approve" className="space-y-4 pt-4">
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">物业地址</p>
                      <p className="font-medium text-sm">{selectedRecord.propertyAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">系统估价</p>
                      <p className="font-semibold text-primary">
                        {selectedRecord.originalPrice.toLocaleString()} 元
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adjusted-price">调整后价格（可选）</Label>
                    <Input
                      id="adjusted-price"
                      type="number"
                      placeholder={`默认: ${selectedRecord.originalPrice.toLocaleString()} 元`}
                      value={adjustedPrice}
                      onChange={(e) => setAdjustedPrice(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      如需调整估价，请输入新的价格；留空则使用系统估价
                    </p>
                  </div>
                  {adjustedPrice && (
                    <div className="space-y-2">
                      <Label htmlFor="adjust-reason">调整原因</Label>
                      <Textarea
                        id="adjust-reason"
                        placeholder="请说明价格调整的原因..."
                        value={adjustReason}
                        onChange={(e) => setAdjustReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleApprove} disabled={adjustedPrice && !adjustReason}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    通过审核
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="reject" className="space-y-4 pt-4">
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">物业地址</p>
                      <p className="font-medium text-sm">{selectedRecord.propertyAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">置信度</p>
                      <p className="font-medium">{selectedRecord.confidence.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reject-reason">驳回原因</Label>
                  <Textarea
                    id="reject-reason"
                    placeholder="请详细说明驳回的原因，以便银行用户了解..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                    取消
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={!rejectReason.trim()}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    驳回申请
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* 调整价格对话框 */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>调整估价</DialogTitle>
            <DialogDescription>
              调整已通过审核的估价结果
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4 py-4">
              <div className="p-4 border rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground mb-1">物业地址</p>
                <p className="font-medium">{selectedRecord.propertyAddress}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">系统估价</p>
                  <p className="font-medium">{selectedRecord.originalPrice.toLocaleString()} 元</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">当前估价</p>
                  <p className="font-semibold text-primary">
                    {(selectedRecord.adjustedPrice || selectedRecord.originalPrice).toLocaleString()} 元
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-price">新估价</Label>
                <Input
                  id="new-price"
                  type="number"
                  placeholder="请输入新的估价金额"
                  value={adjustedPrice}
                  onChange={(e) => setAdjustedPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-reason">调整原因</Label>
                <Textarea
                  id="new-reason"
                  placeholder="请说明价格调整的原因..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                alert(`价格已调整\n报告编号: ${selectedRecord?.id}\n新估价: ${parseInt(adjustedPrice).toLocaleString()} 元\n调整原因: ${adjustReason}`)
                setIsAdjustDialogOpen(false)
                setAdjustedPrice("")
                setAdjustReason("")
              }}
              disabled={!adjustedPrice || !adjustReason.trim()}
            >
              确认调整
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
