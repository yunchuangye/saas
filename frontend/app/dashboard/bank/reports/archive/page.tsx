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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Download, Eye, Archive, Filter, FileText, Building2, Calendar } from "lucide-react"

const archivedReports = [
  {
    id: "RPT-2024-012",
    title: "海淀区商业地产评估报告",
    type: "商业",
    company: "同信评估",
    completedDate: "2024-03-05",
    fileSize: "3.2 MB",
  },
  {
    id: "RPT-2024-011",
    title: "东城区住宅评估报告",
    type: "住宅",
    company: "华信评估",
    completedDate: "2024-03-01",
    fileSize: "1.8 MB",
  },
  {
    id: "RPT-2024-010",
    title: "朝阳区办公楼评估报告",
    type: "商业",
    company: "中房评估",
    completedDate: "2024-02-28",
    fileSize: "4.5 MB",
  },
  {
    id: "RPT-2024-009",
    title: "石景山区工业评估报告",
    type: "工业",
    company: "正信评估",
    completedDate: "2024-02-25",
    fileSize: "2.9 MB",
  },
]

export default function BankReportsArchivePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<typeof archivedReports[0] | null>(null)

  const filteredReports = archivedReports.filter(
    (report) =>
      report.title.includes(searchQuery) ||
      report.id.includes(searchQuery) ||
      report.company.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">报告归档</h1>
          <p className="text-muted-foreground">查看和下载已归档的评估报告</p>
        </div>
        <Badge variant="secondary">
          <Archive className="mr-1 h-3 w-3" />
          {archivedReports.length} 份报告
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>归档报告</CardTitle>
              <CardDescription>按完成日期排序</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索报告..."
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
                <TableHead>报告编号</TableHead>
                <TableHead>报告名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>评估公司</TableHead>
                <TableHead>完成日期</TableHead>
                <TableHead>文件大小</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-mono text-sm">{report.id}</TableCell>
                  <TableCell className="font-medium">{report.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.type}</Badge>
                  </TableCell>
                  <TableCell>{report.company}</TableCell>
                  <TableCell>{report.completedDate}</TableCell>
                  <TableCell>{report.fileSize}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setSelectedReport(report)
                        setIsViewDialogOpen(true)
                      }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        alert(`下载报告: ${report.title}\n文件大小: ${report.fileSize}`)
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

      {/* 报告详情对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>报告详情</DialogTitle>
            <DialogDescription>查看已归档报告的详细信息</DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedReport.title}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{selectedReport.id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">报告类型</p>
                  <Badge variant="outline">{selectedReport.type}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">评估公司</p>
                    <p className="font-medium">{selectedReport.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">完成日期</p>
                    <p className="font-medium">{selectedReport.completedDate}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">文件大小</p>
                  <p className="font-medium">{selectedReport.fileSize}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              关闭
            </Button>
            <Button onClick={() => {
              alert(`下载报告: ${selectedReport?.title}\n文件大小: ${selectedReport?.fileSize}`)
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
