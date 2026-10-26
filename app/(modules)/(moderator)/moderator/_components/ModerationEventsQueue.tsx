'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, RotateCw, Calendar, Tag, ShieldAlert } from 'lucide-react';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { moderationApi } from '../_lib/moderation.api';

export function ModerationEventsQueue({ basePath = '/moderator' }: { basePath?: string }) {
  const { params, page, update } = useUrlFilters();
  const q = params.get('q') ?? '';
  const categoryId = params.get('categoryId') ?? '';

  const categoriesQuery = useQuery({
    queryKey: ['moderator', 'categories'],
    queryFn: ({ signal }) => moderationApi.categories(signal),
    staleTime: 5 * 60 * 1000,
  });

  const queueQuery = useQuery({
    queryKey: ['moderator', 'queue', { page, q, categoryId }],
    queryFn: ({ signal }) => moderationApi.pendingEvents({ page, q, categoryId }, signal),
  });

  const categories = categoriesQuery.data ?? [];
  const pageData = queueQuery.data;
  const items = pageData?.items ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('search') as HTMLInputElement | null;
    update({ q: input?.value.trim() || undefined, page: 1 });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hàng đợi kiểm duyệt</h1>
          <p className="mt-1 text-sm text-slate-500">
            Xem xét và phê duyệt các sự kiện đang chờ duyệt từ ban tổ chức.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void queueQuery.refetch()}
          disabled={queueQuery.isFetching}
          className="tv-button inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RotateCw size={16} className={queueQuery.isFetching ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <form onSubmit={onSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              name="search"
              aria-label="Tìm sự kiện theo tiêu đề"
              defaultValue={q}
              key={q}
              placeholder="Tìm theo tiêu đề sự kiện…"
              className="tv-input !mt-0 !pl-10 text-sm"
            />
          </div>
          <select
            aria-label="Lọc theo danh mục"
            value={categoryId}
            onChange={e => update({ categoryId: e.target.value || undefined, page: 1 })}
            className="tv-input !mt-0 sm:w-56 text-sm"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(category => (
              <option key={category.categoryId} value={category.categoryId}>{category.name}</option>
            ))}
          </select>
          <button type="submit" className="tv-button tv-primary !min-h-[44px]">
            Tìm kiếm
          </button>
        </form>
      </div>

      {queueQuery.isError && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <div className="flex items-start gap-3">
            <ShieldAlert size={20} className="shrink-0 text-rose-600" />
            <div>
              <h2 className="font-semibold">Không thể tải hàng đợi kiểm duyệt</h2>
              <p className="mt-1 text-sm text-rose-700">
                Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng kiểm tra lại đường truyền và thử lại.
              </p>
              <button
                type="button"
                onClick={() => void queueQuery.refetch()}
                className="mt-3 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      )}

      {queueQuery.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
      )}

      {!queueQuery.isLoading && !queueQuery.isError && items.length === 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center text-slate-500 shadow-sm">
          <p className="font-semibold text-slate-700">Hàng đợi trống</p>
          <p className="mt-1 text-sm text-slate-500">
            {q || categoryId ? 'Không có sự kiện nào khớp với bộ lọc hiện tại.' : 'Hiện không có sự kiện nào đang chờ kiểm duyệt.'}
          </p>
        </div>
      )}

      {!queueQuery.isLoading && !queueQuery.isError && items.length > 0 && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Sự kiện</th>
                    <th className="px-6 py-4">Danh mục</th>
                    <th className="px-6 py-4">Ngày tạo</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map(ev => (
                    <tr key={ev.eventId} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {ev.posterUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={ev.posterUrl} alt="" className="size-12 rounded-lg object-cover" />
                          ) : (
                            <div className="flex size-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                              <Calendar size={20} />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-900">{ev.title}</p>
                            <p className="text-xs text-slate-400">Mã: {ev.eventId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          <Tag size={12} />
                          {categories.find(category => category.categoryId === ev.categoryId)?.name ?? ev.categoryId}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(ev.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          Chờ duyệt
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`${basePath}/events/${encodeURIComponent(ev.eventId)}`}
                          className="tv-button tv-primary !min-h-[36px] px-3 py-1 text-xs"
                        >
                          Xem xét
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <span>Tổng cộng {total} sự kiện chờ duyệt · Trang {page}/{totalPages}</span>
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
