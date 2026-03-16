/**
 * lib/config.ts — 运行时配置管理
 *
 * 解决 NEXT_PUBLIC_BACKEND_URL 在 next build 时被静态编译进 JS bundle 的问题。
 *
 * 策略：
 *  - 服务端（API Route、Server Component）：直接读取 process.env，始终是实时值
 *  - 客户端（浏览器）：从 window.__BACKEND_URL__ 读取，该值由 app/layout.tsx 的
 *    Server Component 在 SSR 时内联注入到 HTML 中，完全同步，无需异步请求
 *
 * 注入方式（在 app/layout.tsx 中）：
 *   <script dangerouslySetInnerHTML={{ __html: `window.__BACKEND_URL__="${backendUrl}"` }} />
 */

declare global {
  interface Window {
    __BACKEND_URL__?: string;
  }
}

// ── 服务端使用 ────────────────────────────────────────────────────────────────
export function getServerBackendUrl(): string {
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8721"
  );
}

// ── 客户端使用（同步，从 window.__BACKEND_URL__ 读取）────────────────────────
export function getBackendUrlSync(): string {
  if (typeof window === "undefined") {
    return getServerBackendUrl();
  }
  return (
    window.__BACKEND_URL__ ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
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
  // window.__BACKEND_URL__ 由服务端注入，客户端不需要清除
}
