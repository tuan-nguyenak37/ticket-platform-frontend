'use client';

import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/auth.store';
import { refreshExpiringSession, restoreSession, subscribeToSessionChanges } from '@/lib/auth/session';

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  useEffect(() => {
    // Dọn token đã được lưu bởi cấu hình persist cũ; phiên mới chỉ ở bộ nhớ.
    try {
      localStorage.removeItem('auth-session');
      localStorage.removeItem('auth-store');
    } catch { /* Trình duyệt có thể chặn localStorage. */ }
    const unsubscribe = useAuthStore.subscribe((state, previous) => {
      if (state.revision !== previous.revision) {
        queryClient.removeQueries({ predicate: query => query.queryKey[0] !== 'public' });
        queryClient.getMutationCache().clear();
      }
    });
    const stopSync = subscribeToSessionChanges();
    const refresh = () => {
      if (document.visibilityState === 'visible') void refreshExpiringSession().catch(() => undefined);
    };
    const online = () => {
      if (useAuthStore.getState().status === 'error') void restoreSession();
      else refresh();
    };
    const timer = window.setInterval(refresh, 30_000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('online', online);
    void restoreSession();
    return () => {
      unsubscribe();
      stopSync();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('online', online);
    };
  }, [queryClient]);
  return children;
}

