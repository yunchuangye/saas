/**
 * 平台超管独立布局
 * 路由前缀：/platform-admin
 * 完全独立于 SaaS 租户 /dashboard 路由
 * 使用独立的 JWT 验证（role: platform_admin）
 */
export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-950 text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}
