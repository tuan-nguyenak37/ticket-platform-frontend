'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useEventDetail } from './_hooks/useEventDetail';
import { EventDetail } from './_components/EventDetail';
import { EventActions } from './_components/EventActions';

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: event, isLoading, error, updateStatus, isUpdating } = useEventDetail(eventId);

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Back button */}
      <div>
        <Link
          href="/moderator/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-600 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Quay lại danh sách sự kiện</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="size-4 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
            <span>Đang tải thông tin chi tiết sự kiện...</span>
          </div>
        </div>
      ) : error || !event ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
          <Sparkles className="size-8 mx-auto text-slate-300 mb-2" />
          <h2 className="text-base font-bold text-slate-800">Không tìm thấy sự kiện</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Sự kiện có mã ID &quot;{eventId}&quot; không tồn tại hoặc bạn không có quyền truy cập.
          </p>
          <Link
            href="/moderator/events"
            className="mt-4 inline-flex items-center gap-1 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-violet-200 hover:bg-violet-700 transition-colors"
          >
            Quay lại danh sách
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <EventDetail event={event} />
          <EventActions
            event={event}
            onUpdateStatus={updateStatus}
            isUpdating={isUpdating}
          />
        </div>
      )}
    </div>
  );
}
