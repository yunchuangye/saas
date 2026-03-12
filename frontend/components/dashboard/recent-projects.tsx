"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, MapPin, Calendar, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Project {
  id: string
  name: string
  address: string
  status: string
  client: string
  createdAt: string
  href: string
}

interface RecentProjectsProps {
  title: string
  projects: Project[]
  viewAllHref?: string
  className?: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "待接单",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  "in-progress": {
    label: "进行中",
    className: "bg-info/10 text-info border-info/20",
  },
  review: {
    label: "审核中",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  completed: {
    label: "已完成",
    className: "bg-success/10 text-success border-success/20",
  },
  bidding: {
    label: "竞价中",
    className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
  "竞价中": {
    label: "竞价中",
    className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
  "审核中": {
    label: "审核中",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  "进行中": {
    label: "进行中",
    className: "bg-info/10 text-info border-info/20",
  },
  "已完成": {
    label: "已完成",
    className: "bg-success/10 text-success border-success/20",
  },
  "待接单": {
    label: "待接单",
    className: "bg-warning/10 text-warning border-warning/20",
  },
}

export function RecentProjects({ title, projects, viewAllHref, className }: RecentProjectsProps) {
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
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">暂无项目</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const config = statusConfig[project.status] || {
                label: project.status,
                className: "bg-muted text-muted-foreground border-muted",
              }
              return (
                <Link
                  key={project.id}
                  href={project.href}
                  className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{project.name}</span>
                      <Badge variant="outline" className={cn("shrink-0", config.className)}>
                        {config.label}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{project.address}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          <span>{project.client}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>{project.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground mt-1" />
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
