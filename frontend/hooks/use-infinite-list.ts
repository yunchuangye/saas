/**
 * 无限滚动 Hook
 * ============================================================
 * 结合 @tanstack/react-virtual 和 tRPC useInfiniteQuery
 * 当用户滚动到列表底部时自动加载下一页数据
 */
import { useRef, useEffect, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export interface UseInfiniteListOptions {
  /** 已加载的总数据量 */
  totalCount: number;
  /** 是否还有更多数据 */
  hasNextPage: boolean;
  /** 是否正在加载下一页 */
  isFetchingNextPage: boolean;
  /** 加载下一页的函数 */
  fetchNextPage: () => void;
  /** 预估行高 */
  estimateSize?: number;
  /** 触发加载的阈值（距底部多少条时触发） */
  loadMoreThreshold?: number;
}

export function useInfiniteList({
  totalCount,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  estimateSize = 56,
  loadMoreThreshold = 5,
}: UseInfiniteListOptions) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? totalCount + 1 : totalCount, // +1 为 loading 占位行
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // 监听滚动，接近底部时自动加载下一页
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;

    if (
      lastItem.index >= totalCount - loadMoreThreshold &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [virtualItems, totalCount, hasNextPage, isFetchingNextPage, fetchNextPage, loadMoreThreshold]);

  return {
    parentRef,
    virtualItems,
    totalSize: rowVirtualizer.getTotalSize(),
    virtualizer: rowVirtualizer,
  };
}
