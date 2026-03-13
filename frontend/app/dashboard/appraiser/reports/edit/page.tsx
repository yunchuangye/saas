"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { FileEdit, Clock, ArrowRight } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { useToast } from "@/hooks/use-toast"

export default function AppraiserReportsEditPage() {
  const { toast } = useToast()
  const { data, isLoading } = trpc.reports.list.useQuery({ page: 1, pageSize: 20, status: "draft" })
  const reports = data?.items ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">报告编制</h1>
          <p className="text-muted-foreground">编辑和管理评估报告草稿</p>
        </div>
        <Badge variant="secondary"><FileEdit className="mr-1 h-3 w-3" />{reports.length} 份草稿</Badge>
      </div>
      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-40 w-full" />)}</div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileEdit className="h-12 w-12 mb-4 opacity-30" /><p>暂无草稿报告</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report: any) => (
            <Card key={report.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription className="font-mono text-xs">{report.reportNo}</CardDescription>
                  </div>
                  <Badge variant="secondary">草稿</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">报告进度</span>
                      <span>30%</span>
                    </div>
                    <Progress value={30} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>创建于 {new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                    <Button onClick={() => toast({ title: "报告编辑器", description: "完整报告编辑功能即将上线" })}>
                      继续编辑 <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
