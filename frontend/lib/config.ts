/**
 * lib/config.ts — 后端地址配置
 *
 * 方案：使用 NEXT_PUBLIC_BACKEND_URL 环境变量（Next.js 官方推荐的客户端环境变量方案）
 *
 * 配置方式（在服务器 frontend/.env.local 中设置）：
 *   NEXT_PUBLIC_BACKEND_URL=https://api.gujia.app
 *
 * 注意：修改此变量后需要重新执行 pnpm build，因为该值在 build 时编译进 JS bundle。
 * 这是正确的行为——前端 JS 需要在编译时知道后端地址。
 */

// 服务端和客户端通用
export function getServerBackendUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    "http://localhost:8721"
  );
}

export function getBackendUrlSync(): string {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    "http://localhost:8721"
  );
}

/**
 * 获取后端地址（兼容旧代码的异步版本，实际同步返回）
 */
export async function getBackendUrl(): Promise<string> {
  return getBackendUrlSync();
}

/**
 * 清除缓存（兼容旧代码，实际无操作）
 */
export function clearBackendUrlCache(): void {
  // 无操作，兼容旧代码
}
