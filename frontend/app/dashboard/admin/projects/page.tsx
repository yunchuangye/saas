"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Search, Filter, MoreHorizontal, Eye, AlertCircle } from "lucide-react"

const projects = [
  {
    id: "PRJ-2024-020",
    name: "朝阳区CBD商业综合体评估",
    bank: "中国银行朝阳支行",
    company: "华信评估",
    type: "商业",
    status: "进行中",
    deadline: "2024-03-18",
    amount: "¥68,000",
  },
  {
    id: "PRJ-2024-019",
    name: "海淀区住宅评估",
    bank: "工商银行海淀支行",
    company: "中房评估",
    type: "住宅",
    status: "待审核",
    deadline: "2024-03-15",
    amount: "¥12,000",
  },
  {
    id: "PRJ-2024-018",
    name: "西城区办公楼评估",
    bank: "建设银行西城支行",
    company: "正信评估",
    type: "商业",
    status: "已完成",
    deadline: "2024-03-10",
    amount: "¥45,000",
  },
  {
    id: "PRJ-2024-017",
    name: "丰台区工业厂房评估",
    bank: "农业银行丰台支行",
    company: "同信评估",
    type: "工业",
    status: "已超期",
    deadline: "2024-03-05",
    amount: "¥35,000",
  },
]

const statusColors: Record<string, string> = {
  "竞价中": "bg-info/10 text-info",
  "进行中": "bg-info/10 text-info",
  "待审核": "bg-warning/10 text-warning",
  "已完成": "bg-success/10 text-success",
  "已超期": "bg-destructive/10 text-destructive",
}

export default function AdminProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProjects = projects.filter(
    (project) =>
      project.name.includes(searchQuery) ||
      project.id.includes(searchQuery) ||
      project.bank.includes(searchQuery) ||
      project.company.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">项目监控</h1>
          <p className="text-muted-foreground">监控平台所有评估项目</p>
        </div>
      </div>

      <Tabs defaultValue="all">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="active">进行中</TabsTrigger>
            <TabsTrigger value="review">待审核</TabsTrigger>
            <TabsTrigger value="overdue">已超期</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索项目..."
                className="pl-8 w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>项目列表</CardTitle>
              <CardDescription>共 {filteredProjects.length} 个项目</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>项目编号</TableHead>
                    <TableHead>项目名称</TableHead>
                    <TableHead>委托银行</TableHead>
                    <TableHead>评估公司</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>截止日期</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-mono text-sm">{project.id}</TableCell>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>{project.bank}</TableCell>
                      <TableCell>{project.company}</TableCell>
                      <TableCell>{project.type}</TableCell>
                      <TableCell>
                        <span className={project.status === "已超期" ? "text-destructive" : ""}>
                          {project.deadline}
                        </span>
                      </TableCell>
                      <TableCell>{project.amount}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[project.status]}>
                          {project.status === "已超期" && <AlertCircle className="mr-1 h-3 w-3" />}
                          {project.status}
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
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              查看详情
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
        </TabsContent>
        <TabsContent value="active">
          <div className="text-center py-12 text-muted-foreground">进行中的项目</div>
        </TabsContent>
        <TabsContent value="review">
          <div className="text-center py-12 text-muted-foreground">待审核的项目</div>
        </TabsContent>
        <TabsContent value="overdue">
          <div className="text-center py-12 text-muted-foreground">已超期的项目</div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
