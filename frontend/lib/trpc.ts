/**
 * tRPC 客户端配置
 * 连接到 gujia.app 后端 API 服务
 *
 * 后端地址通过运行时 /api/config 接口获取，不在 build 时静态编译，
 * 修改 .env.local 中的 BACKEND_URL 后只需重启服务即可生效。
 */
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../backend/server/routers";
import { getBackendUrl, getBackendUrlSync } from "./config";

export const trpc = createTRPCReact<AppRouter>();

/**
 * 获取后端地址（兼容同步/异步场景）
 * - 服务端：直接读取 process.env，无网络请求
 * - 客户端：优先使用内存缓存，缓存为空时降级到编译时默认值
 */
export function getBackendBaseUrl(): string {
  return getBackendUrlSync();
}

/**
 * 创建 tRPC 客户端
 * httpBatchLink 的 url 使用动态函数，每次请求时重新获取后端地址，
 * 确保配置变更后（重启服务）自动生效。
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        // 使用异步函数动态获取 URL，客户端首次请求时会先调用 /api/config
        url: async () => {
          const backendUrl = await getBackendUrl();
          return `${backendUrl}/api/trpc`;
        },
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

// 保留向后兼容的导出（部分页面可能直接引用 BACKEND_URL）
export const BACKEND_URL = getBackendUrlSync();
