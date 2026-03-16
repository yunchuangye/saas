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
 * 创建 tRPC 客户端
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${BACKEND_URL}/api/trpc`,
        transformer: superjson,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include", // 携带 cookie 用于认证
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
