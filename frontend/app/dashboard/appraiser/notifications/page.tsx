"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, FileText, TrendingUp, CheckCircle, AlertCircle, Clock, Check } from "lucide-react"

const notifications = [
  {
    id: 1,
    type: "bidding",
    title: "新竞价项目",
    content: "中国银行朝阳支行发布了新的商业评估项目，预算¥50,000-¥80,000",
    time: "10分钟前",
    read: false,
    icon: TrendingUp,
    iconColor: "text-info",
  },
  {
    id: 2,
    type: "review",
    title: "报告审核通过",
    content: "您提交的《西城区办公楼评估报告》已通过审核",
    time: "1小时前",
    read: false,
    icon: CheckCircle,
    iconColor: "text-success",
  },
  {
    id: 3,
    type: "deadline",
    title: "项目截止提醒",
    content: "PRJ-2024-001 项目将于3天后截止，请尽快完成报告编制",
    time: "2小时前",
    read: false,
    icon: AlertCircle,
    iconColor: "text-warning",
  },
  {
    id: 4,
    type: "project",
    title: "新项目分配",
    content: "您被分配了新项目：大兴区商业综合体评估",
    time: "5小时前",
    read: true,
    icon: FileText,
    iconColor: "text-muted-foreground",
  },
  {
    id: 5,
    type: "system",
    title: "系统维护通知",
    content: "系统将于本周日凌晨2:00-4:00进行维护升级",
    time: "1天前",
    read: true,
    icon: Bell,
    iconColor: "text-muted-foreground",
  },
]

export default function AppraiserNotificationsPage() {
  const [notificationList, setNotificationList] = useState(notifications)
  const unreadCount = notificationList.filter((n) => !n.read).length

  const markAsRead = (id: number) => {
    setNotificationList(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotificationList(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">系统通知</h1>
          <p className="text-muted-foreground">查看所有系统通知和提醒</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-info/10 text-info">
              {unreadCount} 条未读
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <Check className="mr-2 h-4 w-4" />
            全部标记已读
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>通知列表</CardTitle>
          <CardDescription>最近30天的通知</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notificationList.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                  notification.read ? "bg-background" : "bg-accent/50"
                }`}
              >
                <div className={`p-2 rounded-full bg-muted ${notification.iconColor}`}>
                  <notification.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{notification.title}</p>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-info" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.content}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {notification.time}
                  </p>
                </div>
                {!notification.read && (
                  <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                    标记已读
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
