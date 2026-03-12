"use client"

import * as React from "react"
import Link from "next/link"
import { Bell, Search, HelpCircle, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface TopNavProps {
  className?: string
}

// 模拟通知数据
const notifications = [
  {
    id: 1,
    title: "新项目分配",
    description: "您有一个新的评估项目待处理",
    time: "5分钟前",
    unread: true,
  },
  {
    id: 2,
    title: "报告审核通过",
    description: "项目 #2024-001 的报告已审核通过",
    time: "1小时前",
    unread: true,
  },
  {
    id: 3,
    title: "系统维护通知",
    description: "系统将于今晚22:00进行维护升级",
    time: "3小时前",
    unread: false,
  },
]

export function TopNav({ className }: TopNavProps) {
  const [searchOpen, setSearchOpen] = React.useState(false)
  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <header
      className={cn(
        "flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6",
        className
      )}
    >
      {/* 侧边栏触发器 */}
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* 搜索框 */}
      <div className="flex-1 flex items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索项目、报告、客户..."
            className="w-full pl-9 bg-muted/50"
          />
        </div>
      </div>

      {/* 右侧工具栏 */}
      <div className="flex items-center gap-2">
        {/* 帮助 */}
        <Button variant="ghost" size="icon" className="hidden sm:flex">
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">帮助中心</span>
        </Button>

        {/* 通知 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              <span className="sr-only">通知</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>通知</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} 条未读
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium">{notification.title}</span>
                    {notification.unread && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {notification.description}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {notification.time}
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="justify-center">
              <Link href="/notifications" className="text-primary">
                查看全部通知
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 主题切换 */}
        <ThemeToggle />
      </div>
    </header>
  )
}
