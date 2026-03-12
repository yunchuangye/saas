"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, FileText, CheckCircle, Clock, Check } from "lucide-react"

const notifications = [
  {
    id: 1,
    type: "progress",
    title: "评估进度更新",
    content: "您的评估申请 APP-2024-001 已进入报告编制阶段",
    time: "2小时前",
    read: false,
    icon: FileText,
    iconColor: "text-info",
  },
  {
    id: 2,
    type: "completed",
    title: "报告已完成",
    content: "您的评估报告 RPT-2024-002 已完成，可以下载查看",
    time: "1天前",
    read: false,
    icon: CheckCircle,
    iconColor: "text-success",
  },
  {
    id: 3,
    type: "system",
    title: "系统通知",
    content: "欢迎使用gujia.app评估服务平台",
    time: "3天前",
    read: true,
    icon: Bell,
    iconColor: "text-muted-foreground",
  },
]

export default function CustomerNotificationsPage() {
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">通知消息</h1>
          <p className="text-muted-foreground">查看系统通知和评估进度提醒</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-info/10 text-info">
              {unreadCount} 条未读
            </Badge>
          )}
          <Button variant="outline" size="sm">
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
            {notifications.map((notification) => (
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
                  <Button variant="ghost" size="sm">
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
