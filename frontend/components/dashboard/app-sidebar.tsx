"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronDown, ChevronRight, ChevronsUpDown, LogOut, Settings, User } from "lucide-react"
import { trpc } from "@/lib/trpc"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { getNavigation, getRoleConfig, type UserRole, type NavSection } from "@/lib/config/roles"
import { cn } from "@/lib/utils"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role: UserRole
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

export function AppSidebar({ role, user, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const navigation = getNavigation(role)
  const roleConfig = getRoleConfig(role)

  // 动态获取未读通知数
  const { data: notifData } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30 * 1000, // 每30秒刷新一次
    staleTime: 10 * 1000,
  })
  const unreadNotifCount = notifData?.count ?? 0

  // 动态获取客户端申请数（仅 customer 角色需要）
  const { data: projectsData } = trpc.projects.list.useQuery(
    { page: 1, pageSize: 1 },
    { enabled: role === "customer", staleTime: 30 * 1000 }
  )
  const myApplicationsCount = role === "customer" ? (projectsData?.total ?? 0) : 0

  // 构建动态 badge 映射：用真实数据覆盖静态配置
  const dynamicBadges: Record<string, number> = {
    "/dashboard/customer/applications": myApplicationsCount > 0 ? myApplicationsCount : 0,
    "/dashboard/customer/notifications": unreadNotifCount,
    "/dashboard/appraiser/notifications": unreadNotifCount,
    "/dashboard/bank/notifications": unreadNotifCount,
    "/dashboard/investor/notifications": unreadNotifCount,
    "/dashboard/admin/notifications": unreadNotifCount,
  }

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      router.push("/login")
      router.refresh()
    },
    onError: () => {
      router.push("/login")
      router.refresh()
    },
  })

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault()
    logoutMutation.mutate()
  }

  const defaultUser = {
    name: "张三",
    email: "zhangsan@example.com",
    avatar: undefined,
  }

  const currentUser = user || defaultUser

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              asChild
            >
              <Link href={roleConfig.dashboardPath}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <roleConfig.icon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">GuJia.App</span>
                  <span className="truncate text-xs">{roleConfig.name}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navigation.map((section) => (
          <NavSection key={section.title} section={section} pathname={pathname} dynamicBadges={dynamicBadges} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                    <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      {currentUser.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{currentUser.name}</span>
                    <span className="truncate text-xs">{currentUser.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                      <AvatarFallback className="rounded-lg">
                        {currentUser.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{currentUser.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {currentUser.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/${role}/profile`)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    个人中心
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/${role}/account`)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    账户设置
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {logoutMutation.isPending ? "退出中..." : "退出登录"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

// 判断某个分组是否有激活的子项（用于默认展开）
function isSectionActive(section: NavSection, pathname: string): boolean {
  return section.items.some(
    (item) =>
      pathname === item.href ||
      pathname.startsWith(item.href + "/") ||
      item.children?.some((child) => pathname === child.href || pathname.startsWith(child.href + "/"))
  )
}

function NavSection({ section, pathname, dynamicBadges }: { section: NavSection; pathname: string; dynamicBadges: Record<string, number> }) {
  // 控制台分组不可折叠（始终展开）
  const isAlwaysOpen = section.title === "控制台" || section.title === "工作台"
  const defaultOpen = isAlwaysOpen || isSectionActive(section, pathname)
  const [open, setOpen] = React.useState(defaultOpen)

  if (isAlwaysOpen) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="text-[16px] font-semibold text-sidebar-foreground/80 uppercase tracking-wider px-2 py-1.5">
          {section.title}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <NavItems items={section.items} pathname={pathname} dynamicBadges={dynamicBadges} />
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  return (
    <SidebarGroup className="p-0">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 一级目录标题：字体比二级菜单项大一号，可点击折叠 */}
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel
            className={cn(
              "flex w-full cursor-pointer select-none items-center justify-between",
              "px-3 py-2 text-[16px] font-semibold uppercase tracking-wider",
              "text-sidebar-foreground/80 hover:text-sidebar-foreground",
              "hover:bg-sidebar-accent/50 rounded-md transition-colors",
              "group-data-[collapsible=icon]:hidden"
            )}
          >
            <span>{section.title}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                open ? "rotate-0" : "-rotate-90"
              )}
            />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <NavItems items={section.items} pathname={pathname} dynamicBadges={dynamicBadges} />
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  )
}

function NavItems({ items, pathname, dynamicBadges }: { items: NavSection["items"]; pathname: string; dynamicBadges: Record<string, number> }) {
  return (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        const hasChildren = item.children && item.children.length > 0
        const Icon = item.icon
        // 动态 badge 优先，如果没有动态数据则不显示静态配置的 badge
        const badgeCount = dynamicBadges[item.href] !== undefined ? dynamicBadges[item.href] : 0

        if (hasChildren) {
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.children?.some(
                (child) => pathname === child.href || pathname.startsWith(child.href + "/")
              )}
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title} className="text-[15px]">
                    <Icon className="shrink-0" />
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.children?.map((child) => (
                      <SidebarMenuSubItem key={child.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === child.href || pathname.startsWith(child.href + "/")}
                          className="text-[13px]"
                        >
                          <Link href={child.href}>
                            <span>{child.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        }

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className="text-[15px]">
              <Link href={item.href}>
                <Icon className="shrink-0" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
            {badgeCount > 0 && (
              <SidebarMenuBadge>{badgeCount > 99 ? "99+" : badgeCount}</SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
