"use client";
/**
 * 楼盘字典 - 虚拟列表版本（高性能）
 * ============================================================
 * 使用 @tanstack/react-virtual 实现虚拟滚动
 * 使用 react-query Prefetching 实现零延迟翻页
 * 支持城市分站数据隔离（通过 useCity hook）
 */
import { useState, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { trpc } from "@/lib/trpc";
import { useCity } from "@/lib/city-context";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Search, Building2, MapPin, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Zap,
} from "lucide-react";
import { CitySelector } from "@/lib/city-context";

const PAGE_SIZE = 50; // 虚拟列表每页加载更多数据

export default function EstatesVirtualPage() {
  const { city } = useCity();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const parentRef = useRef<HTMLDivElement>(null);

  // ─── 数据获取 ────────────────────────────────────────────────
  const { data, isLoading, isFetching } = trpc.shardDirectory.estates.list.useQuery(
    { cityId: city.cityId, page, pageSize: PAGE_SIZE, search: search || undefined },
    { staleTime: 5 * 60 * 1000, keepPreviousData: true } // 5分钟缓存
  );

  const estates = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ─── 预获取（Prefetching）────────────────────────────────────
  const prefetchPage = useCallback(
    (targetPage: number) => {
      if (targetPage < 1 || targetPage > totalPages) return;
      queryClient.prefetchQuery({
        queryKey: getQueryKey(
          trpc.shardDirectory.estates.list,
          { cityId: city.cityId, page: targetPage, pageSize: PAGE_SIZE, search: search || undefined },
          "query"
        ),
        queryFn: () =>
          trpc.shardDirectory.estates.list.query({
            cityId: city.cityId, page: targetPage, pageSize: PAGE_SIZE, search: search || undefined,
          }),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient, city.cityId, search, totalPages]
  );

  // ─── 虚拟列表配置 ────────────────────────────────────────────
  const rowVirtualizer = useVirtualizer({
    count: estates.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // 每行预估 64px
    overscan: 8,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // ─── 翻页处理 ────────────────────────────────────────────────
  const goToPage = (p: number) => {
    setPage(p);
    // 翻页后滚动到顶部
    if (parentRef.current) parentRef.current.scrollTop = 0;
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            楼盘字典
            <Badge variant="secondary" className="text-xs font-normal">
              <Zap className="h-3 w-3 mr-1" />虚拟列表
            </Badge>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {city.cityName} · 共 {total.toLocaleString()} 个楼盘
          </p>
        </div>
        <CitySelector />
      </div>

      {/* 搜索栏 */}
      <div className="flex gap-2 flex-shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="搜索楼盘名称或地址..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} variant="outline">搜索</Button>
        {search && (
          <Button variant="ghost" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}>
            清除
          </Button>
        )}
        {isFetching && !isLoading && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            加载中...
          </div>
        )}
      </div>

      {/* 分片信息提示 */}
      {data?.shardInfo && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-1.5 flex-shrink-0">
          <MapPin className="h-3 w-3" />
          <span>数据分片：<code className="font-mono">{data.shardInfo.dbName}.{data.shardInfo.tableEstates}</code></span>
          <span className="text-muted-foreground/50">|</span>
          <span>大区：{data.shardInfo.region}</span>
        </div>
      )}

      {/* 虚拟列表容器 */}
      <Card className="flex-1 overflow-hidden">
        <CardHeader className="py-3 px-4 border-b bg-muted/30">
          <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground">
            <span className="col-span-4">楼盘名称</span>
            <span className="col-span-3">地址</span>
            <span className="col-span-2">开发商</span>
            <span className="col-span-1 text-center">建成年份</span>
            <span className="col-span-1 text-center">总套数</span>
            <span className="col-span-1 text-center">状态</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : estates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Building2 className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">暂无楼盘数据</p>
              <p className="text-xs mt-1">请先通过爬虫采集{city.cityName}楼盘数据</p>
            </div>
          ) : (
            /* 虚拟滚动容器 */
            <div
              ref={parentRef}
              className="overflow-auto"
              style={{ height: "calc(100vh - 380px)", minHeight: "300px" }}
            >
              {/* 撑开总高度的占位容器 */}
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {/* 只渲染可视区域内的行 */}
                {virtualItems.map((virtualRow) => {
                  const estate = estates[virtualRow.index];
                  if (!estate) return null;
                  return (
                    <div
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="grid grid-cols-12 items-center px-4 py-3 border-b hover:bg-muted/30 transition-colors text-sm"
                    >
                      <div className="col-span-4">
                        <p className="font-medium truncate">{estate.name}</p>
                        {estate.propertyType && (
                          <Badge variant="outline" className="text-xs mt-0.5">
                            {estate.propertyType}
                          </Badge>
                        )}
                      </div>
                      <div className="col-span-3 text-muted-foreground text-xs truncate pr-2">
                        {estate.address || "—"}
                      </div>
                      <div className="col-span-2 text-muted-foreground text-xs truncate pr-2">
                        {estate.developer || "—"}
                      </div>
                      <div className="col-span-1 text-center text-muted-foreground text-xs">
                        {estate.buildYear || "—"}
                      </div>
                      <div className="col-span-1 text-center text-muted-foreground text-xs">
                        {estate.totalUnits?.toLocaleString() || "—"}
                      </div>
                      <div className="col-span-1 text-center">
                        <Badge
                          variant={estate.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {estate.isActive ? "正常" : "停用"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 分页器（带 Prefetching） */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between flex-shrink-0 pt-1">
          <p className="text-sm text-muted-foreground">
            第 {page} / {totalPages} 页，共 {total.toLocaleString()} 条
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="sm"
              disabled={page === 1}
              onClick={() => goToPage(1)}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={page === 1}
              onClick={() => goToPage(page - 1)}
              onMouseEnter={() => prefetchPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* 页码按钮（显示前后2页） */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  className="w-9"
                  onClick={() => goToPage(p)}
                  onMouseEnter={() => prefetchPage(p)}
                >
                  {p}
                </Button>
              );
            })}

            <Button
              variant="outline" size="sm"
              disabled={page === totalPages}
              onClick={() => goToPage(page + 1)}
              onMouseEnter={() => prefetchPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={page === totalPages}
              onClick={() => goToPage(totalPages)}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
