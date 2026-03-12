"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
import { Search, Filter, MoreHorizontal, Eye, FileText, MessageSquare, Building2, Calendar, Send } from "lucide-react"

const projects = [
  {
    id: "PRJ-2024-015",
    name: "金融街写字楼估价",
    type: "商业",
    company: "华信评估",
    status: "待处理",
    deadline: "2024-03-18",
    amount: "¥68,000",
  },
  {
    id: "PRJ-2024-014",
    name: "朝阳区住宅估价",
    type: "住宅",
    company: "中房评估",
    status: "进行中",
    deadline: "2024-03-12",
    amount: "¥12,000",
  },
  {
    id: "PRJ-2024-013",
    name: "丰台区土地估价",
    type: "土地",
    company: "正信评估",
    status: "进行中",
    deadline: "2024-03-10",
    amount: "¥25,000",
  },
  {
    id: "PRJ-2024-012",
    name: "海淀区商业估价",
    type: "商业",
    company: "同信评估",
    status: "已完成",
    deadline: "2024-03-05",
    amount: "¥45,000",
  },
  {
    id: "PRJ-2024-011",
    name: "东城区住宅估价",
    type: "住宅",
    company: "华信评估",
    status: "已完成",
    deadline: "2024-03-01",
    amount: "¥9,500",
  },
]

const statusColors: Record<string, string> = {
  "待处理": "bg-muted text-muted-foreground",
  "进行中": "bg-info/10 text-info",
  "审核中": "bg-warning/10 text-warning",
  "已完成": "bg-success/10 text-success",
}

export default function InvestorProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<typeof projects[0] | null>(null)
  const [messageContent, setMessageContent] = useState("")

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">全部项目</h1>
          <p className="text-muted-foreground">查看所有估价项目</p>
        </div>
        <Button onClick={() => window.location.href = '/dashboard/investor/demand/new'}>发起需求</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>项目列表</CardTitle>
              <CardDescription>共 {filteredProjects.length} 个项目</CardDescription>
            </div>
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>项目编号</TableHead>
                <TableHead>项目名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>评估公司</TableHead>
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
                  <TableCell>{project.type}</TableCell>
                  <TableCell>{project.company}</TableCell>
                  <TableCell>{project.deadline}</TableCell>
                  <TableCell>{project.amount}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[project.status]}>
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
                        <DropdownMenuItem onClick={() => {
                          setSelectedProject(project)
                          setIsViewDialogOpen(true)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          if (project.status === "已完成") {
                            alert(`查看报告: ${project.name}`)
                          } else {
                            alert('报告尚未完成')
                          }
                        }}>
                          <FileText className="mr-2 h-4 w-4" />
                          查看报告
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedProject(project)
                          setIsMessageDialogOpen(true)
                        }}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          联系评估师
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

      {/* 项目详情对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>项目详情</DialogTitle>
            <DialogDescription>{selectedProject?.id}</DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{selectedProject.name}</h3>
                <Badge variant="secondary" className={statusColors[selectedProject.status]}>
                  {selectedProject.status}
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
                    <p className="text-sm text-muted-foreground">截止日期</p>
                    <p className="font-medium">{selectedProject.deadline}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">项目金额</p>
                  <p className="font-semibold text-primary">{selectedProject.amount}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              关闭
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false)
              setIsMessageDialogOpen(true)
            }}>
              联系评估师
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 联系对话框 */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>联系评估师</DialogTitle>
            <DialogDescription>
              向 {selectedProject?.company} 发送消息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>相关项目</Label>
              <p className="text-sm text-muted-foreground">{selectedProject?.name}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">消息内容</Label>
              <Textarea
                id="message"
                placeholder="请输入您要发送的消息..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsMessageDialogOpen(false)
              setMessageContent("")
            }}>
              取消
            </Button>
            <Button onClick={() => {
              alert(`消息已发送至 ${selectedProject?.company}\n\n内容: ${messageContent}`)
              setIsMessageDialogOpen(false)
              setMessageContent("")
            }} disabled={!messageContent.trim()}>
              <Send className="mr-2 h-4 w-4" />
              发送
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
