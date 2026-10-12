'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth.store';
import { hasModeratorPermission } from '../../_lib/moderator-permission';
export default function TicketLayout({ children }: { children: ReactNode }) {
  const status = useAuthStore(state => state.status);
  const role = useAuthStore(state => state.user?.role);
  if (status === 'restoring') return <p role="status" className="p-6 text-sm text-slate-500">Đang khôi phục phiên đăng nhập…</p>;
  if (status !== 'authenticated' || !hasModeratorPermission(role)) return <div role="alert" className="rounded-2xl border bg-white p-8"><h1 className="text-lg font-bold">Cần quyền quản trị vé</h1><p className="mt-2 text-sm text-slate-500">Vui lòng đăng nhập bằng tài khoản Admin hoặc Moderator.</p><Link href="/" className="mt-4 inline-block font-semibold text-violet-700">Về trang chủ để đăng nhập</Link></div>;
  return children;
}
