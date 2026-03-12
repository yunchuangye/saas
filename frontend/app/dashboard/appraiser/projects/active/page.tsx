"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Clock, MapPin, FileText, ArrowRight, Building2, User, Calendar } from "lucide-react"

const activeProjects = [
  {
    id: "PRJ-2024-001",
    title: "朝阳区某住宅评估",
    client: "中国银行朝阳支行",
    location: "北京市朝阳区望京街道",
    assignee: "张三",
    progress: 75,
    stage: "报告编制",
    deadline: "2024-03-15",
    daysLeft: 5,
  },
  {
    id: "PRJ-2024-004",
    title: "通州区工业厂房评估",
    client: "农业银行通州支行",
    location: "北京市通州区经济开发区",
    assignee: "赵六",
    progress: 45,
    stage: "现场勘查",
    deadline: "2024-03-20",
    daysLeft: 10,
  },
  {
    id: "PRJ-2024-006",
    title: "大兴区商业综合体评估",
    client: "邮储银行大兴支行",
    location: "北京市大兴区亦庄经济开发区",
    assignee: "李四",
    progress: 30,
    stage: "资料收集",
    deadline: "2024-03-25",
    daysLeft: 15,
  },
]

export default function AppraiserActiveProjectsPage() {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<typeof activeProjects[0] | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">进行中的项目</h1>
          <p className="text-muted-foreground">当前正在进行的评估项目</p>
        </div>
        <Badge variant="secondary">{activeProjects.length} 个项目</Badge>
      </div>

      <div className="grid gap-4">
        {activeProjects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <Badge variant="outline" className="font-mono text-xs">
                      {project.id}
                    </Badge>
                  </div>
                  <CardDescription>{project.client}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{project.assignee.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{project.assignee}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {project.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    截止: {project.deadline} (剩余{project.daysLeft}天)
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      当前阶段: {project.stage}
                    </span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
                <div className="flex justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedProject(project)
                    setIsViewDialogOpen(true)
                  }}>
                    查看详情
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 项目详情对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>项目详情</DialogTitle>
            <DialogDescription>查看项目进度和详细信息</DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedProject.title}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{selectedProject.id}</p>
                </div>
                <Badge variant="secondary" className="bg-info/10 text-info">
                  {selectedProject.stage}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>项目进度</span>
                  <span>{selectedProject.progress}%</span>
                </div>
                <Progress value={selectedProject.progress} className="h-2" />
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
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">项目地址</p>
                    <p className="font-medium">{selectedProject.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">截止日期</p>
                    <p className="font-medium">{selectedProject.deadline} (剩余{selectedProject.daysLeft}天)</p>
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
              setIsViewDialogOpen(false)
              window.location.href = `/dashboard/appraiser/reports/edit?project=${selectedProject?.id}`
            }}>
              编辑报告
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
