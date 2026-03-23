"use client";
/**
 * 成交案例库 - 虚拟列表 + 无限滚动版本
 * ============================================================
 * 使用 useInfiniteQuery + @tanstack/react-virtual
 * 滚动到底部自动加载下一页，无需手动翻页
 * 支持城市分站数据隔离
 */
import { useRef, useEffect, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { trpc } from "@/lib/trpc";
import { useCity } from "@/lib/city-context";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, TrendingUp, Zap, Loader2, MapPin } from "lucide-react";
import { CitySelector } from "@/lib/city-context";

const PAGE_SIZE = 30;

export default function CasesVirtualPage() {
  const { city } = useCity();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [transactionType, setTransactionType] = useState<"sale" | "rent" | "all">("all");
  const parentRef = useRef<HTMLDivElement>(null);

  // ─── 无限滚动数据获取 ────────────────────────────────────────
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
  } = trpc.shardDirectory.cases.list.useInfiniteQuery(
    {
      cityId: city.id,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      transactionType: transactionType === "all" ? undefined : transactionType,
    },
    {
      getNextPageParam: (lastPage: any) => {
        const nextPage = lastPage.page + 1;
        const totalPages = Math.ceil(lastPage.total / PAGE_SIZE);
        return nextPage <= totalPages ? nextPage : undefined;
      },
      staleTime: 3 * 60 * 1000,
    }
  );

  // 将所有页的数据合并为一个扁平数组
  const allCases = data?.pages.flatMap((page: any) => page.items) ?? [];
  const totalCount = data?.pages[0]?.total ?? 0;

  // ─── 虚拟列表配置 ────────────────────────────────────────────
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allCases.length + 1 : allCases.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // ─── 监听滚动，接近底部时自动加载 ────────────────────────────
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;
    if (
      lastItem.index >= allCases.length - 5 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [virtualItems, allCases.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSearch = () => {
    setSearch(searchInput);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            成交案例库
            <Badge variant="secondary" className="text-xs font-normal">
              <Zap className="h-3 w-3 mr-1" />无限滚动
            </Badge>
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {city.name} · 已加载 {allCases.length.toLocaleString()} / {totalCount.toLocaleString()} 条
          </p>
        </div>
        <CitySelector />
      </div>

      {/* 筛选栏 */}
      <div className="flex gap-2 flex-shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="搜索地址、小区名..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Select
          value={transactionType}
          onValueChange={(v) => setTransactionType(v as any)}
        >
          <SelectTrigger className="w-28">
            <SelectValue placeholder="交易类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="sale">出售</SelectItem>
            <SelectItem value="rent">出租</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} variant="outline">搜索</Button>
        {isFetching && !isLoading && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            加载中...
          </div>
        )}
      </div>

      {/* 分片信息 */}
      {data?.pages[0]?.shardInfo && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-1.5 flex-shrink-0">
          <MapPin className="h-3 w-3" />
          <span>数据分片：<code className="font-mono">{data.pages[0].shardInfo.dbName}.{data.pages[0].shardInfo.tableCases}</code></span>
        </div>
      )}

      {/* 虚拟列表 */}
      <Card className="flex-1 overflow-hidden">
        <CardHeader className="py-3 px-4 border-b bg-muted/30">
          <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground">
            <span className="col-span-3">地址 / 小区</span>
            <span className="col-span-1 text-center">面积</span>
            <span className="col-span-1 text-center">楼层</span>
            <span className="col-span-1 text-center">户型</span>
            <span className="col-span-2 text-right">单价（元/㎡）</span>
            <span className="col-span-2 text-right">总价（万元）</span>
            <span className="col-span-1 text-center">类型</span>
            <span className="col-span-1 text-center">成交日期</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : allCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">暂无案例数据</p>
              <p className="text-xs mt-1">请先通过爬虫采集{city.name}成交案例</p>
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
                  const isLoaderRow = virtualRow.index > allCases.length - 1;
                  const caseItem = allCases[virtualRow.index];

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
                    >
                      {isLoaderRow ? (
                        /* 底部加载指示器 */
                        <div className="flex items-center justify-center py-4 text-sm text-muted-foreground gap-2">
                          {isFetchingNextPage ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              正在加载更多...
                            </>
                          ) : (
                            <span>已加载全部数据</span>
                          )}
                        </div>
                      ) : (
                        /* 案例数据行 */
                        <div className="grid grid-cols-12 items-center px-4 py-3 border-b hover:bg-muted/30 transition-colors text-sm">
                          <div className="col-span-3">
                            <p className="font-medium truncate text-sm">
                              {caseItem.community || caseItem.address || "—"}
                            </p>
                            {caseItem.address && caseItem.community && (
                              <p className="text-xs text-muted-foreground truncate">
                                {caseItem.address}
                              </p>
                            )}
                          </div>
                          <div className="col-span-1 text-center text-muted-foreground text-xs">
                            {caseItem.area ? `${caseItem.area}㎡` : "—"}
                          </div>
                          <div className="col-span-1 text-center text-muted-foreground text-xs">
                            {caseItem.floor && caseItem.totalFloors
                              ? `${caseItem.floor}/${caseItem.totalFloors}`
                              : caseItem.floor || "—"}
                          </div>
                          <div className="col-span-1 text-center text-muted-foreground text-xs">
                            {caseItem.rooms || "—"}
                          </div>
                          <div className="col-span-2 text-right font-medium text-sm">
                            {caseItem.unitPrice
                              ? Number(caseItem.unitPrice).toLocaleString()
                              : "—"}
                          </div>
                          <div className="col-span-2 text-right text-muted-foreground text-sm">
                            {caseItem.totalPrice
                              ? `${(caseItem.totalPrice / 10000).toFixed(1)}万`
                              : "—"}
                          </div>
                          <div className="col-span-1 text-center">
                            <Badge
                              variant={caseItem.transactionType === "sale" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {caseItem.transactionType === "sale" ? "出售" : "出租"}
                            </Badge>
                          </div>
                          <div className="col-span-1 text-center text-muted-foreground text-xs">
                            {caseItem.dealDate
                              ? new Date(caseItem.dealDate).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })
                              : "—"}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 底部统计 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground flex-shrink-0">
        <span>
          已渲染 DOM 节点：<strong className="text-foreground">{virtualItems.length}</strong> 个
          （总数据 {allCases.length.toLocaleString()} 条，节省 {Math.max(0, allCases.length - virtualItems.length).toLocaleString()} 个 DOM 节点）
        </span>
        {hasNextPage && (
          <Button
            variant="outline" size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />加载中</>
            ) : "加载更多"}
          </Button>
        )}
      </div>
    </div>
  );
}
