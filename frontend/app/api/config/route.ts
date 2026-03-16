/**
 * /api/config — 运行时配置接口
 *
 * 在服务端运行时读取 process.env，将后端地址等配置下发给客户端。
 * 由于此接口在 Next.js 服务进程中执行，process.env 始终反映
 * 当前 .env.local 的值，不受 build 时静态编译影响。
 *
 * 客户端通过 getBackendUrl() 调用此接口获取后端地址。
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // 禁止缓存，每次请求都从 process.env 读取

export async function GET() {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:8721";

  return NextResponse.json(
    { backendUrl },
    {
      headers: {
        // 不缓存，确保每次都返回最新配置
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
