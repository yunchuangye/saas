"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
import { Search, Filter, MoreHorizontal, Eye, FileEdit, Download, MapPin, Building2, Calendar, User } from "lucide-react"

const projects = [
  {
    id: "PRJ-2024-001",
    name: "朝阳区某住宅评估",
    type: "住宅",
    client: "中国银行朝阳支行",
    status: "进行中",
    assignee: "张三",
    deadline: "2024-03-15",
    amount: "¥8,500",
  },
  {
    id: "PRJ-2024-002",
    name: "海淀区商业地产评估",
    type: "商业",
    client: "工商银行海淀支行",
    status: "待审核",
    assignee: "李四",
    deadline: "2024-03-12",
    amount: "¥25,000",
  },
  {
    id: "PRJ-2024-003",
    name: "西城区办公楼评估",
    type: "商业",
    client: "建设银行西城支行",
    status: "已完成",
    assignee: "王五",
    deadline: "2024-03-08",
    amount: "¥18,000",
  },
  {
    id: "PRJ-2024-004",
    name: "通州区工业厂房评估",
    type: "工业",
    client: "农业银行通州支行",
    status: "进行中",
    assignee: "赵六",
    deadline: "2024-03-20",
    amount: "¥35,000",
  },
  {
    id: "PRJ-2024-005",
    name: "丰台区土地评估",
    type: "土地",
    client: "交通银行丰台支行",
    status: "待分配",
    assignee: "-",
    deadline: "2024-03-25",
    amount: "¥12,000",
  },
]

const statusColors: Record<string, string> = {
  "待分配": "bg-muted text-muted-foreground",
  "进行中": "bg-info/10 text-info",
  "待审核": "bg-warning/10 text-warning",
  "已完成": "bg-success/10 text-success",
}

export default function AppraiserProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<typeof projects[0] | null>(null)

  const filteredProjects = projects.filter(
    (project) =>
      project.name.includes(searchQuery) ||
      project.id.includes(searchQuery) ||
      project.client.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">全部项目</h1>
          <p className="text-muted-foreground">管理和查看所有评估项目</p>
        </div>
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
                <TableHead>委托方</TableHead>
                <TableHead>负责人</TableHead>
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
                  <TableCell>{project.client}</TableCell>
                  <TableCell>{project.assignee}</TableCell>
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
                          window.location.href = `/dashboard/appraiser/reports/edit?project=${project.id}`
                        }}>
                          <FileEdit className="mr-2 h-4 w-4" />
                          编辑报告
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          alert(`下载报告: ${project.name}`)
                        }}>
                          <Download className="mr-2 h-4 w-4" />
                          下载报告
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
            <DialogDescription>查看评估项目的详细信息</DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedProject.name}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{selectedProject.id}</p>
                </div>
                <Badge variant="secondary" className={statusColors[selectedProject.status]}>
                  {selectedProject.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">委托方</p>
                    <p className="font-medium">{selectedProject.client}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">负责人</p>
                    <p className="font-medium">{selectedProject.assignee}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">截止日期</p>
                    <p className="font-medium">{selectedProject.deadline}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">项目类型</p>
                    <p className="font-medium">{selectedProject.type}</p>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">项目金额</p>
                  <p className="font-semibold text-lg text-primary">{selectedProject.amount}</p>
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
              if (selectedProject) {
                window.location.href = `/dashboard/appraiser/reports/edit?project=${selectedProject.id}`
              }
            }}>
              编辑报告
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
