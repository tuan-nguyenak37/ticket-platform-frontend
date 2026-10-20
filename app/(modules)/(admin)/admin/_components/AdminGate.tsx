'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth/auth.store';
import { SiteShell } from '@/components/layout/SiteShell';
import { restoreSession } from '@/lib/auth/session';

export function AdminGate({ children }: { children: ReactNode }) {
  const status = useAuthStore(state => state.status);
  const user = useAuthStore(state => state.user);
  const revision = useAuthStore(state => state.revision);

  if (status === 'error') {
    return <SiteShell><div className="commerce mx-auto max-w-xl p-8"><section className="tv-panel space-y-4" role="alert"><h1 className="text-xl font-semibold">Chưa xác thực được phiên quản trị</h1><p>Không thể kết nối hệ thống xác thực. Không tải dữ liệu quản trị cho đến khi phiên được xác nhận.</p><button className="tv-button" onClick={() => void restoreSession()}>Thử lại</button></section></div></SiteShell>;
  }

  if (status === 'restoring') {
    return (
      <SiteShell>
        <div className="mx-auto max-w-xl p-8 text-center">
          <p className="tv-panel" role="status">Đang xác thực quyền Quản trị viên…</p>
        </div>
      </SiteShell>
    );
  }

  if (status !== 'authenticated' || !user) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-md p-8 text-center">
          <div className="tv-panel space-y-4">
            <h1 className="text-xl font-bold">Yêu cầu đăng nhập</h1>
            <p className="text-sm tv-muted">Vui lòng đăng nhập với vai trò Quản trị viên (ADMIN) để tiếp tục.</p>
            <Link href="/login?next=/admin" className="tv-button tv-primary inline-flex">Đăng nhập</Link>
          </div>
        </div>
      </SiteShell>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <SiteShell>
        <div className="mx-auto max-w-md p-8 text-center">
          <div className="tv-panel space-y-4 border-rose-500/40">
            <h1 className="text-xl font-bold text-rose-300">Không có quyền truy cập</h1>
            <p className="text-sm tv-muted">Khu vực này chỉ dành riêng cho vai trò ADMIN. Tài khoản hiện tại mang vai trò {user.role}.</p>
            <div className="flex justify-center gap-3">
              <Link href="/" className="tv-button">Trang chủ</Link>
              <Link href="/account" className="tv-button tv-primary">Tài khoản</Link>
            </div>
          </div>
        </div>
      </SiteShell>
    );
  }

  return <SiteShell><div key={revision}>{children}</div></SiteShell>;
}
