/**
 * tRPC 客户端配置
 *
 * 后端地址通过 NEXT_PUBLIC_BACKEND_URL 环境变量在 build 时编译进 bundle。
 * 配置方式：在 frontend/.env.local 中设置 NEXT_PUBLIC_BACKEND_URL=https://api.gujia.app
 * 修改后需要重新执行 pnpm build。
 */
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../backend/server/routers";

export const trpc = createTRPCReact<AppRouter>();

// build 时由 Next.js 从 .env.local 读取并编译进 bundle
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8721";

export { BACKEND_URL };

/**
 * 从 document.cookie 中读取 token（仅客户端可用）
 */
function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * 创建 tRPC 客户端
 *
 * 认证策略：
 * 1. 同域（localhost 开发）：使用 cookie（credentials: include）
 * 2. 跨域（公网代理）：从 document.cookie 读取 token 并附加 Authorization header
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${BACKEND_URL}/api/trpc`,
        transformer: superjson,
        fetch(url, options) {
          // 获取 token 并附加到 Authorization header（支持跨域场景）
          const token = getTokenFromCookie();
          const headers: Record<string, string> = {};
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }
          return fetch(url, {
            ...options,
            credentials: "include", // 同域时携带 cookie
            headers: {
              ...(options?.headers as Record<string, string> || {}),
              ...headers,
            },
          });
        },
      }),
    ],
  });
}

// 兼容旧代码的同步获取函数
export function getBackendUrlSync(): string {
  return BACKEND_URL;
}
