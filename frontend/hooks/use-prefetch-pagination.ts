/**
 * 分页预获取 Hook（Prefetching Pagination）
 * ============================================================
 * 利用 react-query 的 prefetchQuery 能力，在用户悬停分页按钮时
 * 提前加载下一页数据，实现"零延迟"翻页体验
 *
 * 使用方式：
 * ```tsx
 * const { page, setPage, prefetchPage } = usePrefetchPagination({
 *   queryFn: (p) => trpc.directory.listEstates.query({ page: p, pageSize: 20 }),
 *   queryKey: ['directory', 'listEstates'],
 *   totalPages,
 * });
 *
 * // 在分页按钮上
 * <button onMouseEnter={() => prefetchPage(page + 1)} onClick={() => setPage(page + 1)}>
 *   下一页
 * </button>
 * ```
 */
import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export interface UsePrefetchPaginationOptions<T> {
  /** 查询函数，接收页码，返回 Promise */
  queryFn: (page: number) => Promise<T>;
  /** react-query 缓存 key（数组形式） */
  queryKey: readonly unknown[];
  /** 总页数 */
  totalPages: number;
  /** 初始页码，默认 1 */
  initialPage?: number;
  /** 缓存时间（毫秒），默认 5 分钟 */
  staleTime?: number;
}

export function usePrefetchPagination<T>({
  queryFn,
  queryKey,
  totalPages,
  initialPage = 1,
  staleTime = 5 * 60 * 1000,
}: UsePrefetchPaginationOptions<T>) {
  const [page, setPageState] = useState(initialPage);
  const queryClient = useQueryClient();

  /** 预获取指定页数据 */
  const prefetchPage = useCallback(
    (targetPage: number) => {
      if (targetPage < 1 || targetPage > totalPages) return;
      queryClient.prefetchQuery({
        queryKey: [...queryKey, { page: targetPage }],
        queryFn: () => queryFn(targetPage),
        staleTime,
      });
    },
    [queryClient, queryKey, queryFn, totalPages, staleTime]
  );

  /** 设置页码，并预获取相邻页 */
  const setPage = useCallback(
    (newPage: number) => {
      setPageState(newPage);
      // 预获取前后页
      prefetchPage(newPage - 1);
      prefetchPage(newPage + 1);
    },
    [prefetchPage]
  );

  /** 鼠标悬停时预获取 */
  const onHoverPage = useCallback(
    (targetPage: number) => {
      prefetchPage(targetPage);
    },
    [prefetchPage]
  );

  return { page, setPage, prefetchPage, onHoverPage };
}
