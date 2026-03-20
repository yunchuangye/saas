"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { getBackendUrl } from "@/lib/config";
import { useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 0, // 不缓存，每次都重新验证（防止退出后仍读取旧数据）
    gcTime: 0,    // 立即清除缓存
  });

  const queryClient = useQueryClient();

  /**
   * 清除所有前端鉴权状态：
   * 1. 清除 document.cookie 中的 token
   * 2. 清空 React Query 所有缓存
   * 3. 强制整页跳转到登录页（而非 router.push，确保内存状态完全重置）
   */
  const clearAuthState = () => {
    document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
    queryClient.clear();
    window.location.href = "/login";
  };

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { clearAuthState(); },
    onError: () => {
      // 即使后端接口失败，也强制清除前端状态
      clearAuthState();
    },
  });

  // 运行时动态获取后端地址，避免静态编译
  const [loginUrl, setLoginUrl] = useState<string>("#");
  useEffect(() => {
    getBackendUrl().then((backendUrl) => {
      setLoginUrl(
        `${backendUrl}/api/oauth/login?state=${encodeURIComponent(
          JSON.stringify({
            origin: typeof window !== "undefined" ? window.location.origin : "",
            returnPath: "/dashboard",
          })
        )}`
      );
    });
  }, []);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout: () => logoutMutation.mutate(),
    loginUrl,
  };
}

export function useProfile() {
  return trpc.auth.profile.useQuery(undefined, {
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}
