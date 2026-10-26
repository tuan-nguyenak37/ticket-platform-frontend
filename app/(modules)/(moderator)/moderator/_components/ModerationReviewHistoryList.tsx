'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { RotateCw, History, CheckCircle2, XCircle, Search } from 'lucide-react';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { moderationApi, type ReviewAction } from '../_lib/moderation.api';

export function ModerationReviewHistoryList({ basePath = '/moderator' }: { basePath?: string }) {
  const { params, page, update } = useUrlFilters();
  const eventId = params.get('eventId') ?? '';
  const action = (params.get('action') as ReviewAction) || undefined;

  const historyQuery = useQuery({
    queryKey: ['moderator', 'history', { page, eventId, action }],
    queryFn: ({ signal }) => moderationApi.history({ page, eventId, action }, signal),
  });

  const pageData = historyQuery.data;
  const items = pageData?.items ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  function onFilterEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('eventId') as HTMLInputElement | null;
    update({ eventId: input?.value.trim() || undefined, page: 1 });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lịch sử kiểm duyệt</h1>
          <p className="mt-1 text-sm text-slate-500">
            Xem toàn bộ các quyết định phê duyệt và từ chối sự kiện đã ghi nhận trên hệ thống.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void historyQuery.refetch()}
          disabled={historyQuery.isFetching}
          className="tv-button inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RotateCw size={16} className={historyQuery.isFetching ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={onFilterEvent} className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              name="eventId"
              aria-label="Lọc lịch sử theo mã sự kiện"
              defaultValue={eventId}
              key={eventId}
              placeholder="Lọc theo mã sự kiện (ví dụ: evt_...)"
              className="tv-input !mt-0 !pl-10 text-sm"
            />
          </form>
          <select
            aria-label="Lọc theo quyết định"
            value={action ?? ''}
            onChange={e => update({ action: e.target.value || undefined, page: 1 })}
            className="tv-input !mt-0 sm:w-48 text-sm"
          >
            <option value="">Tất cả quyết định</option>
            <option value="APPROVED">Đã phê duyệt</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
        </div>
      </div>

      {historyQuery.isError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800"><p>Không thể tải lịch sử kiểm duyệt.</p><button className="tv-button mt-3" onClick={() => void historyQuery.refetch()}>Thử lại</button></div>}
      {historyQuery.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
      )}

      {!historyQuery.isLoading && !historyQuery.isError && items.length === 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center text-slate-500 shadow-sm">
          <History size={32} className="mx-auto text-slate-400" />
          <p className="mt-3 font-semibold text-slate-700">Chưa có quyết định nào</p>
          <p className="mt-1 text-sm text-slate-500">
            {eventId || action ? 'Không có quyết định nào khớp với bộ lọc hiện tại.' : 'Chưa có lượt kiểm duyệt nào được ghi nhận.'}
          </p>
        </div>
      )}

      {!historyQuery.isLoading && !historyQuery.isError && items.length > 0 && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Thời gian</th>
                    <th className="px-6 py-4">Sự kiện</th>
                    <th className="px-6 py-4">Kiểm duyệt viên</th>
                    <th className="px-6 py-4">Quyết định</th>
                    <th className="px-6 py-4">Lý do</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map(log => (
                    <tr key={log.reviewId} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`${basePath}/events/${encodeURIComponent(log.eventId)}`}
                          className="font-semibold text-violet-700 hover:underline"
                        >
                          {log.eventTitle || log.eventId}
                        </Link>
                        <p className="text-xs text-slate-400">{log.eventId}</p>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="font-medium text-slate-900">{log.moderatorName || log.moderatorId}</span>
                      </td>
                      <td className="px-6 py-4">
                        {log.action === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                            <CheckCircle2 size={13} /> Phê duyệt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                            <XCircle size={13} /> Từ chối
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 max-w-md">
                        {log.reason || <span className="italic text-slate-400">Không có</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <span>Tổng cộng {total} quyết định · Trang {page}/{totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => update({ page: page - 1 })}
                className="tv-button !min-h-[36px] px-3 py-1 text-xs disabled:opacity-40"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => update({ page: page + 1 })}
                className="tv-button !min-h-[36px] px-3 py-1 text-xs disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
