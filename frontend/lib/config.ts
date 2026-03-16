/**
 * lib/config.ts — 运行时配置管理
 *
 * 解决 NEXT_PUBLIC_BACKEND_URL 在 next build 时被静态编译进 JS bundle 的问题。
 *
 * 策略：
 *  - 服务端（API Route、Server Component）：直接读取 process.env，始终是实时值
 *  - 客户端（浏览器）：首次调用时请求 /api/config 接口获取，结果缓存在内存中，
 *    页面刷新后重新获取，确保始终与服务端 .env.local 保持一致
 */

// ── 服务端使用 ────────────────────────────────────────────────────────────────
// 在 API Route 或 Server Component 中直接调用，不经过网络请求
export function getServerBackendUrl(): string {
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8721"
  );
}

// ── 客户端使用 ────────────────────────────────────────────────────────────────
// 内存缓存（单次页面生命周期内有效，刷新后重新从 /api/config 获取）
let _cachedBackendUrl: string | null = null;
let _fetchPromise: Promise<string> | null = null;

/**
 * 获取后端地址（客户端异步版本）
 * 首次调用发起 /api/config 请求，后续调用返回缓存值
 */
export async function getBackendUrl(): Promise<string> {
  // 服务端直接返回 process.env
  if (typeof window === "undefined") {
    return getServerBackendUrl();
  }

  // 已有缓存直接返回
  if (_cachedBackendUrl) return _cachedBackendUrl;

  // 防止并发重复请求
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = fetch("/api/config", { cache: "no-store" })
    .then((res) => res.json())
    .then((data: { backendUrl: string }) => {
      _cachedBackendUrl = data.backendUrl || "http://localhost:8721";
      _fetchPromise = null;
      return _cachedBackendUrl;
    })
    .catch(() => {
      _fetchPromise = null;
      // 降级：使用编译时的默认值
      return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8721";
    });

  return _fetchPromise;
}

/**
 * 获取后端地址（同步版本，仅在已缓存时有效）
 * 用于非 async 上下文，首次渲染前需先调用 getBackendUrl() 预热缓存
 */
export function getBackendUrlSync(): string {
  if (typeof window === "undefined") {
    return getServerBackendUrl();
  }
  return (
    _cachedBackendUrl ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8721"
  );
}

/**
 * 清除缓存（用于测试或强制刷新配置）
 */
export function clearBackendUrlCache(): void {
  _cachedBackendUrl = null;
  _fetchPromise = null;
}
