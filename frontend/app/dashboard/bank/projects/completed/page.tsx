"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Download, Eye, CheckCircle2, Building2, Calendar, FileText } from "lucide-react"

const completedProjects = [
  {
    id: "PRJ-2024-012",
    title: "海淀区商业地产评估",
    type: "商业",
    company: "同信评估",
    completedDate: "2024-03-05",
    amount: "¥45,000",
    rating: 5,
  },
  {
    id: "PRJ-2024-011",
    title: "东城区住宅评估",
    type: "住宅",
    company: "华信评估",
    completedDate: "2024-03-01",
    amount: "¥9,500",
    rating: 4,
  },
  {
    id: "PRJ-2024-010",
    title: "朝阳区办公楼评估",
    type: "商业",
    company: "中房评估",
    completedDate: "2024-02-28",
    amount: "¥32,000",
    rating: 5,
  },
  {
    id: "PRJ-2024-009",
    title: "石景山区工业评估",
    type: "工业",
    company: "正信评估",
    completedDate: "2024-02-25",
    amount: "¥28,000",
    rating: 4,
  },
]

export default function BankProjectsCompletedPage() {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<typeof completedProjects[0] | null>(null)

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
                <TableHead>评估公司</TableHead>
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
                  <TableCell>{project.company}</TableCell>
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
                      <Button variant="ghost" size="icon" onClick={() => {
                        setSelectedProject(project)
                        setIsViewDialogOpen(true)
                      }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        alert(`下载报告: ${project.title}`)
                      }}>
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

      {/* 项目详情对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>已完成项目详情</DialogTitle>
            <DialogDescription>{selectedProject?.id}</DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{selectedProject.title}</h3>
                <Badge variant="secondary" className="bg-success/10 text-success">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  已完成
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">评估公司</p>
                    <p className="font-medium">{selectedProject.company}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">项目类型</p>
                  <Badge variant="outline">{selectedProject.type}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">完成日期</p>
                    <p className="font-medium">{selectedProject.completedDate}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">项目金额</p>
                  <p className="font-semibold text-primary">{selectedProject.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">服务评分</p>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={i < selectedProject.rating ? "text-warning" : "text-muted"}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              关闭
            </Button>
            <Button onClick={() => {
              alert(`下载报告: ${selectedProject?.title}`)
            }}>
              <Download className="mr-2 h-4 w-4" />
              下载报告
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
