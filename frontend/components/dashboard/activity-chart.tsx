"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

interface ActivityChartProps {
  title: string
  description?: string
  data: Array<{
    date: string
    projects: number
    reports: number
  }>
  className?: string
}

const chartConfig = {
  projects: {
    label: "项目数",
    color: "var(--color-chart-1)",
  },
  reports: {
    label: "报告数",
    color: "var(--color-chart-2)",
  },
} satisfies ChartConfig

export function ActivityChart({ title, description, data, className }: ActivityChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillProjects" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillReports" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(5)}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="reports"
              type="monotone"
              fill="url(#fillReports)"
              stroke="var(--color-chart-2)"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="projects"
              type="monotone"
              fill="url(#fillProjects)"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
