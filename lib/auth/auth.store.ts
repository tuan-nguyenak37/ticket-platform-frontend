'use client';

import { createContext, createElement, useContext, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import type { AuthData, AuthResponse, TokenAuthData } from '@/lib/auth/types/authInterface';
import type { User } from '@/lib/auth/types/userInterface';

export type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated' | 'error';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  status: AuthStatus;
  error: string | null;
  isAuthenticated: boolean;
  // Thay đổi khi đăng nhập/đăng xuất để bỏ kết quả request của phiên cũ.
  revision: number;
  setAuth: (data: AuthData | TokenAuthData) => void;
  setAuthFromResponse: (response: AuthResponse) => void;
  setSession: (data: AuthData | TokenAuthData, status?: AuthStatus) => void;
  setStatus: (status: AuthStatus, error?: string) => void;
  updateUser: (updates: Partial<Omit<User, 'user_id'>>) => void;
  clearSession: () => void;
}

export type AuthSnapshot = { user: User | null; status: AuthStatus };

function createAuthStore(initial?: AuthSnapshot) {
  return createStore<AuthStore>()((set, get) => ({
  user: initial?.user ?? null,
  accessToken: null,
  accessTokenExpiresAt: null,
  status: initial?.status ?? 'restoring',
  error: null,
  isAuthenticated: initial?.status === 'authenticated',
  revision: 0,
  setSession: (data, status = 'authenticated') => {
    const { user } = data;
    if (!user?.user_id) {
      throw new Error('Dữ liệu phiên thiếu user_id.');
    }
    set({ user, status, error: null, isAuthenticated: status === 'authenticated',
      ...('accessToken' in data
        ? { accessToken: data.accessToken, accessTokenExpiresAt: data.accessTokenExpiresAt }
        : get().user?.user_id !== user.user_id ? { accessToken: null, accessTokenExpiresAt: null } : {}),
    });
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
    user: null, status: 'unauthenticated', error: null,
    accessToken: null, accessTokenExpiresAt: null,
    isAuthenticated: false, revision: state.revision + 1,
  })),
  }));
}

let browserStore = createAuthStore();
const AuthContext = createContext(browserStore);
let browserInitialized = false;

export function AuthStoreProvider({ initial, children }: { initial: AuthSnapshot; children: ReactNode }) {
  const [store] = useState(() => {
    if (typeof window === 'undefined') return createAuthStore(initial);
    if (!browserInitialized) {
      browserStore = createAuthStore(initial);
      browserInitialized = true;
    }
    return browserStore;
  });
  return createElement(AuthContext.Provider, { value: store }, children);
}

export const useAuthStore = Object.assign(
  function useAuthStore<T>(selector: (state: AuthStore) => T): T {
    return useStore(useContext(AuthContext), selector);
  },
  {
    getState: () => browserStore.getState(),
    subscribe: (listener: Parameters<typeof browserStore.subscribe>[0]) => browserStore.subscribe(listener),
  },
);
