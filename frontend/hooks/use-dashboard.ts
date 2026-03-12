"use client";

import { trpc } from "@/lib/trpc";

/**
 * 仪表盘统计数据 Hook
 * 自动根据用户角色返回对应的统计数据
 */
export function useDashboardStats() {
  return trpc.dashboard.stats.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    retry: 1,
  });
}

/**
 * 活动图表数据 Hook
 */
export function useActivityChart(days: number = 30) {
  return trpc.dashboard.activityChart.useQuery(
    { days },
    { staleTime: 5 * 60 * 1000 }
  );
}

/**
 * 最近项目 Hook
 */
export function useRecentProjects(limit: number = 5) {
  return trpc.dashboard.recentProjects.useQuery(
    { limit },
    { staleTime: 2 * 60 * 1000 }
  );
}

/**
 * 未读通知数量 Hook
 */
export function useUnreadCount() {
  return trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 60 * 1000, // 每分钟刷新一次
  });
}
