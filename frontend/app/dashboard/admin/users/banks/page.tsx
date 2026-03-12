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
import { Search, Plus, MoreHorizontal, Eye, Ban, Landmark } from "lucide-react"

const banks = [
  {
    id: 1,
    name: "中国银行北京分行",
    branch: "朝阳支行",
    contact: "刘主任",
    phone: "138****1111",
    projects: 45,
    status: "正常",
    joinDate: "2023-01-10",
  },
  {
    id: 2,
    name: "工商银行北京分行",
    branch: "海淀支行",
    contact: "王主任",
    phone: "139****2222",
    projects: 38,
    status: "正常",
    joinDate: "2023-02-15",
  },
  {
    id: 3,
    name: "建设银行北京分行",
    branch: "西城支行",
    contact: "张主任",
    phone: "137****3333",
    projects: 32,
    status: "正常",
    joinDate: "2023-03-20",
  },
  {
    id: 4,
    name: "农业银行北京分行",
    branch: "丰台支行",
    contact: "李主任",
    phone: "136****4444",
    projects: 28,
    status: "审核中",
    joinDate: "2024-03-05",
  },
]

const statusColors: Record<string, string> = {
  "正常": "bg-success/10 text-success",
  "审核中": "bg-warning/10 text-warning",
  "已停用": "bg-destructive/10 text-destructive",
}

export default function AdminBanksPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedBank, setSelectedBank] = useState<typeof banks[0] | null>(null)

  const filteredBanks = banks.filter(
    (bank) =>
      bank.name.includes(searchQuery) ||
      bank.branch.includes(searchQuery) ||
      bank.contact.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">银行机构管理</h1>
          <p className="text-muted-foreground">管理平台合作的银行机构</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              添加银行
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>添加银行机构</DialogTitle>
              <DialogDescription>
                填写银行机构的基本信息，审核通过后将入驻平台
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank-name">银行名称</Label>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择银行" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boc">中国银行</SelectItem>
                      <SelectItem value="icbc">工商银行</SelectItem>
                      <SelectItem value="ccb">建设银行</SelectItem>
                      <SelectItem value="abc">农业银行</SelectItem>
                      <SelectItem value="cmb">招商银行</SelectItem>
                      <SelectItem value="other">其他银行</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">支行名称</Label>
                  <Input id="branch" placeholder="请输入支行名称" />
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
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-code">银行代码</Label>
                  <Input id="bank-code" placeholder="请输入银行代码" />
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
                <Label htmlFor="address">详细地址</Label>
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
              <CardTitle>银行列表</CardTitle>
              <CardDescription>共 {filteredBanks.length} 家银行机构</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索银行..."
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
                <TableHead>银行名称</TableHead>
                <TableHead>支行</TableHead>
                <TableHead>联系人</TableHead>
                <TableHead>联系电话</TableHead>
                <TableHead>发起项目</TableHead>
                <TableHead>入驻日期</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBanks.map((bank) => (
                <TableRow key={bank.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="text-xs">
                          <Landmark className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{bank.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{bank.branch}</TableCell>
                  <TableCell>{bank.contact}</TableCell>
                  <TableCell>{bank.phone}</TableCell>
                  <TableCell>{bank.projects}</TableCell>
                  <TableCell>{bank.joinDate}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[bank.status]}>
                      {bank.status}
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
                          setSelectedBank(bank)
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
            <DialogTitle>银行详情</DialogTitle>
            <DialogDescription>查看银行机构的详细信息</DialogDescription>
          </DialogHeader>
          {selectedBank && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>
                    <Landmark className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedBank.name}</h3>
                  <p className="text-muted-foreground">{selectedBank.branch}</p>
                  <Badge variant="secondary" className={statusColors[selectedBank.status]}>
                    {selectedBank.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">联系人</p>
                  <p className="font-medium">{selectedBank.contact}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">联系电话</p>
                  <p className="font-medium">{selectedBank.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">发起项目</p>
                  <p className="font-medium">{selectedBank.projects} 个</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">入驻日期</p>
                  <p className="font-medium">{selectedBank.joinDate}</p>
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
