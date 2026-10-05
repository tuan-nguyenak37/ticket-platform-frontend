'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { EventItem } from '../../_lib/events.types';

interface EventActionsProps {
  event: EventItem;
  onUpdateStatus: (status: 'published' | 'cancelled' | 'draft') => Promise<unknown>;
  isUpdating: boolean;
}

export function EventActions({ event, onUpdateStatus, isUpdating }: EventActionsProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAction = async (status: 'published' | 'cancelled' | 'draft', label: string) => {
    if (!confirm(`Bạn có chắc muốn thực hiện: "${label}" đối với sự kiện này?`)) return;
    try {
      setFeedback(null);
      await onUpdateStatus(status);
      setFeedback(`Đã cập nhật trạng thái sự kiện thành: ${label}`);
    } catch {
      setFeedback('Có lỗi xảy ra khi cập nhật trạng thái sự kiện.');
    }
  };

  const isDraft = event.status === 'draft';
  const isPublished = event.status === 'published';
  const isCancelled = event.status === 'cancelled';

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Sparkles className="size-4 text-violet-600" />
            Bảng điều khiển quyết định kiểm duyệt
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quyết định phê duyệt sẽ cập nhật trực tiếp trạng thái trên toàn hệ thống TicketVerse.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/moderator/events"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Danh sách</span>
          </Link>

          {/* Duyệt & Xuất bản */}
          {isDraft && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleAction('published', 'Đã duyệt & Xuất bản')}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="size-4" />
              <span>Duyệt & Xuất bản ngay</span>
            </button>
          )}

          {/* Hủy sự kiện */}
          {!isCancelled && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleAction('cancelled', 'Hủy bỏ sự kiện')}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-all disabled:opacity-50"
            >
              <XCircle className="size-4" />
              <span>Hủy sự kiện</span>
            </button>
          )}

          {/* Hoàn tác về Draft */}
          {isCancelled && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleAction('draft', 'Khôi phục về Chờ duyệt')}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <RotateCcw className="size-4" />
              <span>Khôi phục về Nháp (Draft)</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 text-xs font-medium text-violet-800 animate-in fade-in">
          {feedback}
        </div>
      )}

      {isPublished && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50/70 border border-emerald-100 p-3 text-xs text-emerald-800">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span>Sự kiện này đang được xuất bản công khai và cho phép người dùng đặt vé.</span>
        </div>
      )}

      {isCancelled && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50/70 border border-rose-100 p-3 text-xs text-rose-800">
          <AlertTriangle className="size-4 text-rose-600 shrink-0" />
          <span>Sự kiện này đã bị hủy bỏ. Người dùng không thể tìm thấy hoặc mua vé cho sự kiện này.</span>
        </div>
      )}
    </div>
  );
}
