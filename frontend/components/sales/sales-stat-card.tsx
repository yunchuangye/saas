"use client"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface SalesStatCardProps {
  title: string
  value: string | number
  sub?: string
  icon: LucideIcon
  color?: "blue" | "green" | "orange" | "purple" | "red"
  trend?: { value: number; label: string }
}

const colorMap = {
  blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   border: "border-blue-100" },
  green:  { bg: "bg-green-50",  icon: "text-green-600",  border: "border-green-100" },
  orange: { bg: "bg-orange-50", icon: "text-orange-600", border: "border-orange-100" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-100" },
  red:    { bg: "bg-red-50",    icon: "text-red-600",    border: "border-red-100" },
}

export function SalesStatCard({ title, value, sub, icon: Icon, color = "blue", trend }: SalesStatCardProps) {
  const c = colorMap[color]
  return (
    <Card className={cn("border", c.border)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
            {trend && (
              <p className={cn("mt-1 text-xs font-medium", trend.value >= 0 ? "text-green-600" : "text-red-500")}>
                {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </div>
          <div className={cn("rounded-xl p-2.5", c.bg)}>
            <Icon className={cn("h-5 w-5", c.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
