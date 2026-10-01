'use client';

import type { ReactNode } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';
import { restoreSession } from './session';

// UI gate phía client; backend vẫn quyết định quyền truy cập dữ liệu.
export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  if (status === 'restoring') return <p role="status">Đang khôi phục phiên đăng nhập…</p>;
  if (status === 'error') return (
    <div role="alert">
      <p>{error}</p>
      <button type="button" onClick={() => void restoreSession()}>Thử lại</button>
    </div>
  );
  if (status === 'unauthenticated') return <p role="status">Vui lòng đăng nhập để tiếp tục.</p>;
  return children;
}
