"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  Shield, LayoutDashboard, Building2, BarChart3, Megaphone,
  FileText, LogOut, ChevronRight, Users, Settings, Bell
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/platform-admin/dashboard", icon: LayoutDashboard, label: "运营概览", exact: true },
  { href: "/platform-admin/dashboard/tenants", icon: Building2, label: "租户管理" },
  { href: "/platform-admin/dashboard/revenue", icon: BarChart3, label: "收入监控" },
  { href: "/platform-admin/dashboard/announcements", icon: Megaphone, label: "公告运营" },
  { href: "/platform-admin/dashboard/operations", icon: Users, label: "用户运营" },
  { href: "/platform-admin/dashboard/logs", icon: FileText, label: "操作日志" },
]

export default function PlatformAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [adminInfo, setAdminInfo] = useState<any>(null)

  useEffect(() => {
    // 验证平台超管 Token（独立于 SaaS 租户 Token）
    const token = localStorage.getItem("platform_admin_token")
    const info = localStorage.getItem("platform_admin_info")
    if (!token) {
      router.push("/platform-admin/login")
      return
    }
    if (info) setAdminInfo(JSON.parse(info))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("platform_admin_token")
    localStorage.removeItem("platform_admin_info")
    router.push("/platform-admin/login")
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* 侧边栏 */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">平台运营中心</p>
              <p className="text-gray-500 text-xs">Platform Admin</p>
            </div>
          </div>
        </div>

        {/* 隔离提示 */}
        <div className="mx-3 mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-xs font-medium">⚠ 超管专属区域</p>
          <p className="text-red-400/70 text-xs mt-0.5">与SaaS租户系统完全隔离</p>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive(item.href, item.exact)
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive(item.href, item.exact) && <ChevronRight className="w-3 h-3" />}
            </Link>
          ))}
        </nav>

        {/* 管理员信息 */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
              <span className="text-blue-400 text-sm font-bold">
                {adminInfo?.name?.charAt(0) || adminInfo?.username?.charAt(0) || "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{adminInfo?.name || adminInfo?.username || "管理员"}</p>
              <p className="text-gray-500 text-xs truncate">{adminInfo?.email || "platform_admin"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-400 transition-colors"
              title="退出登录"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
