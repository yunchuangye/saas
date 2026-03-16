/**
 * lib/config.ts — 后端地址配置
 *
 * ✅ 正确配置方式：在服务器 frontend/.env.local 中设置：
 *   NEXT_PUBLIC_BACKEND_URL=https://api.gujia.app
 *
 * ⚠️ 注意：修改此变量后必须重新执行 pnpm build，
 *   因为 NEXT_PUBLIC_ 前缀的变量在 build 时被 Next.js 编译进 JS bundle。
 *
 * ❌ 不要在 next.config.mjs 的 env 配置中设置此变量，
 *   因为 next.config.mjs 在 .env.local 加载之前执行，会导致读取到 undefined。
 */

const DEFAULT_BACKEND_URL = "http://localhost:8721";

/**
 * 获取后端地址（同步，适用于客户端和服务端）
 * NEXT_PUBLIC_BACKEND_URL 在 build 时由 Next.js 从 .env.local 读取并编译进 bundle
 */
export function getBackendUrlSync(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_URL;
}

/**
 * 获取后端地址（服务端专用，运行时读取）
 */
export function getServerBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_URL;
}

/**
 * 获取后端地址（异步版本，兼容旧代码）
 */
export async function getBackendUrl(): Promise<string> {
  return getBackendUrlSync();
}

/**
 * 清除缓存（兼容旧代码，无操作）
 */
export function clearBackendUrlCache(): void {
  // 无操作
}
