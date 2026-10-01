'use client';

import { create } from 'zustand';
import type { AuthData, AuthResponse } from '@/lib/interface/authInterface';
import type { User } from '@/lib/interface/userInterface';

export type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated' | 'error';

interface AuthStore {
  accessToken: string | null;
  user: User | null;
  status: AuthStatus;
  error: string | null;
  isAuthenticated: boolean;
  // Thay đổi khi đăng nhập/đăng xuất để bỏ kết quả request của phiên cũ.
  revision: number;
  setAuth: (data: AuthData) => void;
  setAuthFromResponse: (response: AuthResponse) => void;
  setSession: (data: AuthData, status?: AuthStatus) => void;
  setStatus: (status: AuthStatus, error?: string) => void;
  updateUser: (updates: Partial<Omit<User, 'user_id'>>) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  accessToken: null,
  user: null,
  status: 'restoring',
  error: null,
  isAuthenticated: false,
  revision: 0,
  setSession: ({ accessToken, user }, status = 'authenticated') => {
    if (!accessToken?.trim() || !user?.user_id) {
      throw new Error('Dữ liệu phiên thiếu accessToken hoặc user_id.');
    }
    set({ accessToken, user, status, error: null, isAuthenticated: status === 'authenticated' });
  },
  setAuth: (data) => {
    get().setSession(data);
    set((state) => ({ revision: state.revision + 1 }));
  },
  setAuthFromResponse: (response) => {
    if (!response.success || response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(response.message || 'Đăng nhập không thành công.');
    }
    get().setAuth(response.data);
  },
  setStatus: (status, error) => set({ status, error: error ?? null, isAuthenticated: status === 'authenticated' }),
  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates, user_id: state.user.user_id } : null,
  })),
  clearSession: () => set((state) => ({
    accessToken: null, user: null, status: 'unauthenticated', error: null,
    isAuthenticated: false, revision: state.revision + 1,
  })),
}));
