"use client";
/**
 * 通用虚拟列表表格组件
 * ============================================================
 * 基于 @tanstack/react-virtual 封装的高性能表格组件
 * 支持固定列头、虚拟滚动、自定义行渲染
 */
import { useRef, type ReactNode, type CSSProperties } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface VirtualTableColumn<T> {
  key: string;
  title: string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (value: any, row: T, index: number) => ReactNode;
}

export interface VirtualTableProps<T> {
  /** 数据列表 */
  data: T[];
  /** 列定义 */
  columns: VirtualTableColumn<T>[];
  /** 是否加载中 */
  loading?: boolean;
  /** 空状态内容 */
  emptyContent?: ReactNode;
  /** 预估行高（像素） */
  rowHeight?: number;
  /** 容器高度 */
  height?: string | number;
  /** 额外的容器 className */
  className?: string;
  /** 行点击事件 */
  onRowClick?: (row: T, index: number) => void;
  /** 行 key 提取函数 */
  rowKey?: (row: T, index: number) => string | number;
}

export function VirtualTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyContent,
  rowHeight = 56,
  height = "calc(100vh - 340px)",
  className,
  onRowClick,
  rowKey,
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 6,
    measureElement:
      typeof window !== "undefined" && navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // 生成列宽样式
  const colStyle = (col: VirtualTableColumn<T>): CSSProperties => ({
    width: col.width ?? "auto",
    flex: col.width ? `0 0 ${col.width}` : "1",
    textAlign: col.align ?? "left",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    paddingLeft: "12px",
    paddingRight: "12px",
  });

  if (loading) {
    return (
      <div className={cn("rounded-md border overflow-hidden", className)}>
        {/* 表头骨架 */}
        <div className="flex items-center h-10 bg-muted/30 border-b px-3">
          {columns.map((col) => (
            <div key={col.key} style={colStyle(col)}>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        {/* 行骨架 */}
        <div className="p-3 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border overflow-hidden flex flex-col", className)}>
      {/* 固定表头 */}
      <div className="flex items-center h-10 bg-muted/30 border-b flex-shrink-0">
        {columns.map((col) => (
          <div
            key={col.key}
            style={colStyle(col)}
            className="text-xs font-medium text-muted-foreground"
          >
            {col.title}
          </div>
        ))}
      </div>

      {/* 虚拟滚动区域 */}
      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-12 text-muted-foreground text-sm">
          {emptyContent ?? "暂无数据"}
        </div>
      ) : (
        <div
          ref={parentRef}
          className="overflow-auto flex-1"
          style={{ height: typeof height === "number" ? `${height}px` : height }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualItems.map((virtualRow) => {
              const row = data[virtualRow.index];
              const key = rowKey ? rowKey(row, virtualRow.index) : virtualRow.key;
              return (
                <div
                  key={key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={cn(
                    "flex items-center border-b hover:bg-muted/30 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(row, virtualRow.index)}
                >
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      style={{ ...colStyle(col), paddingTop: "10px", paddingBottom: "10px" }}
                      className="text-sm"
                    >
                      {col.render
                        ? col.render(row[col.key], row, virtualRow.index)
                        : (row[col.key] ?? "—")}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 底部统计（开发模式显示虚拟化效果） */}
      {process.env.NODE_ENV === "development" && data.length > 0 && (
        <div className="flex-shrink-0 border-t px-3 py-1.5 text-xs text-muted-foreground bg-muted/20">
          虚拟化：渲染 {virtualItems.length} / {data.length} 行（节省 {Math.max(0, data.length - virtualItems.length)} 个 DOM 节点）
        </div>
      )}
    </div>
  );
}
