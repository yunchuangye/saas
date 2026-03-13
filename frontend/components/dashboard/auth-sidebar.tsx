"use client"

import { useAuth } from "@/hooks/use-auth"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import type { UserRole } from "@/lib/config/roles"
import type { ComponentProps } from "react"
import { Sidebar } from "@/components/ui/sidebar"

interface AuthSidebarProps extends ComponentProps<typeof Sidebar> {
  role: UserRole
}

export function AuthSidebar({ role, ...props }: AuthSidebarProps) {
  const { user } = useAuth()

  const userInfo = user
    ? {
        name: user.realName || user.displayName || user.username,
        email: user.email || "",
        avatar: user.avatar || undefined,
      }
    : undefined

  return <AppSidebar role={role} user={userInfo} {...props} />
}
