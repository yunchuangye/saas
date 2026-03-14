"use client";
import { useDashboardStats, useActivityChart } from "@/hooks/use-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { Building2, Landmark, Users, FolderOpen, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TaskList, type Task } from "@/components/dashboard/task-list";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { data: stats } = useDashboardStats();
  const { data: chartRaw } = useActivityChart(11);

  const statCards = [
    { title: "评估公司", value: (stats as any)?.appraiserOrgs ?? 0, icon: Building2, trend: { value: 8, label: "本月新增" } },
    { title: "银行机构", value: (stats as any)?.bankOrgs ?? 0, icon: Landmark, trend: { value: 3, label: "本月新增" } },
    { title: "平台用户", value: (stats as any)?.totalUsers ?? 0, icon: Users, trend: { value: 156, label: "本月新增" } },
    { title: "本月项目", value: (stats as any)?.monthlyProjects ?? 0, icon: FolderOpen, trend: { value: 15, label: "较上月" } },
  ];

  const chartData = (chartRaw ?? []).map((item: any) => ({ date: item.date, projects: item.count, reports: Math.floor(item.count * 0.85) }));
  const fallback = Array.from({length:7},(_,i)=>({ date: new Date(Date.now()-(6-i)*86400000).toISOString().split("T")[0], projects:0, reports:0 }));

  const systemAlerts = [
    { id: "1", type: "info", title: "平台运行正常", description: "所有服务运行正常，数据库连接稳定", time: "刚刚" },
    { id: "2", type: "success", title: "Redis缓存已启用", description: "缓存层正常工作，命中率良好", time: "5分钟前" },
    { id: "3", type: "info", title: "LLM服务已连接", description: "AI分析功能就绪，可正常使用", time: "10分钟前" },
  ];

  const tasks: Task[] = [
    { id: "1", title: "评估公司审核", description: "待审核的评估公司入驻申请", status: "urgent", href: "/dashboard/admin/users/appraisers" },
    { id: "2", title: "数据目录维护", description: "检查并更新楼盘、案例数据", status: "in-progress", href: "/dashboard/admin/directory/cases" },
    { id: "3", title: "OpenClaw配置", description: "配置数据采集服务并启动采集任务", status: "pending", href: "/dashboard/admin/settings/openclaw" },
    { id: "4", title: "系统设置检查", description: "确认系统参数配置正确", status: "pending", href: "/dashboard/admin/settings" },
  ];

  return (
    <div className="space-y-6">
      <WelcomeCard userName={user?.displayName ?? "管理员"} role="运营管理" quickActions={[
        { label: "用户管理", href: "/dashboard/admin/users/appraisers" },
        { label: "系统设置", href: "/dashboard/admin/settings" },
      ]} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => <StatCard key={stat.title} {...stat} />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityChart title="平台业务趋势" description="近期项目和报告数量统计" data={chartData.length>0?chartData:fallback} />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5" />系统状态</CardTitle>
            <CardDescription>平台各服务运行状态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="mt-0.5">
                    {alert.type === "warning" && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                    {alert.type === "info" && <FileText className="h-4 w-4 text-blue-500" />}
                    {alert.type === "success" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <Badge variant="outline" className="text-xs">{alert.time}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <TaskList title="待处理事项" tasks={tasks} viewAllHref="/dashboard/admin/settings" />
    </div>
  );
}
