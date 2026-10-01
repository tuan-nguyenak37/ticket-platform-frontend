'use client';

import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/auth.store';
import { restoreSession } from './session';

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  useEffect(() => {
    // Dọn token đã được lưu bởi cấu hình persist cũ; phiên mới chỉ ở bộ nhớ.
    try {
      localStorage.removeItem('auth-session');
      localStorage.removeItem('auth-store');
    } catch { /* Trình duyệt có thể chặn localStorage. */ }
    const unsubscribe = useAuthStore.subscribe((state, previous) => {
      if (state.revision !== previous.revision) queryClient.clear();
    });
    void restoreSession();
    return unsubscribe;
  }, [queryClient]);
  return children;
}
