"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Search, Plus, MoreHorizontal, Eye, Ban, TrendingUp } from "lucide-react"

const investors = [
  {
    id: 1,
    name: "华润资本投资有限公司",
    type: "私募基金",
    contact: "陈总监",
    phone: "138****5551",
    projects: 28,
    status: "正常",
    joinDate: "2023-03-15",
  },
  {
    id: 2,
    name: "深创投集团",
    type: "创投机构",
    contact: "李总",
    phone: "139****5552",
    projects: 42,
    status: "正常",
    joinDate: "2023-04-20",
  },
  {
    id: 3,
    name: "红杉资本中国基金",
    type: "风险投资",
    contact: "王合伙人",
    phone: "137****5553",
    projects: 35,
    status: "正常",
    joinDate: "2023-05-10",
  },
  {
    id: 4,
    name: "高瓴资本管理有限公司",
    type: "私募基金",
    contact: "张总监",
    phone: "136****5554",
    projects: 52,
    status: "正常",
    joinDate: "2023-02-08",
  },
  {
    id: 5,
    name: "IDG资本",
    type: "风险投资",
    contact: "刘总",
    phone: "135****5555",
    projects: 18,
    status: "审核中",
    joinDate: "2024-03-01",
  },
]

const statusColors: Record<string, string> = {
  "正常": "bg-success/10 text-success",
  "审核中": "bg-warning/10 text-warning",
  "已停用": "bg-destructive/10 text-destructive",
}

const typeColors: Record<string, string> = {
  "私募基金": "bg-blue-500/10 text-blue-600",
  "创投机构": "bg-purple-500/10 text-purple-600",
  "风险投资": "bg-orange-500/10 text-orange-600",
  "资产管理": "bg-green-500/10 text-green-600",
}

export default function AdminInvestorsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedInvestor, setSelectedInvestor] = useState<typeof investors[0] | null>(null)

  const filteredInvestors = investors.filter(
    (investor) =>
      investor.name.includes(searchQuery) ||
      investor.type.includes(searchQuery) ||
      investor.contact.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">投资机构管理</h1>
          <p className="text-muted-foreground">管理平台合作的投资机构</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              添加机构
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>添加投资机构</DialogTitle>
              <DialogDescription>
                填写投资机构的基本信息，审核通过后将入驻平台
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="investor-name">机构名称</Label>
                  <Input id="investor-name" placeholder="请输入机构全称" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="investor-type">机构类型</Label>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pe">私募基金</SelectItem>
                      <SelectItem value="vc">风险投资</SelectItem>
                      <SelectItem value="cv">创投机构</SelectItem>
                      <SelectItem value="am">资产管理</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">所在地区</Label>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择地区" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beijing">北京市</SelectItem>
                      <SelectItem value="shanghai">上海市</SelectItem>
                      <SelectItem value="guangzhou">广州市</SelectItem>
                      <SelectItem value="shenzhen">深圳市</SelectItem>
                      <SelectItem value="hangzhou">杭州市</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">营业执照号</Label>
                  <Input id="license" placeholder="请输入营业执照号" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fund-scale">管理规模</Label>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择规模" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">1亿以下</SelectItem>
                      <SelectItem value="medium">1-10亿</SelectItem>
                      <SelectItem value="large">10-50亿</SelectItem>
                      <SelectItem value="xlarge">50亿以上</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="focus">投资领域</Label>
                  <Input id="focus" placeholder="如：房地产、科技等" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact">联系人</Label>
                  <Input id="contact" placeholder="请输入联系人姓名" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">联系电话</Label>
                  <Input id="phone" placeholder="请输入联系电话" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">电子邮箱</Label>
                <Input id="email" type="email" placeholder="请输入邮箱地址" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">办公地址</Label>
                <Input id="address" placeholder="请输入详细地址" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={() => setIsAddDialogOpen(false)}>提交审核</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>投资机构列表</CardTitle>
              <CardDescription>共 {filteredInvestors.length} 家投资机构</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索机构..."
                className="pl-8 w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>机构名称</TableHead>
                <TableHead>机构类型</TableHead>
                <TableHead>联系人</TableHead>
                <TableHead>联系电话</TableHead>
                <TableHead>发起项目</TableHead>
                <TableHead>入驻日期</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvestors.map((investor) => (
                <TableRow key={investor.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          <TrendingUp className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{investor.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={typeColors[investor.type] || "bg-muted"}>
                      {investor.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{investor.contact}</TableCell>
                  <TableCell>{investor.phone}</TableCell>
                  <TableCell>{investor.projects}</TableCell>
                  <TableCell>{investor.joinDate}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[investor.status]}>
                      {investor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedInvestor(investor)
                          setIsViewDialogOpen(true)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Ban className="mr-2 h-4 w-4" />
                          停用账号
                        </DropdownMenuItem>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>机构详情</DialogTitle>
            <DialogDescription>查看投资机构的详细信息</DialogDescription>
          </DialogHeader>
          {selectedInvestor && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <TrendingUp className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedInvestor.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className={typeColors[selectedInvestor.type] || "bg-muted"}>
                      {selectedInvestor.type}
                    </Badge>
                    <Badge variant="secondary" className={statusColors[selectedInvestor.status]}>
                      {selectedInvestor.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">联系人</p>
                  <p className="font-medium">{selectedInvestor.contact}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">联系电话</p>
                  <p className="font-medium">{selectedInvestor.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">发起项目</p>
                  <p className="font-medium">{selectedInvestor.projects} 个</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">入驻日期</p>
                  <p className="font-medium">{selectedInvestor.joinDate}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
