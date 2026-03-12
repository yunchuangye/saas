import { redirect } from "next/navigation"

export default function DashboardPage() {
  // 默认重定向到评估公司仪表盘（实际应根据用户角色动态跳转）
  redirect("/dashboard/appraiser")
}
