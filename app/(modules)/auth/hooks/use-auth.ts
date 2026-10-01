"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../store/auth.store";
import { LoginCredentials, RegisterCredentials } from "../types/auth.types";
import { AppApiError } from "@/app/_lib/http-errors";

export const AUTH_QUERY_KEYS = {
  profile: ["auth", "profile"] as const,
};

/**
 * Hook Mutation đăng nhập
 */
export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),
    onSuccess: (data, variables) => {
      const token = data?.accessToken || data?.token || "";
      const user = data?.user || { email: variables.email || "", id: "me" };
      console.log("log ", data);
      setAuth({
        user,
        token,
        refreshToken: data?.refreshToken,
      });

      queryClient.setQueryData(AUTH_QUERY_KEYS.profile, user);
      router.push("/");
    },
    onError: (error: AppApiError) => {
      console.error("Đăng nhập thất bại:", error.message);
    },
  });
}

/**
 * Hook Mutation đăng ký tài khoản
 */
export function useRegister() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (data: RegisterCredentials) => authService.register(data),
    onSuccess: (data) => {
      const token = data.accessToken || data.token;
      if (token && data.user) {
        setAuth({
          user: data.user,
          token,
          refreshToken: data.refreshToken,
        });
        router.push("/");
      } else {
        router.push("/auth/login?registered=true");
      }
    },
    onError: (error: AppApiError) => {
      console.error("Đăng ký thất bại:", error.message);
    },
  });
}

/**
 * Hook Query lấy thông tin profile người dùng hiện tại
 */
export function useProfile() {
  const { token, updateUser } = useAuthStore();

  return useQuery({
    queryKey: AUTH_QUERY_KEYS.profile,
    queryFn: async () => {
      const user = await authService.getProfile();
      updateUser(user);
      return user;
    },
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook xử lý Đăng xuất
 */
export function useLogout() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return async () => {
    try {
      await authService.logout();
    } finally {
      logout();
      queryClient.clear();
      router.push("/auth/login");
    }
  };
}
