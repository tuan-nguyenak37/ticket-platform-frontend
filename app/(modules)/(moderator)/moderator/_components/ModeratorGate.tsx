'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/auth.store';
import { restoreSession } from '@/lib/auth/session';
import { ModeratorShell } from './ModeratorShell';

export function ModeratorGate({ children }: { children: ReactNode }) {
  const status = useAuthStore(state => state.status);
  const user = useAuthStore(state => state.user);
  const pathname = usePathname();
  const revision = useAuthStore(state => state.revision);

  if (status === 'error') {
    return <div className="commerce commerce-light flex min-h-screen items-center justify-center bg-[#f6f7fb] p-6"><section className="tv-panel max-w-md space-y-4" role="alert"><h1 className="text-xl font-bold">Chưa xác thực được phiên kiểm duyệt</h1><p>Hệ thống xác thực chưa phản hồi. Không tải dữ liệu nội bộ khi phiên chưa được xác nhận.</p><button className="tv-button" onClick={() => void restoreSession()}>Thử lại</button></section></div>;
  }

  if (status === 'restoring') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] p-6 text-slate-700">
        <p className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm shadow-sm" role="status">
          Đang xác thực quyền kiểm duyệt viên…
        </p>
      </div>
    );
  }

  if (status !== 'authenticated' || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] p-6 text-slate-900">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <h1 className="text-xl font-bold">Yêu cầu đăng nhập</h1>
          <p className="mt-2 text-sm text-slate-600">
            Vui lòng đăng nhập bằng tài khoản kiểm duyệt viên để vào không gian này.
          </p>
          <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="tv-button tv-primary mt-6 inline-flex">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== 'MODERATOR') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] p-6 text-slate-900">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-lg">
          <h1 className="text-xl font-bold text-rose-600">Không có quyền truy cập</h1>
          <p className="mt-2 text-sm text-slate-600">
            Khu vực này chỉ dành riêng cho vai trò Kiểm duyệt viên (MODERATOR). Tài khoản hiện tại mang vai trò {user.role}.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/" className="tv-button">Về trang chủ</Link>
            <Link href="/account" className="tv-button tv-primary">Tài khoản</Link>
          </div>
        </div>
      </div>
    );
  }

  return <ModeratorShell><div key={revision}>{children}</div></ModeratorShell>;
}
