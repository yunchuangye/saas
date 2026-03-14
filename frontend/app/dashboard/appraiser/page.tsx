"use client";

import { 
  FolderOpen, 
  FileText, 
  TrendingUp, 
  CheckCircle2,
} from "lucide-react";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TaskList, type Task } from "@/components/dashboard/task-list";
import { RecentProjects, type Project } from "@/components/dashboard/recent-projects";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { useDashboardStats, useActivityChart, useRecentProjects } from "@/hooks/use-dashboard";
import { useAuth } from "@/hooks/use-auth";

export default function AppraiserDashboardPage() {
  const { user } = useAuth();
  const { data: stats } = useDashboardStats();
  const { data: chartRaw } = useActivityChart(11);
  const { data: recentProjectsRaw } = useRecentProjects(5);

  const statCards = [
    {
      title: "进行中项目",
      value: (stats as any)?.activeProjects ?? 0,
      icon: FolderOpen,
      trend: { value: 8, label: "较上月" },
    },
    {
      title: "待审核报告",
      value: (stats as any)?.pendingReports ?? 0,
      icon: FileText,
      trend: { value: -12, label: "较上月" },
    },
    {
      title: "新竞价项目",
      value: (stats as any)?.biddingProjects ?? 0,
      icon: TrendingUp,
      description: "当前可竞价",
    },
    {
      title: "已完成项目",
      value: (stats as any)?.completedProjects ?? 0,
      icon: CheckCircle2,
      trend: { value: 15, label: "较上月" },
    },
  ];

  const chartData = (chartRaw ?? []).map((item: any) => ({
    date: item.date,
    projects: item.count,
    reports: Math.floor(item.count * 0.8),
  }));

  const recentProjects: Project[] = (recentProjectsRaw ?? []).map((p: any) => ({
    id: String(p.id),
    name: p.title,
    address: p.propertyAddress ?? "地址待填写",
    status: mapProjectStatus(p.status),
    client: `项目编号: ${p.projectNo}`,
    createdAt: new Date(p.createdAt).toISOString().split("T")[0],
    href: `/dashboard/appraiser/projects/${p.id}`,
  }));

  const tasks: Task[] = (recentProjectsRaw ?? [])
    .filter((p: any) => ["surveying", "reporting", "reviewing"].includes(p.status))
    .slice(0, 4)
    .map((p: any, i: number) => ({
      id: String(p.id),
      title: `${p.title} - ${getStatusLabel(p.status)}`,
      description: p.propertyAddress ?? "待处理",
      status: (i === 0 ? "urgent" : i === 1 ? "in-progress" : "pending") as Task["status"],
      dueDate: p.deadline ? new Date(p.deadline).toISOString().split("T")[0] : undefined,
      href: `/dashboard/appraiser/projects/${p.id}`,
    }));

  return (
    <div className="space-y-6">
      <WelcomeCard
        userName={user?.displayName ?? "用户"}
        role="评估公司"
        quickActions={[
          { label: "查看竞价项目", href: "/dashboard/appraiser/bidding" },
        ]}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityChart
          title="业务趋势"
          description="近期项目和报告数量变化"
          data={chartData.length > 0 ? chartData : fallbackChartData}
        />
        <TaskList
          title="待办任务"
          tasks={tasks}
          viewAllHref="/dashboard/appraiser/projects"
        />
      </div>
      <RecentProjects
        title="最近项目"
        projects={recentProjects}
        viewAllHref="/dashboard/appraiser/projects"
      />
    </div>
  );
}

function mapProjectStatus(status: string): "in-progress" | "pending" | "completed" | "review" {
  const map: Record<string, "in-progress" | "pending" | "completed" | "review"> = {
    bidding: "pending", awarded: "pending", surveying: "in-progress",
    reporting: "in-progress", reviewing: "review", completed: "completed", cancelled: "pending",
  };
  return map[status] ?? "pending";
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    surveying: "现场勘察", reporting: "报告编制", reviewing: "报告复核",
    bidding: "等待竞价", awarded: "已中标",
  };
  return labels[status] ?? status;
}

const fallbackChartData = Array.from({ length: 7 }, (_, i) => ({
  date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split("T")[0],
  projects: 0,
  reports: 0,
}));
