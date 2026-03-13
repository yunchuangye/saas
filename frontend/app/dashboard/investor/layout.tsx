import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AuthSidebar } from "@/components/dashboard/auth-sidebar"
import { TopNav } from "@/components/dashboard/top-nav"

export default function InvestorDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AuthSidebar role="investor" />
      <SidebarInset>
        <TopNav />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
