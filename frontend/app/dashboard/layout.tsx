export const metadata = {
  title: "工作台",
  description: "gujia.app 评估平台工作台",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 子路由会使用各自的布局（包含侧边栏）
  return <>{children}</>
}
