import { Suspense } from 'react';
import { ModerationEventsQueue } from '@/app/(modules)/(moderator)/moderator/_components/ModerationEventsQueue';

export default function AdminEventsPage() {
  return <div className="commerce-light rounded-2xl bg-slate-50 p-4 text-slate-900 md:p-6"><Suspense fallback={<p role="status">Đang tải hàng đợi…</p>}><ModerationEventsQueue basePath="/admin" /></Suspense></div>;
}
