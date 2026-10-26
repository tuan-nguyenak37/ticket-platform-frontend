'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { href: '/admin', label: 'Tổng quan' },
  { href: '/admin/users', label: 'Người dùng' },
  { href: '/admin/events', label: 'Duyệt sự kiện' },
  { href: '/admin/history', label: 'Lịch sử kiểm duyệt' },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="commerce mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div><p className="text-xs font-semibold tracking-wider text-[#d2adff]">TICKETVERSE ADMIN</p><p className="mt-1 text-sm tv-muted">Quản trị hệ thống</p></div>
        <Link href="/" className="tv-button">Về trang khách hàng</Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)]">
        <nav aria-label="Điều hướng quản trị" className="flex flex-wrap content-start gap-2 lg:flex-col">
          {navigation.map(item => {
            const active = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);
            return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`tv-button justify-start ${active ? 'tv-primary' : ''}`}>{item.label}</Link>;
          })}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
