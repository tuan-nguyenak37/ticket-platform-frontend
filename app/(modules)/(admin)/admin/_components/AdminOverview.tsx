'use client';

import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/auth.store';
import { Failure } from '@/components/ui/commerce';
import { adminApi, type AdminSummary } from '../_lib/admin.api';
import { AdminStatistics } from './AdminStatistics';

const metrics: { key: keyof AdminSummary; label: string }[] = [
  { key: 'users', label: 'Tài khoản' },
  { key: 'organizers', label: 'Ban tổ chức' },
  { key: 'publishedEvents', label: 'Sự kiện đã xuất bản' },
  { key: 'moderators', label: 'Kiểm duyệt viên' },
];

export function AdminOverview() {
  const user = useAuthStore(state => state.user);
  const revision = useAuthStore(state => state.revision);
  const query = useQuery({
    queryKey: ['admin', 'summary', user?.user_id, revision],
    queryFn: () => adminApi.summary(),
    enabled: user?.role === 'ADMIN',
    gcTime: 0,
    retry: 1,
  });
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.18em] text-violet-300">TicketVerse / Dashboard</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Tổng quan hệ thống</h1><p className="mt-3 text-sm tv-muted">Theo dõi dòng tiền bán vé và những công việc cần xử lý.</p></div>
        <button className="tv-button" disabled={query.isFetching} onClick={() => void query.refetch()}>Làm mới hệ thống</button>
      </header>
      <AdminStatistics />
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="tv-panel space-y-5" aria-label="Quy mô hệ thống">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">Quy mô hệ thống</h2><span className="rounded-full bg-white/5 px-3 py-1 text-xs tv-muted">Toàn thời gian</span></div>
          {query.isPending ? <p role="status" className="tv-muted">Đang tải tổng quan…</p> : query.isError ? <Failure error={query.error} retry={() => void query.refetch()} /> : <>
            <dl className="grid grid-cols-2 gap-4">{metrics.map(metric => <div key={metric.key} className="min-w-0 rounded-xl bg-white/[.03] p-4"><dt className="text-xs tv-muted">{metric.label}</dt><dd className="mt-2 break-words text-2xl font-semibold tabular-nums">{BigInt(query.data[metric.key]).toLocaleString('vi-VN')}</dd></div>)}</dl>
            <p className="border-t border-white/10 pt-4 text-xs leading-6 tv-muted">Đơn đã thanh toán từ trước đến nay: <strong className="text-violet-200">{BigInt(query.data.paidOrders).toLocaleString('vi-VN')}</strong> đơn vé gốc · <strong className="text-cyan-200">{BigInt(query.data.paidResaleOrders).toLocaleString('vi-VN')}</strong> đơn bán lại.</p>
          </>}
        </section>
        <section className="tv-panel space-y-5" aria-label="Ưu tiên xử lý">
          <h2 className="text-lg font-semibold">Ưu tiên xử lý</h2>
          <Link className="group flex min-h-20 items-center gap-4 rounded-xl border border-violet-400/20 bg-violet-400/5 p-4 hover:bg-violet-400/10" href="/admin/events"><CalendarDays aria-hidden="true" className="size-6 shrink-0 text-violet-300" /><div className="min-w-0 flex-1"><p className="font-semibold">Duyệt sự kiện</p><p className="mt-1 text-sm tv-muted">{!query.isPending && !query.isError ? `${BigInt(query.data.pendingEvents).toLocaleString('vi-VN')} sự kiện đang chờ kiểm duyệt` : 'Mở hàng đợi kiểm duyệt sự kiện'}</p></div><ArrowUpRight aria-hidden="true" className="size-5 shrink-0 text-violet-300" /></Link>
          <Link className="flex items-center gap-4 rounded-xl border border-white/10 p-4 hover:bg-white/5" href="/admin/users"><Users aria-hidden="true" className="size-6 shrink-0 text-violet-300" /><span className="flex-1 text-sm font-semibold">Quản lý tài khoản & phân quyền</span><ArrowUpRight aria-hidden="true" className="size-5 shrink-0 tv-muted" /></Link>
          {!query.isPending && !query.isError && <p className="text-xs leading-6 tv-muted"><strong className="text-amber-200">{BigInt(query.data.reviewPayments).toLocaleString('vi-VN')}</strong> giao dịch cần kiểm tra. Đây là số liệu theo dõi, chưa xác nhận đã thu tiền và không được cộng vào Tổng thu.</p>}
        </section>
      </div>
    </div>
  );
}
