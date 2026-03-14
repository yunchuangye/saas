/**
 * tRPC 客户端配置
 * 连接到 gujia.app 后端 API 服务
 */
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../backend/server/routers";

export const trpc = createTRPCReact<AppRouter>();

// 后端API地址 - 通过环境变量配置
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:8721";

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${BACKEND_URL}/api/trpc`,
        transformer: superjson,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include", // 携带cookie用于认证
          });
        },
      }),
    ],
  });
}
