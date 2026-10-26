import { Suspense } from 'react';
import { ModerationReviewHistoryList } from '@/app/(modules)/(moderator)/moderator/_components/ModerationReviewHistoryList';

export default function AdminHistoryPage() {
  return <div className="commerce-light rounded-2xl bg-slate-50 p-4 text-slate-900 md:p-6"><Suspense fallback={<p role="status">Đang tải lịch sử…</p>}><ModerationReviewHistoryList basePath="/admin" /></Suspense></div>;
}
