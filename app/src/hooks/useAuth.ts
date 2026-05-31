import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, clearToken, getToken } from "@/lib/api";
import { LOGIN_PATH } from "@/const";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } =
    options ?? {};

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: !!getToken(),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logout = useCallback(() => {
    clearToken();
    queryClient.clear();
    navigate(redirectPath);
  }, [queryClient, navigate, redirectPath]);

  useEffect(() => {
    if (redirectOnUnauthenticated && !isLoading && !user && !getToken()) {
      const currentPath = window.location.pathname;
      if (currentPath !== redirectPath) {
        navigate(redirectPath);
      }
    }
  }, [redirectOnUnauthenticated, isLoading, user, navigate, redirectPath]);

  return {
    user: user ?? null,
    isAuthenticated: !!user,
    isLoading,
    error,
    logout,
    refresh: refetch,
  };
}
