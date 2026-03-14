import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js 16 路由代理 - 全局权限守卫
 *
 * 规则：
 * 1. 访问 /dashboard/* 必须携带有效的 token cookie，否则跳转 /login
 * 2. 已登录用户访问 /login 自动跳转对应角色的 dashboard
 * 3. 角色路由隔离：每个角色只能访问自己的 dashboard 子路径
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 获取 token（后端通过 httpOnly cookie 存储 JWT）
  const token = request.cookies.get("token")?.value;

  // ── 保护 /dashboard/* 路由 ──────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      // 未登录，跳转登录页，并记录原始路径以便登录后跳回
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 解析 JWT payload（前端只做快速路由隔离，签名验证由后端负责）
    try {
      const payloadBase64 = token.split(".")[1];
      if (payloadBase64) {
        const payload = JSON.parse(
          Buffer.from(payloadBase64, "base64").toString("utf-8")
        );
        const role: string = payload.role || "";

        // 角色路由隔离：每个角色只能访问自己的 dashboard 子路径
        const rolePathMap: Record<string, string> = {
          bank: "/dashboard/bank",
          investor: "/dashboard/investor",
          appraiser: "/dashboard/appraiser",
          customer: "/dashboard/customer",
          admin: "/dashboard/admin",
        };

        const allowedPrefix = rolePathMap[role];

        // 如果访问的不是自己角色的路径，跳转到自己的首页
        if (
          allowedPrefix &&
          !pathname.startsWith(allowedPrefix) &&
          pathname !== "/dashboard"
        ) {
          return NextResponse.redirect(new URL(allowedPrefix, request.url));
        }
      }
    } catch {
      // JWT 解析失败（token 格式异常），清除 cookie 并跳转登录
      const loginUrl = new URL("/login", request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("token");
      return response;
    }
  }

  // ── 已登录用户访问 /login 自动跳回对应角色的 dashboard ──────────
  if (pathname === "/login" && token) {
    try {
      const payloadBase64 = token.split(".")[1];
      if (payloadBase64) {
        const payload = JSON.parse(
          Buffer.from(payloadBase64, "base64").toString("utf-8")
        );
        const role: string = payload.role || "";
        const rolePathMap: Record<string, string> = {
          bank: "/dashboard/bank",
          investor: "/dashboard/investor",
          appraiser: "/dashboard/appraiser",
          customer: "/dashboard/customer",
          admin: "/dashboard/admin",
        };
        const dashboardPath = rolePathMap[role] || "/dashboard";
        return NextResponse.redirect(new URL(dashboardPath, request.url));
      }
    } catch {
      // token 无效，允许访问登录页
    }
  }

  return NextResponse.next();
}

// 配置代理匹配路径
export const config = {
  matcher: [
    // 匹配所有 dashboard 路由（排除静态资源）
    "/dashboard/:path*",
    // 匹配登录页（用于已登录自动跳转）
    "/login",
  ],
};
