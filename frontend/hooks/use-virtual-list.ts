/**
 * 通用虚拟列表 Hook
 * ============================================================
 * 封装 @tanstack/react-virtual，提供开箱即用的虚拟滚动能力
 * 支持固定行高和动态行高两种模式
 */
import { useRef, useCallback } from "react";
import { useVirtualizer, type VirtualizerOptions } from "@tanstack/react-virtual";

export interface UseVirtualListOptions<T> {
  /** 数据列表 */
  data: T[];
  /** 预估行高（像素），固定行高时传精确值 */
  estimateSize?: number;
  /** 预加载数量（可视区域外额外渲染的行数） */
  overscan?: number;
  /** 是否启用动态行高测量 */
  measureElement?: boolean;
}

export function useVirtualList<T>({
  data,
  estimateSize = 56,
  overscan = 5,
  measureElement = false,
}: UseVirtualListOptions<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizerOptions: Partial<VirtualizerOptions<HTMLDivElement, Element>> = {
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  };

  if (measureElement) {
    virtualizerOptions.measureElement =
      typeof window !== "undefined" && navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined;
  }

  const rowVirtualizer = useVirtualizer(virtualizerOptions as VirtualizerOptions<HTMLDivElement, Element>);

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  /** 滚动到指定 index */
  const scrollToIndex = useCallback(
    (index: number, options?: { align?: "start" | "center" | "end" | "auto" }) => {
      rowVirtualizer.scrollToIndex(index, options);
    },
    [rowVirtualizer]
  );

  /** 滚动到顶部 */
  const scrollToTop = useCallback(() => {
    rowVirtualizer.scrollToOffset(0);
  }, [rowVirtualizer]);

  return {
    parentRef,
    virtualItems,
    totalSize,
    scrollToIndex,
    scrollToTop,
    virtualizer: rowVirtualizer,
  };
}
