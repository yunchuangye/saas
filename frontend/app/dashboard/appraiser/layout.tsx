import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AuthSidebar } from "@/components/dashboard/auth-sidebar"
import { AuthGuard } from "@/components/dashboard/auth-guard"
import { TopNav } from "@/components/dashboard/top-nav"

export default function AppraiserDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard role="appraiser">
      <SidebarProvider defaultOpen={true}>
        <AuthSidebar role="appraiser" />
        <SidebarInset>
          <TopNav />
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
