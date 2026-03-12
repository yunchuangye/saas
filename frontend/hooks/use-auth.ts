"use client";

import { trpc } from "@/lib/trpc";
import { BACKEND_URL } from "@/lib/trpc";

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

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout: () => logoutMutation.mutate(),
    loginUrl: `${BACKEND_URL}/api/oauth/login?state=${encodeURIComponent(
      JSON.stringify({ origin: typeof window !== "undefined" ? window.location.origin : "", returnPath: "/dashboard" })
    )}`,
  };
}

export function useProfile() {
  return trpc.auth.profile.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
