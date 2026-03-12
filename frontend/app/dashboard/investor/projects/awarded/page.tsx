"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Award, Building2, Clock, ArrowRight, Calendar, Banknote } from "lucide-react"

const awardedProjects = [
  {
    id: "PRJ-2024-015",
    title: "金融街写字楼估价",
    type: "商业",
    company: "华信评估",
    companyAvatar: "华信",
    awardedDate: "2024-03-08",
    price: "¥68,000",
    deadline: "2024-03-18",
    status: "待处理",
  },
  {
    id: "PRJ-2024-014",
    title: "朝阳区住宅估价",
    type: "住宅",
    company: "中房评估",
    companyAvatar: "中房",
    awardedDate: "2024-03-05",
    price: "¥12,000",
    deadline: "2024-03-12",
    status: "进行中",
  },
  {
    id: "PRJ-2024-013",
    title: "丰台区土地估价",
    type: "土地",
    company: "正信评估",
    companyAvatar: "正信",
    awardedDate: "2024-03-01",
    price: "¥25,000",
    deadline: "2024-03-10",
    status: "进行中",
  },
]

const statusColors: Record<string, string> = {
  "待处理": "bg-muted text-muted-foreground",
  "进行中": "bg-info/10 text-info",
}

export default function InvestorProjectsAwardedPage() {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<typeof awardedProjects[0] | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">中标项目</h1>
          <p className="text-muted-foreground">查看已中标的估价项目</p>
        </div>
        <Badge variant="secondary">
          <Award className="mr-1 h-3 w-3" />
          {awardedProjects.length} 个项目
        </Badge>
      </div>

      <div className="grid gap-4">
        {awardedProjects.map((project) => (
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
                <Badge variant="secondary" className={statusColors[project.status]}>
                  {project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="text-xs">{project.companyAvatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="flex items-center gap-1 text-sm font-medium">
                        <Building2 className="h-3 w-3" />
                        {project.company}
                      </p>
                      <p className="text-xs text-muted-foreground">中标日期: {project.awardedDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{project.price}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      截止: {project.deadline}
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => {
                  setSelectedProject(project)
                  setIsViewDialogOpen(true)
                }}>
                  查看详情
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 项目详情对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>中标项目详情</DialogTitle>
            <DialogDescription>{selectedProject?.id}</DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedProject.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{selectedProject.type}</Badge>
                    <Badge variant="secondary" className={statusColors[selectedProject.status]}>
                      {selectedProject.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-success">
                  <Award className="h-5 w-5" />
                  <span className="font-medium">已中标</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">中标公司</p>
                    <p className="font-medium">{selectedProject.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">中标日期</p>
                    <p className="font-medium">{selectedProject.awardedDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">中标价格</p>
                    <p className="font-semibold text-primary">{selectedProject.price}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
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
              联系评估师
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
