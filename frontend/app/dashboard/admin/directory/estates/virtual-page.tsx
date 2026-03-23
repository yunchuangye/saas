"use client";
/**
 * 楼盘字典 - 虚拟列表版本（高性能）
 * ============================================================
 * 使用 @tanstack/react-virtual 实现虚拟滚动
 * 使用 react-query v5 Prefetching 实现零延迟翻页
 * 支持城市分站数据隔离（通过 useCity hook）
 *
 * 优化点：
 * 1. keepPreviousData → placeholderData: keepPreviousData（v5 兼容）
 * 2. 翻页时保留上一页数据，避免白屏闪烁
 * 3. 鼠标悬停分页按钮时预获取目标页
 * 4. 搜索防抖 300ms，减少无效请求
 * 5. 虚拟列表 overscan=10，滚动更流畅
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { trpc } from "@/lib/trpc";
import { useCity } from "@/lib/city-context";
import { useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Search, Building2, MapPin, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Zap, X,
} from "lucide-react";
import { CitySelector } from "@/lib/city-context";

const PAGE_SIZE = 50;

export default function EstatesVirtualPage() {
  const { city } = useCity();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const parentRef = useRef<HTMLDivElement>(null);

  // 搜索防抖 300ms
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // 城市切换时重置分页
  useEffect(() => {
    setPage(1);
    setSearch("");
    setSearchInput("");
  }, [city.id]);

  // ─── 数据获取（v5 API）──────────────────────────────────────
  const { data, isLoading, isFetching, isPlaceholderData } =
    trpc.shardDirectory.estates.list.useQuery(
      { cityId: city.id, page, pageSize: PAGE_SIZE, search: search || undefined },
      {
        staleTime: 5 * 60 * 1000,
        placeholderData: keepPreviousData, // v5 写法：翻页时保留上一页数据，避免白屏
      }
    );

  const estates = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ─── 预获取（Prefetching）——鼠标悬停时触发 ──────────────────
  const prefetchPage = useCallback(
    (targetPage: number) => {
      if (targetPage < 1 || targetPage > totalPages) return;
      queryClient.prefetchQuery({
        queryKey: getQueryKey(
          trpc.shardDirectory.estates.list,
          { cityId: city.id, page: targetPage, pageSize: PAGE_SIZE, search: search || undefined },
          "query"
        ),
        queryFn: () =>
          trpc.shardDirectory.estates.list.query({
            cityId: city.id, page: targetPage, pageSize: PAGE_SIZE, search: search || undefined,
          }),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient, city.id, search, totalPages]
  );

  // 自动预获取下一页（当前页加载完成后立即预获取）
  useEffect(() => {
    if (!isFetching && page < totalPages) {
      prefetchPage(page + 1);
    }
  }, [isFetching, page, totalPages, prefetchPage]);

  // ─── 虚拟列表配置 ────────────────────────────────────────────
  const rowVirtualizer = useVirtualizer({
    count: estates.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // ─── 翻页处理 ────────────────────────────────────────────────
  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    if (parentRef.current) parentRef.current.scrollTop = 0;
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
            {city.name} · 共 {total.toLocaleString()} 个楼盘
            {isPlaceholderData && (
              <span className="ml-2 text-xs text-amber-500">（加载中...）</span>
            )}
          </p>
        </div>
        <CitySelector />
      </div>

      {/* 搜索栏 */}
      <div className="flex gap-2 flex-shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 pr-9"
            placeholder="搜索楼盘名称或地址（实时搜索）..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchInput("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* 加载状态指示器 */}
        {isFetching && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground px-2">
            <div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">加载中</span>
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
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : estates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Building2 className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">暂无楼盘数据</p>
              <p className="text-xs mt-1">请先通过爬虫采集{city.name}楼盘数据</p>
            </div>
          ) : (
            <div
              ref={parentRef}
              className="overflow-auto"
              style={{ height: "calc(100vh - 380px)", minHeight: "300px" }}
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
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

      {/* 分页器（带 Prefetching 零延迟翻页） */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between flex-shrink-0 pt-1">
          <p className="text-sm text-muted-foreground">
            第 <span className="font-medium text-foreground">{page}</span> / {totalPages} 页，共{" "}
            <span className="font-medium text-foreground">{total.toLocaleString()}</span> 条
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="sm"
              disabled={page === 1 || isPlaceholderData}
              onClick={() => goToPage(1)}
              title="第一页"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={page === 1 || isPlaceholderData}
              onClick={() => goToPage(page - 1)}
              onMouseEnter={() => prefetchPage(page - 1)}
              title="上一页"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* 页码按钮（显示前后2页，共5个） */}
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
                  disabled={isPlaceholderData && p !== page}
                >
                  {p}
                </Button>
              );
            })}

            <Button
              variant="outline" size="sm"
              disabled={page === totalPages || isPlaceholderData}
              onClick={() => goToPage(page + 1)}
              onMouseEnter={() => prefetchPage(page + 1)}
              title="下一页"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={page === totalPages || isPlaceholderData}
              onClick={() => goToPage(totalPages)}
              title="最后一页"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
