"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download, Eye, CheckCircle2 } from "lucide-react"

const completedProjects = [
  {
    id: "PRJ-2024-003",
    title: "西城区办公楼评估",
    client: "建设银行西城支行",
    type: "商业",
    assignee: "王五",
    completedDate: "2024-03-08",
    amount: "¥18,000",
    rating: 5,
  },
  {
    id: "PRJ-2024-007",
    title: "东城区住宅评估",
    client: "招商银行东城支行",
    type: "住宅",
    assignee: "张三",
    completedDate: "2024-03-05",
    amount: "¥9,500",
    rating: 4,
  },
  {
    id: "PRJ-2024-008",
    title: "丰台区土地评估",
    client: "民生银行丰台支行",
    type: "土地",
    assignee: "李四",
    completedDate: "2024-03-01",
    amount: "¥22,000",
    rating: 5,
  },
  {
    id: "PRJ-2024-009",
    title: "石景山区厂房评估",
    client: "光大银行石景山支行",
    type: "工业",
    assignee: "赵六",
    completedDate: "2024-02-28",
    amount: "¥28,000",
    rating: 4,
  },
]

export default function AppraiserCompletedProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">已完成项目</h1>
          <p className="text-muted-foreground">查看所有已完成的评估项目</p>
        </div>
        <Badge variant="secondary" className="bg-success/10 text-success">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {completedProjects.length} 个已完成
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>项目列表</CardTitle>
          <CardDescription>按完成时间排序</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>项目编号</TableHead>
                <TableHead>项目名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>委托方</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead>完成日期</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>评分</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-mono text-sm">{project.id}</TableCell>
                  <TableCell className="font-medium">{project.title}</TableCell>
                  <TableCell>{project.type}</TableCell>
                  <TableCell>{project.client}</TableCell>
                  <TableCell>{project.assignee}</TableCell>
                  <TableCell>{project.completedDate}</TableCell>
                  <TableCell>{project.amount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={i < project.rating ? "text-warning" : "text-muted"}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
