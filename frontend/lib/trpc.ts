/**
 * tRPC 客户端配置
 *
 * 后端地址通过 window.__BACKEND_URL__ 运行时读取（由 layout.tsx SSR 注入），
 * 不在 build 时静态编译，修改 .env.local 中的 BACKEND_URL 后只需重启服务即可生效。
 *
 * 注意：httpBatchLink 的 url 字段必须是字符串，不能是函数，
 * 因此在 createTRPCClient() 调用时直接读取 getBackendUrlSync() 的返回值。
 */
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../backend/server/routers";
import { getBackendUrlSync } from "./config";

export const trpc = createTRPCReact<AppRouter>();

/**
 * 创建 tRPC 客户端
 * 每次调用时读取当前 window.__BACKEND_URL__ 值作为字符串传入 url
 */
export function createTRPCClient() {
  // 在调用时（非 build 时）读取 window.__BACKEND_URL__，确保是运行时的真实值
  const backendUrl = getBackendUrlSync();

  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${backendUrl}/api/trpc`,
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

// 向后兼容的导出
export const BACKEND_URL = getBackendUrlSync();
