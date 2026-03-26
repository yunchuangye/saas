"use client";
import { useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface SSENotification {
  type: string;
  message?: string;
  projectId?: number;
  projectTitle?: string;
  oldStatus?: string;
  newStatus?: string;
  statusLabel?: string;
  timestamp?: string;
}

export type SSEHandler = (data: SSENotification) => void;

/**
 * SSE 实时通知 Hook
 * 自动连接后端 SSE 端点，接收实时推送
 */
export function useSSENotifications(onMessage?: SSEHandler) {
  const { toast } = useToast();
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCount = useRef(0);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.gujia.app";
    const url = `${backendUrl}/api/sse/notifications`;

    try {
      const es = new EventSource(url, { withCredentials: true });
      esRef.current = es;

      es.onopen = () => {
        reconnectCount.current = 0;
        console.log("[SSE] 实时通知已连接");
      };

      es.onmessage = (event) => {
        try {
          const data: SSENotification = JSON.parse(event.data);
          if (data.type === "connected") return; // 忽略连接确认消息

          // 调用自定义处理器
          if (onMessage) {
            onMessage(data);
          }

          // 默认显示 toast 通知
          if (data.type === "project_status_changed" && data.message) {
            toast({
              title: "项目状态更新",
              description: data.message,
            });
          }
        } catch (err) {
          console.error("[SSE] 解析消息失败:", err);
        }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;

        // 指数退避重连
        const delay = Math.min(1000 * Math.pow(2, reconnectCount.current), 30000);
        reconnectCount.current++;
        console.log(`[SSE] 连接断开，${delay / 1000}秒后重连...`);

        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        reconnectTimer.current = setTimeout(() => {
          connect();
        }, delay);
      };
    } catch (err) {
      console.error("[SSE] 连接失败:", err);
    }
  }, [onMessage, toast]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [connect]);
}
