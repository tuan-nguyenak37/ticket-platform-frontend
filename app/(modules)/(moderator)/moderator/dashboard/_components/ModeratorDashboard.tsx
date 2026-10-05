'use client';
import { CalendarDays } from 'lucide-react';
import { useModeratorDashboard } from '../_hooks/useModeratorDashboard';
import { EventSummary } from './EventSummary';
import { PendingEvents } from './PendingEvents';
import { RecentCheckins } from './RecentCheckins';
import { DashboardAlerts } from './DashboardAlerts';
import { RecentActivity } from './RecentActivity';
export function ModeratorDashboard() {
  const { data } = useModeratorDashboard();
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-medium text-violet-600">Xin chào, Minh Anh 👋</p><h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Tổng quan kiểm duyệt</h1><p className="mt-2 text-sm text-slate-500">Theo dõi hoạt động và giữ cộng đồng sự kiện an toàn.</p></div><div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500"><CalendarDays size={15} aria-hidden="true" />05 tháng 10, 2026</div></div>
    <p className="text-[11px] text-slate-400">Bản xem trước giao diện · Dữ liệu minh họa</p>
    <EventSummary /><PendingEvents events={data.pendingEvents} />
    <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]"><RecentCheckins todayEvents={data.todayEvents} /><DashboardAlerts alerts={data.alerts} /></div>
    <RecentActivity activities={data.activities} />
  </div>;
}
