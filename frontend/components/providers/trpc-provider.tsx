"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { trpc, createTRPCClient } from "@/lib/trpc";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
          },
        },
      })
  );

  // 使用 useRef 存储 trpcClient，确保在 window.__BACKEND_URL__ 已注入后创建
  // window.__BACKEND_URL__ 由 layout.tsx 的 SSR 内联 <script> 注入，
  // 在客户端 JS 执行时已经可用（内联脚本先于模块脚本执行）
  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
