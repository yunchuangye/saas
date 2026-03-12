"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Search, Plus, MoreHorizontal, Eye, Ban, CheckCircle, Building2 } from "lucide-react"

const appraisers = [
  {
    id: 1,
    name: "华信评估有限公司",
    contact: "王经理",
    phone: "138****8888",
    projects: 68,
    rating: 4.8,
    status: "正常",
    joinDate: "2023-01-15",
  },
  {
    id: 2,
    name: "中房评估有限公司",
    contact: "李经理",
    phone: "139****9999",
    projects: 55,
    rating: 4.6,
    status: "正常",
    joinDate: "2023-02-20",
  },
  {
    id: 3,
    name: "正信评估有限公司",
    contact: "张经理",
    phone: "137****7777",
    projects: 48,
    rating: 4.5,
    status: "正常",
    joinDate: "2023-03-10",
  },
  {
    id: 4,
    name: "同信评估有限公司",
    contact: "赵经理",
    phone: "136****6666",
    projects: 42,
    rating: 4.7,
    status: "审核中",
    joinDate: "2024-03-01",
  },
]

const statusColors: Record<string, string> = {
  "正常": "bg-success/10 text-success",
  "审核中": "bg-warning/10 text-warning",
  "已停用": "bg-destructive/10 text-destructive",
}

export default function AdminAppraisersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedAppraiser, setSelectedAppraiser] = useState<typeof appraisers[0] | null>(null)

  const filteredAppraisers = appraisers.filter(
    (appraiser) =>
      appraiser.name.includes(searchQuery) ||
      appraiser.contact.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">评估公司管理</h1>
          <p className="text-muted-foreground">管理平台入驻的评估公司</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              添加公司
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>添加评估公司</DialogTitle>
              <DialogDescription>
                填写评估公司的基本信息，审核通过后将入驻平台
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">公司名称</Label>
                  <Input id="company-name" placeholder="请输入公司全称" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">营业执照号</Label>
                  <Input id="license" placeholder="请输入营业执照号" />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">电子邮箱</Label>
                  <Input id="email" type="email" placeholder="请输入邮箱地址" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qualification">资质等级</Label>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择资质等级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">一级资质</SelectItem>
                      <SelectItem value="B">二级资质</SelectItem>
                      <SelectItem value="C">三级资质</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">公司地址</Label>
                <Input id="address" placeholder="请输入详细地址" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">公司简介</Label>
                <Textarea id="description" placeholder="请简要描述公司情况" rows={3} />
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
              <CardTitle>公司列表</CardTitle>
              <CardDescription>共 {filteredAppraisers.length} 家评估公司</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索公司..."
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
                <TableHead>公司名称</TableHead>
                <TableHead>联系人</TableHead>
                <TableHead>联系电话</TableHead>
                <TableHead>完成项目</TableHead>
                <TableHead>评分</TableHead>
                <TableHead>入驻日期</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppraisers.map((appraiser) => (
                <TableRow key={appraiser.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="text-xs">
                          <Building2 className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{appraiser.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{appraiser.contact}</TableCell>
                  <TableCell>{appraiser.phone}</TableCell>
                  <TableCell>{appraiser.projects}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-warning">★</span>
                      {appraiser.rating}
                    </div>
                  </TableCell>
                  <TableCell>{appraiser.joinDate}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[appraiser.status]}>
                      {appraiser.status}
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
                          setSelectedAppraiser(appraiser)
                          setIsViewDialogOpen(true)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          通过审核
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
            <DialogTitle>公司详情</DialogTitle>
            <DialogDescription>查看评估公司的详细信息</DialogDescription>
          </DialogHeader>
          {selectedAppraiser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>
                    <Building2 className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedAppraiser.name}</h3>
                  <Badge variant="secondary" className={statusColors[selectedAppraiser.status]}>
                    {selectedAppraiser.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">联系人</p>
                  <p className="font-medium">{selectedAppraiser.contact}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">联系电话</p>
                  <p className="font-medium">{selectedAppraiser.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">完成项目</p>
                  <p className="font-medium">{selectedAppraiser.projects} 个</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">评分</p>
                  <p className="font-medium flex items-center gap-1">
                    <span className="text-warning">★</span>
                    {selectedAppraiser.rating}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">入驻日期</p>
                  <p className="font-medium">{selectedAppraiser.joinDate}</p>
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
