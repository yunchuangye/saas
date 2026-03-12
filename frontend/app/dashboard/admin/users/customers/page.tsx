"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Search, MoreHorizontal, Eye, Ban, User, CheckCircle } from "lucide-react"

const customers = [
  {
    id: 1,
    name: "张先生",
    phone: "138****5555",
    email: "zhang***@gmail.com",
    applications: 3,
    lastActive: "2024-03-10",
    status: "正常",
    registerDate: "2023-06-15",
  },
  {
    id: 2,
    name: "李女士",
    phone: "139****6666",
    email: "li***@163.com",
    applications: 2,
    lastActive: "2024-03-08",
    status: "正常",
    registerDate: "2023-08-20",
  },
  {
    id: 3,
    name: "王先生",
    phone: "137****7777",
    email: "wang***@qq.com",
    applications: 1,
    lastActive: "2024-03-05",
    status: "正常",
    registerDate: "2024-01-10",
  },
  {
    id: 4,
    name: "赵女士",
    phone: "136****8888",
    email: "zhao***@gmail.com",
    applications: 0,
    lastActive: "2024-02-28",
    status: "已禁用",
    registerDate: "2023-12-05",
  },
]

const statusColors: Record<string, string> = {
  "正常": "bg-success/10 text-success",
  "已禁用": "bg-destructive/10 text-destructive",
}

export default function AdminCustomersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<typeof customers[0] | null>(null)

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.includes(searchQuery) ||
      customer.phone.includes(searchQuery) ||
      customer.email.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">个人用户管理</h1>
          <p className="text-muted-foreground">管理平台注册的个人用户</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>用户列表</CardTitle>
              <CardDescription>共 {filteredCustomers.length} 位个人用户</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索用户..."
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
                <TableHead>用户名称</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>申请数</TableHead>
                <TableHead>最后活跃</TableHead>
                <TableHead>注册日期</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="text-xs">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{customer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.applications}</TableCell>
                  <TableCell>{customer.lastActive}</TableCell>
                  <TableCell>{customer.registerDate}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[customer.status]}>
                      {customer.status}
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
                          setSelectedCustomer(customer)
                          setIsViewDialogOpen(true)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Ban className="mr-2 h-4 w-4" />
                          禁用账号
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
            <DialogTitle>用户详情</DialogTitle>
            <DialogDescription>查看个人用户的详细信息</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedCustomer.name}</h3>
                  <Badge variant="secondary" className={statusColors[selectedCustomer.status]}>
                    {selectedCustomer.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">手机号</p>
                  <p className="font-medium">{selectedCustomer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">邮箱</p>
                  <p className="font-medium">{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">申请数</p>
                  <p className="font-medium">{selectedCustomer.applications} 个</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">最后活跃</p>
                  <p className="font-medium">{selectedCustomer.lastActive}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">注册日期</p>
                  <p className="font-medium">{selectedCustomer.registerDate}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            {selectedCustomer?.status === "已禁用" ? (
              <Button variant="outline">
                <CheckCircle className="mr-2 h-4 w-4" />
                解除禁用
              </Button>
            ) : (
              <Button variant="destructive">
                <Ban className="mr-2 h-4 w-4" />
                禁用账号
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
