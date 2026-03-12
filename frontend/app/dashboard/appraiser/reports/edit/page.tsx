"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileEdit, Clock, ArrowRight, FileText } from "lucide-react"

const draftReports = [
  {
    id: "RPT-2024-001",
    projectId: "PRJ-2024-001",
    title: "朝阳区某住宅评估报告",
    type: "住宅",
    progress: 75,
    lastEdited: "2024-03-10 14:30",
    deadline: "2024-03-15",
    sections: { completed: 6, total: 8 },
  },
  {
    id: "RPT-2024-004",
    projectId: "PRJ-2024-004",
    title: "通州区工业厂房评估报告",
    type: "工业",
    progress: 45,
    lastEdited: "2024-03-09 16:20",
    deadline: "2024-03-20",
    sections: { completed: 4, total: 9 },
  },
  {
    id: "RPT-2024-006",
    projectId: "PRJ-2024-006",
    title: "大兴区商业综合体评估报告",
    type: "商业",
    progress: 20,
    lastEdited: "2024-03-08 10:15",
    deadline: "2024-03-25",
    sections: { completed: 2, total: 10 },
  },
]

export default function AppraiserReportsEditPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">报告编制</h1>
          <p className="text-muted-foreground">编辑和管理评估报告草稿</p>
        </div>
        <Badge variant="secondary">
          <FileEdit className="mr-1 h-3 w-3" />
          {draftReports.length} 份草稿
        </Badge>
      </div>

      <div className="grid gap-4">
        {draftReports.map((report) => (
          <Card key={report.id} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                  </div>
                  <CardDescription className="flex items-center gap-4">
                    <span className="font-mono text-xs">{report.projectId}</span>
                    <Badge variant="outline">{report.type}</Badge>
                  </CardDescription>
                </div>
                <Badge 
                  variant="secondary"
                  className={report.progress >= 70 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}
                >
                  {report.progress}% 完成
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      已完成 {report.sections.completed}/{report.sections.total} 个章节
                    </span>
                    <span>{report.progress}%</span>
                  </div>
                  <Progress value={report.progress} className="h-2" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      最后编辑: {report.lastEdited}
                    </span>
                    <span>截止: {report.deadline}</span>
                  </div>
                  <Button onClick={() => {
                    alert(`打开报告编辑器: ${report.title}\n\n此功能将跳转到完整的报告编辑界面，包含：\n- 基本信息\n- 估价对象描述\n- 市场分析\n- 评估方法\n- 评估结论\n- 附件材料`)
                  }}>
                    继续编辑
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
