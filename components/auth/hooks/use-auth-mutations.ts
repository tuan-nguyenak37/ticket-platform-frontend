'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loginSession, registerSession } from '@/lib/auth/session';
import type { AuthData } from '@/lib/interface/authInterface';
import type { AppApiError } from '@/lib/http/http-errors';

export interface LoginVariables {
  email: string;
  password: string;
}

export interface RegisterVariables {
  email: string;
  password: string;
  fullName: string;
}

/**
 * Hook quản lý mutation đăng nhập với TanStack Query.
 * Tách biệt hoàn toàn logic gọi API, loading state và error handling khỏi UI.
 */
export function useLoginMutation(options?: {
  onSuccess?: (data: AuthData) => void;
  onError?: (error: AppApiError) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<AuthData, AppApiError, LoginVariables>({
    mutationFn: (credentials) => loginSession(credentials),
    onSuccess: (data) => {
      // Clear cache cũ để đảm bảo query mới nhận dữ liệu tài khoản hiện tại
      queryClient.clear();
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}


export function useRegisterMutation(options?: {
  onSuccess?: (data: unknown) => void;
  onError?: (error: AppApiError) => void;
}) {
  return useMutation<unknown, AppApiError, RegisterVariables>({
    mutationFn: (data) => registerSession(data),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}
