"use client";

/**
 * 多城市分站首页
 * ============================================================
 * 访问 sz.gujia.app / shenzhen.gujia.app 时自动重定向到此页面
 * 展示：城市楼市统计、分表信息、快捷入口
 */

import React from "react";
import { useRouter } from "next/navigation";
import { useCity, CitySelector } from "@/lib/city-context";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, TrendingUp, MapPin, Database, ArrowRight, Zap, Users, CheckCircle } from "lucide-react";
import Link from "next/link";

// ─── 统计卡片 ─────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, color, bg,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── 快捷入口 ─────────────────────────────────────────────────
function QuickLink({
  title, desc, href, icon: Icon, badge,
}: {
  title: string;
  desc: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}) {
  return (
    <Link href={href}>
      <Card className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary transition-colors">
              <Icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{title}</p>
                {badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── 主页面 ───────────────────────────────────────────────────
export default function CityHomePage() {
  const { city, regionNames } = useCity();
  const router = useRouter();

  // 获取城市分表统计
  const { data: shardInfo } = trpc.shardDirectory.getCityShardInfo.useQuery(
    { cityId: city.id },
    { enabled: !!city.id }
  );

  // 获取全局统计
  const { data: globalStats } = trpc.shardDirectory.globalStats.useQuery();

  const tierLabel = (tier: number) => {
    const map: Record<number, string> = {
      1: "一线城市", 2: "新一线城市", 3: "二线城市", 4: "三线城市", 5: "四线城市",
    };
    return map[tier] ?? "城市";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              估
            </div>
            <span className="font-semibold text-sm hidden sm:block">GuJia.App</span>
            <span className="text-muted-foreground text-sm hidden sm:block">·</span>
            <span className="text-sm text-muted-foreground hidden sm:block">
              {regionNames[city.region] ?? city.region} · {city.province}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CitySelector />
            <Button size="sm" onClick={() => router.push("/login")}>
              登录平台
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* 城市 Hero */}
        <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-primary/5 p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {tierLabel(city.tier)}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {regionNames[city.region] ?? city.region}
                </Badge>
              </div>
              <h1 className="text-4xl font-bold tracking-tight">
                {city.name}
                <span className="text-muted-foreground font-normal text-2xl ml-2">房产估价平台</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                {city.province} · 专业房地产评估服务 · 数据实时更新
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span>数据服务正常</span>
              </div>
              <span className="text-xs font-mono">
                分表 #{shardInfo?.shardIndex ?? city.id % 8} / {shardInfo?.shardCount ?? 8}
              </span>
              <span className="text-xs">城市 ID：{city.id}</span>
            </div>
          </div>
        </div>

        {/* 统计数据 */}
        <div>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {city.name}楼市数据
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="楼盘总数" value={shardInfo?.estateCount ?? 0}
              icon={Building2} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-950/30" />
            <StatCard label="楼栋数量" value={shardInfo?.buildingCount ?? 0}
              icon={Database} color="text-green-600" bg="bg-green-50 dark:bg-green-950/30" />
            <StatCard label="成交案例" value={shardInfo?.caseCount ?? 0}
              icon={TrendingUp} color="text-orange-600" bg="bg-orange-50 dark:bg-orange-950/30" />
            <StatCard label="全国城市" value={globalStats?.totalCities ?? 298}
              icon={MapPin} color="text-purple-600" bg="bg-purple-50 dark:bg-purple-950/30" />
          </div>
        </div>

        {/* 分表信息 */}
        {shardInfo && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                数据分表信息（{city.name}）
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
                  <div key={item.label} className="bg-muted/50 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs mb-1">{item.label}</p>
                    <p className="font-mono font-medium">{item.value}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      @ {shardInfo.dbName}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 快捷入口 */}
        <div>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            快捷入口
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickLink
              href="/dashboard/admin/directory/estates/virtual-page"
              title="楼盘字典"
              desc={`查看 ${city.name} 全部楼盘信息`}
              icon={Building2}
              badge="虚拟列表"
            />
            <QuickLink
              href="/dashboard/admin/directory/cases/virtual-page"
              title="成交案例库"
              desc={`${city.name} 历史成交案例，无限滚动`}
              icon={TrendingUp}
              badge="无限滚动"
            />
            <QuickLink
              href="/dashboard/appraiser/valuation"
              title="智能估价"
              desc={`AI + GeoHash 算法，${city.name} 房产快速估价`}
              icon={Zap}
              badge="AI 估价"
            />
            <QuickLink
              href="/dashboard/bank/demand/new"
              title="发起估价需求"
              desc="银行/机构发起房产评估委托"
              icon={Users}
            />
            <QuickLink
              href="/dashboard/customer/progress"
              title="进度追踪"
              desc="查看评估项目实时进度"
              icon={CheckCircle}
            />
            <QuickLink
              href="/login"
              title="登录管理后台"
              desc="管理员、评估师、银行用户登录"
              icon={MapPin}
            />
          </div>
        </div>

        {/* 技术信息 */}
        <div className="rounded-xl border bg-muted/30 p-5">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            分站技术信息
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[
              { label: "城市拼音", value: city.pinyin },
              { label: "数据分表", value: `estates_${shardInfo?.shardIndex ?? city.id % 8}` },
              { label: "分表规则", value: "city_id % 8" },
              { label: "所属大区", value: regionNames[city.region] ?? city.region },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-mono font-medium mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="border-t mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© 2026 GuJia.App · {city.name}分站</span>
          <span>数据基于单库分表架构，city_id % 8 路由</span>
        </div>
      </footer>
    </div>
  );
}
