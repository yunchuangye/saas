"use client"
import { Megaphone, TrendingUp, Users, Eye } from "lucide-react"
import { useSalesOverview } from "@/hooks/use-sales"

interface SalesOverviewBannerProps {
  roleLabel: string
  roleColor: string
}

export function SalesOverviewBanner({ roleLabel, roleColor }: SalesOverviewBannerProps) {
  const { data } = useSalesOverview()

  const stats = [
    { label: "营销活动", value: data?.totalCampaigns ?? 0, icon: Megaphone },
    { label: "总曝光量", value: data?.totalViews ?? 0, icon: Eye },
    { label: "获客线索", value: data?.totalLeads ?? 0, icon: Users },
    { label: "转化率", value: `${data?.conversionRate ?? 0}%`, icon: TrendingUp },
  ]

  return (
    <div className={`rounded-2xl p-6 text-white ${roleColor}`}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">营销推广中心</h2>
          <p className="mt-1 text-sm opacity-80">{roleLabel} · 专属营销工具套件</p>
        </div>
        <div className="rounded-xl bg-white/20 p-3">
          <Megaphone className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white/15 p-3">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="h-3.5 w-3.5 opacity-80" />
              <span className="text-xs opacity-80">{s.label}</span>
            </div>
            <p className="text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
