'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, ChevronRight, CheckCircle2, XCircle, Eye, Sparkles } from 'lucide-react';
import type { EventItem } from '../_lib/events.types';
import { getImageUrl } from '../_lib/events.api';
import { EventStatusBadge } from './EventStatusBadge';

interface EventTableProps {
  events: EventItem[];
  isLoading?: boolean;
  onApprove?: (eventId: string) => void;
  onReject?: (eventId: string) => void;
  page?: number;
  total?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
}

export function EventTable({
  events,
  isLoading,
  onApprove,
  onReject,
  page = 1,
  total = 0,
  limit = 10,
  onPageChange,
}: EventTableProps) {
  const totalPages = Math.ceil(total / limit) || 1;

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
            <tr>
              <th scope="col" className="px-5 py-3.5 sm:px-6">
                Sự kiện & Danh mục
              </th>
              <th scope="col" className="px-5 py-3.5 sm:px-6">
                Địa điểm
              </th>
              <th scope="col" className="px-5 py-3.5 sm:px-6">
                Thời gian diễn ra
              </th>
              <th scope="col" className="px-5 py-3.5 sm:px-6">
                Trạng thái
              </th>
              <th scope="col" className="px-5 py-3.5 sm:px-6 text-right">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
                    <span>Đang tải danh sách sự kiện...</span>
                  </div>
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto">
                    <Sparkles className="size-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">Không có sự kiện nào</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              events.map((event) => {
                const isDraft = event.status === 'draft';
                const isPublished = event.status === 'published';

                return (
                  <tr
                    key={event.event_id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* 1. Tên sự kiện & mã */}
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-start gap-3">
                        {event.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getImageUrl(event.thumbnailUrl) || ''}
                            alt={event.name}
                            className="size-10 shrink-0 rounded-xl object-cover border border-slate-100 shadow-sm"
                          />
                        ) : (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 font-bold text-sm">
                            {event.name ? event.name[0].toUpperCase() : 'E'}
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/moderator/events/${event.event_id}`}
                            className="font-semibold text-slate-800 hover:text-violet-600 transition-colors group-hover:text-violet-600"
                          >
                            {event.name}
                          </Link>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span>ID: {event.event_id}</span>
                            {event.categoryName && (
                              <>
                                <span>•</span>
                                <span className="font-sans font-medium text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                                  {event.categoryName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Địa điểm */}
                    <td className="px-5 py-4 text-slate-600 sm:px-6">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="size-3.5 shrink-0 text-slate-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-700">{event.venueName}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{event.address}</p>
                        </div>
                      </div>
                    </td>

                    {/* 3. Thời gian */}
                    <td className="px-5 py-4 text-slate-600 sm:px-6">
                      <div className="flex items-start gap-1.5">
                        <Calendar className="size-3.5 shrink-0 text-slate-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-700">{formatDate(event.startTime)}</p>
                          <p className="text-[10px] text-slate-400">Đến {formatDate(event.endTime)}</p>
                        </div>
                      </div>
                    </td>

                    {/* 4. Trạng thái */}
                    <td className="px-5 py-4 sm:px-6">
                      <EventStatusBadge status={event.status} />
                    </td>

                    {/* 5. Thao tác */}
                    <td className="px-5 py-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isDraft && onApprove && (
                          <button
                            type="button"
                            onClick={() => onApprove(event.event_id)}
                            title="Duyệt & Xuất bản"
                            className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                          >
                            <CheckCircle2 className="size-3.5" />
                            <span className="hidden sm:inline">Duyệt</span>
                          </button>
                        )}

                        {isPublished && onReject && (
                          <button
                            type="button"
                            onClick={() => onReject(event.event_id)}
                            title="Hủy sự kiện"
                            className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                          >
                            <XCircle className="size-3.5" />
                            <span className="hidden sm:inline">Hủy</span>
                          </button>
                        )}

                        <Link
                          href={`/moderator/events/${event.event_id}`}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                        >
                          <Eye className="size-3.5" />
                          <span>Chi tiết</span>
                          <ChevronRight className="size-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 sm:px-6 bg-slate-50/50">
          <p className="text-[11px] text-slate-500">
            Trang <strong className="font-semibold text-slate-700">{page}</strong> / {totalPages} (Tổng cộng {total} sự kiện)
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50"
            >
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`size-7 rounded-lg text-xs font-semibold transition-colors ${
                  page === p
                    ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
