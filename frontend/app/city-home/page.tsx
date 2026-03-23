"use client";
/**
 * 城市分站首页
 * 当用户访问 sz.gujia.app 时，重定向到此页面
 * 展示当前城市的楼盘数据、案例统计和快速入口
 */
import { useCity } from "@/lib/city-context";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, TrendingUp, MapPin, Database, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CityHomePage() {
  const { city } = useCity();

  const { data: shardInfo } = trpc.shardDirectory.getCityShardInfo.useQuery(
    { cityId: city.cityId },
    { enabled: !!city.cityId }
  );

  const { data: globalStats } = trpc.shardDirectory.globalStats.useQuery();

  const regionStats = globalStats?.[city.cityRegion] as Record<string, number> | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* 头部 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-slate-900">
              {city.cityName} · 房产估价平台
            </h1>
          </div>
          <p className="text-slate-500 text-lg">
            专注{city.cityName}本地房产数据，提供精准的房产评估服务
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge variant="outline" className="text-xs">
              数据区域：{shardInfo?.region ?? city.cityRegion}
            </Badge>
            <Badge variant="outline" className="text-xs">
              数据库：{shardInfo?.dbName ?? "加载中..."}
            </Badge>
          </div>
        </div>

        {/* 数据统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "楼盘数据", value: regionStats?.estates ?? 0, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "楼栋数据", value: regionStats?.buildings ?? 0, icon: Database, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "房屋单元", value: regionStats?.units ?? 0, icon: MapPin, color: "text-violet-600", bg: "bg-violet-50" },
            { label: "成交案例", value: regionStats?.cases ?? 0, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((item) => (
            <Card key={item.label} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${item.bg}`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {item.value.toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-500">{item.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 分片信息详情 */}
        {shardInfo && (
          <Card className="mb-8 border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                数据分片信息（{city.cityName}）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {[
                  { label: "楼盘表", value: shardInfo.tableEstates },
                  { label: "楼栋表", value: shardInfo.tableBuildings },
                  { label: "房屋表", value: shardInfo.tableUnits },
                  { label: "案例表", value: shardInfo.tableCases },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-slate-500 text-xs mb-1">{item.label}</p>
                    <p className="font-mono font-medium text-slate-800">{item.value}</p>
                    <p className="text-slate-400 text-xs mt-0.5">@ {shardInfo.dbName}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 快速入口 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "楼盘字典",
              desc: `浏览${city.cityName}全量楼盘数据`,
              href: "/dashboard/admin/directory/estates",
              icon: Building2,
            },
            {
              title: "成交案例",
              desc: `查看${city.cityName}近期成交记录`,
              href: "/dashboard/admin/directory/cases",
              icon: TrendingUp,
            },
            {
              title: "发起估价",
              desc: `为${city.cityName}房产申请评估报告`,
              href: "/dashboard/customer/demand/new",
              icon: MapPin,
            },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
