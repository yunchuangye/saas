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
import { Clock, Building2, ArrowRight, Calendar } from "lucide-react"

const activeProjects = [
  {
    id: "PRJ-2024-014",
    title: "朝阳区住宅评估",
    type: "住宅",
    company: "中房评估",
    companyAvatar: "中房",
    progress: 65,
    stage: "报告编制",
    deadline: "2024-03-12",
    daysLeft: 2,
  },
  {
    id: "PRJ-2024-013",
    title: "丰台区土地评估",
    type: "土地",
    company: "正信评估",
    companyAvatar: "正信",
    progress: 40,
    stage: "现场勘查",
    deadline: "2024-03-10",
    daysLeft: 0,
  },
  {
    id: "PRJ-2024-016",
    title: "通州区工业厂房评估",
    type: "工业",
    company: "华信评估",
    companyAvatar: "华信",
    progress: 85,
    stage: "报告审核",
    deadline: "2024-03-15",
    daysLeft: 5,
  },
]

export default function BankProjectsActivePage() {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<typeof activeProjects[0] | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">进行中的项目</h1>
          <p className="text-muted-foreground">跟踪当前进行中的评估项目</p>
        </div>
        <Badge variant="secondary" className="bg-info/10 text-info">
          {activeProjects.length} 个进行中
        </Badge>
      </div>

      <div className="grid gap-4">
        {activeProjects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <Badge variant="outline">{project.type}</Badge>
                  </div>
                  <CardDescription className="font-mono text-xs">{project.id}</CardDescription>
                </div>
                <Badge 
                  variant="secondary"
                  className={project.daysLeft <= 1 ? "bg-destructive/10 text-destructive" : "bg-info/10 text-info"}
                >
                  {project.daysLeft === 0 ? "今日截止" : `剩余 ${project.daysLeft} 天`}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="text-xs">{project.companyAvatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="flex items-center gap-1 text-sm font-medium">
                      <Building2 className="h-3 w-3" />
                      {project.company}
                    </p>
                    <p className="text-xs text-muted-foreground">当前阶段: {project.stage}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">项目进度</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    截止日期: {project.deadline}
                  </span>
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
            <DialogTitle>项目进度详情</DialogTitle>
            <DialogDescription>{selectedProject?.id}</DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{selectedProject.title}</h3>
                <Badge 
                  variant="secondary"
                  className={selectedProject.daysLeft <= 1 ? "bg-destructive/10 text-destructive" : "bg-info/10 text-info"}
                >
                  {selectedProject.daysLeft === 0 ? "今日截止" : `剩余 ${selectedProject.daysLeft} 天`}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">项目进度</span>
                  <span className="font-medium">{selectedProject.progress}%</span>
                </div>
                <Progress value={selectedProject.progress} className="h-3" />
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
                <div>
                  <p className="text-sm text-muted-foreground">当前阶段</p>
                  <p className="font-medium text-primary">{selectedProject.stage}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">截止日期</p>
                    <p className="font-medium">{selectedProject.deadline}</p>
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
              alert(`联系 ${selectedProject?.company}`)
            }}>
              联系评估方
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
