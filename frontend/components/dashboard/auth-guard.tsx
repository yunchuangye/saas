"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/lib/config/roles";

interface AuthGuardProps {
  role: UserRole;
  children: React.ReactNode;
}

/**
 * 客户端认证守卫（双重保险，配合 middleware.ts 使用）
 *
 * 作用：
 * 1. 未登录时强制跳转 /login
 * 2. 角色不匹配时跳转到自己角色对应的 dashboard
 * 3. 账号被禁用时跳转 /login
 */
export function AuthGuard({ role, children }: AuthGuardProps) {
  const { user, isLoading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 加载中不做任何跳转
    if (isLoading) return;

    // 未登录（API 返回 UNAUTHORIZED 或 user 为 undefined）
    if (!user || error) {
      router.replace("/login");
      return;
    }

    // 账号被禁用
    if ((user as any).isActive === false) {
      router.replace("/login?reason=disabled");
      return;
    }

    // 角色不匹配：跳转到自己角色对应的首页
    if (user.role !== role) {
      const rolePathMap: Record<string, string> = {
        bank: "/dashboard/bank",
        investor: "/dashboard/investor",
        appraiser: "/dashboard/appraiser",
        customer: "/dashboard/customer",
        admin: "/dashboard/admin",
      };
      const correctPath = rolePathMap[user.role] || "/login";
      router.replace(correctPath);
      return;
    }
  }, [user, isLoading, error, role, router]);

  // 加载中或未登录时显示空白（middleware 已处理跳转，这里只是防闪烁）
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // 未登录或角色不匹配时不渲染子组件（等待跳转）
  if (!user || user.role !== role) {
    return null;
  }

  return <>{children}</>;
}
