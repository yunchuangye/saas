"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, Clock, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Task {
  id: string
  title: string
  description: string
  status: "pending" | "urgent" | "in-progress" | "completed"
  dueDate?: string
  projectId?: string
  href: string
}

interface TaskListProps {
  title: string
  tasks: Task[]
  viewAllHref?: string
  className?: string
}

const statusConfig = {
  pending: {
    label: "待处理",
    variant: "secondary" as const,
    icon: Clock,
  },
  urgent: {
    label: "紧急",
    variant: "destructive" as const,
    icon: AlertCircle,
  },
  "in-progress": {
    label: "进行中",
    variant: "default" as const,
    icon: Clock,
  },
  completed: {
    label: "已完成",
    variant: "outline" as const,
    icon: CheckCircle2,
  },
}

export function TaskList({ title, tasks, viewAllHref, className }: TaskListProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {viewAllHref && (
          <CardAction>
            <Button variant="ghost" size="sm" asChild>
              <Link href={viewAllHref}>
                查看全部
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">暂无待办任务</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const config = statusConfig[task.status]
              const StatusIcon = config.icon
              return (
                <Link
                  key={task.id}
                  href={task.href}
                  className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      task.status === "urgent"
                        ? "bg-destructive/10 text-destructive"
                        : task.status === "completed"
                        ? "bg-success/10 text-success"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {task.title}
                      </span>
                      <Badge variant={config.variant} className="shrink-0">
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {task.description}
                    </p>
                    {task.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        截止日期: {task.dueDate}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
