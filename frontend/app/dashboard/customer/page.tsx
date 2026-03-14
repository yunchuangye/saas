"use client";
import { useDashboardStats, useRecentProjects } from "@/hooks/use-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { FolderOpen, FileText, CheckCircle2, Clock } from "lucide-react";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TaskList, type Task } from "@/components/dashboard/task-list";
import { RecentProjects, type Project } from "@/components/dashboard/recent-projects";

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const { data: stats } = useDashboardStats();
  const { data: recentProjectsRaw } = useRecentProjects(5);

  const statCards = [
    { title: "进行中申请", value: (stats as any)?.activeProjects ?? 0, icon: FolderOpen, description: "正在处理中" },
    { title: "待付款", value: (stats as any)?.pendingPayment ?? 0, icon: Clock, description: "请尽快完成支付" },
    { title: "已完成报告", value: (stats as any)?.completedProjects ?? 0, icon: FileText, trend: { value: 25, label: "较去年" } },
    { title: "历史申请", value: (stats as any)?.totalProjects ?? 0, icon: CheckCircle2 },
  ];
  const recentProjects: Project[] = (recentProjectsRaw ?? []).map((p: any) => ({
    id: String(p.id), name: p.title, address: p.propertyAddress ?? "地址待填写",
    status: mapStatus(p.status), client: `项目编号: ${p.projectNo}`,
    createdAt: new Date(p.createdAt).toISOString().split("T")[0], href: `/dashboard/customer/applications/${p.id}`,
  }));
  const tasks: Task[] = (recentProjectsRaw ?? []).filter((p: any) => ["bidding","surveying","reporting"].includes(p.status)).slice(0,3).map((p: any, i: number) => ({
    id: String(p.id), title: `${p.title} - ${statusLabel(p.status)}`, description: p.propertyAddress ?? "待处理",
    status: (i===0?"urgent":i===1?"in-progress":"pending") as Task["status"],
    href: `/dashboard/customer/applications/${p.id}`,
  }));

  return (
    <div className="space-y-6">
      <WelcomeCard userName={user?.displayName ?? "用户"} role="个人客户" quickActions={[
        { label: "申请评估", href: "/dashboard/customer/apply" },
        { label: "查看我的申请", href: "/dashboard/customer/applications" },
      ]} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => <StatCard key={stat.title} {...stat} />)}
      </div>
      <TaskList title="待处理事项" tasks={tasks} viewAllHref="/dashboard/customer/notifications" />
      <RecentProjects title="我的申请" projects={recentProjects} viewAllHref="/dashboard/customer/applications" />
    </div>
  );
}

function mapStatus(s: string): "in-progress"|"pending"|"completed"|"review" {
  return ({bidding:"pending",awarded:"pending",surveying:"in-progress",reporting:"in-progress",reviewing:"review",completed:"completed",cancelled:"pending"} as any)[s] ?? "pending";
}
function statusLabel(s: string): string {
  return ({bidding:"竞价中",surveying:"现场勘察中",reporting:"报告编制中",reviewing:"审核中",awarded:"已中标"} as any)[s] ?? s;
}
