"use client";
import { useDashboardStats, useActivityChart, useRecentProjects } from "@/hooks/use-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { TrendingUp, FolderOpen, CheckCircle2, FileText } from "lucide-react";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TaskList, type Task } from "@/components/dashboard/task-list";
import { RecentProjects, type Project } from "@/components/dashboard/recent-projects";
import { ActivityChart } from "@/components/dashboard/activity-chart";

export default function InvestorDashboardPage() {
  const { user } = useAuth();
  const { data: stats } = useDashboardStats();
  const { data: chartRaw } = useActivityChart(11);
  const { data: recentProjectsRaw } = useRecentProjects(5);

  const statCards = [
    { title: "待竞价项目", value: (stats as any)?.biddingProjects ?? 0, icon: TrendingUp, trend: { value: 20, label: "较上月" } },
    { title: "进行中项目", value: (stats as any)?.activeProjects ?? 0, icon: FolderOpen, trend: { value: 5, label: "较上月" } },
    { title: "待审核报告", value: (stats as any)?.pendingReports ?? 0, icon: FileText, description: "需要处理" },
    { title: "已完成项目", value: (stats as any)?.completedProjects ?? 0, icon: CheckCircle2, trend: { value: 12, label: "较上月" } },
  ];
  const chartData = (chartRaw ?? []).map((item: any) => ({ date: item.date, projects: item.count, reports: Math.floor(item.count * 0.7) }));
  const recentProjects: Project[] = (recentProjectsRaw ?? []).map((p: any) => ({
    id: String(p.id), name: p.title, address: p.propertyAddress ?? "地址待填写",
    status: mapStatus(p.status), client: `项目编号: ${p.projectNo}`,
    createdAt: new Date(p.createdAt).toISOString().split("T")[0], href: `/dashboard/investor/projects/${p.id}`,
  }));
  const tasks: Task[] = (recentProjectsRaw ?? []).filter((p: any) => ["bidding","reviewing"].includes(p.status)).slice(0,4).map((p: any, i: number) => ({
    id: String(p.id), title: `${p.title} - ${statusLabel(p.status)}`, description: p.propertyAddress ?? "待处理",
    status: (i===0?"urgent":i===1?"in-progress":"pending") as Task["status"],
    dueDate: p.deadline ? new Date(p.deadline).toISOString().split("T")[0] : undefined,
    href: `/dashboard/investor/projects/${p.id}`,
  }));
  const fallback = Array.from({length:7},(_,i)=>({ date: new Date(Date.now()-(6-i)*86400000).toISOString().split("T")[0], projects:0, reports:0 }));

  return (
    <div className="space-y-6">
      <WelcomeCard userName={user?.name ?? "用户"} role="投资机构" quickActions={[
        { label: "发起新评估需求", href: "/dashboard/investor/demand/new" },
        { label: "查看竞价项目", href: "/dashboard/investor/bidding" },
      ]} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => <StatCard key={stat.title} {...stat} />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityChart title="业务趋势" description="近期项目发起数量和报告完成情况" data={chartData.length>0?chartData:fallback} />
        <TaskList title="待办事项" tasks={tasks} viewAllHref="/dashboard/investor/projects" />
      </div>
      <RecentProjects title="最近项目" projects={recentProjects} viewAllHref="/dashboard/investor/projects" />
    </div>
  );
}

function mapStatus(s: string): "in-progress"|"pending"|"completed"|"review" {
  return ({bidding:"pending",awarded:"pending",surveying:"in-progress",reporting:"in-progress",reviewing:"review",completed:"completed",cancelled:"pending"} as any)[s] ?? "pending";
}
function statusLabel(s: string): string {
  return ({bidding:"竞价截止中",reviewing:"报告待审核",surveying:"现场勘察中",reporting:"报告编制中",awarded:"已中标"} as any)[s] ?? s;
}
