"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { getBackendUrl } from "@/lib/config";

export function useAuth() {
  const { data: user, isLoading, error } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000, // 5分钟
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/login";
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
    staleTime: 5 * 60 * 1000,
  });
}
