'use client';
import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth/auth.store';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Building, ShieldAlert } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { formatHttpError } from '@/lib/api/http-errors';
import { moderationApi, type Showing } from '../_lib/moderation.api';

export function ModerationEventDetailView({ eventId, basePath = '/moderator' }: { eventId: string; basePath?: string }) {
  const queryClient = useQueryClient();
  const lock = useRef(false);

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const detailQuery = useQuery({
    queryKey: ['moderator', 'event', eventId],
    queryFn: ({ signal }) => moderationApi.eventDetail(eventId, signal),
  });

  const showingsQuery = useQuery({
    queryKey: ['moderator', 'showings', eventId],
    queryFn: ({ signal }) => moderationApi.showings(eventId, signal),
  });

  const historyQuery = useQuery({
    queryKey: ['moderator', 'event-history', eventId],
    queryFn: ({ signal }) => moderationApi.history({ page: 1, eventId }, signal),
  });

  const event = detailQuery.data;
  const showings = showingsQuery.data ?? [];
  const eventHistory = historyQuery.data?.items ?? [];

  async function handleApprove() {
    if (lock.current) return;
    lock.current = true;
    const revision = useAuthStore.getState().revision;
    setActionBusy(true);
    setActionError('');
    try {
      await moderationApi.approve(eventId);
      if (useAuthStore.getState().revision !== revision) return;
      setApproveOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['moderator', 'event', eventId] }),
        queryClient.invalidateQueries({ queryKey: ['moderator', 'queue'] }),
        queryClient.invalidateQueries({ queryKey: ['moderator', 'event-history', eventId] }),
        queryClient.invalidateQueries({ queryKey: ['moderator', 'history'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'summary'] }),
      ]);
    } catch (err) {
      if (useAuthStore.getState().revision !== revision) return;
      const error = formatHttpError(err);
      if (error.statusCode === 409) {
        setActionError('Sự kiện đã thay đổi hoặc đã được xử lý bởi người khác. Đang tải lại dữ liệu…');
        void queryClient.invalidateQueries({ queryKey: ['moderator', 'event', eventId] });
      } else {
        setActionError(error.message);
      }
    } finally {
      lock.current = false;
      setActionBusy(false);
    }
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    const revision = useAuthStore.getState().revision;
    const reason = rejectReason.trim();
    if (!reason) {
      setActionError('Vui lòng nhập lý do từ chối.');
      return;
    }
    lock.current = true;
    setActionBusy(true);
    setActionError('');
    try {
      await moderationApi.reject(eventId, reason);
      if (useAuthStore.getState().revision !== revision) return;
      setRejectOpen(false);
      setRejectReason('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['moderator', 'event', eventId] }),
        queryClient.invalidateQueries({ queryKey: ['moderator', 'queue'] }),
        queryClient.invalidateQueries({ queryKey: ['moderator', 'event-history', eventId] }),
        queryClient.invalidateQueries({ queryKey: ['moderator', 'history'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'summary'] }),
      ]);
    } catch (err) {
      if (useAuthStore.getState().revision !== revision) return;
      const error = formatHttpError(err);
      if (error.statusCode === 409) {
        setActionError('Sự kiện đã thay đổi hoặc đã được xử lý bởi người khác. Đang tải lại dữ liệu…');
        void queryClient.invalidateQueries({ queryKey: ['moderator', 'event', eventId] });
      } else {
        setActionError(error.message);
      }
    } finally {
      lock.current = false;
      setActionBusy(false);
    }
  }

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-96 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  if (detailQuery.isError || !event) {
    return (
      <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-rose-800">
        <div className="flex items-start gap-3">
          <ShieldAlert size={22} className="shrink-0 text-rose-600" />
          <div>
            <h1 className="text-lg font-bold">Không thể tải thông tin sự kiện</h1>
            <p className="mt-1 text-sm text-rose-700">
              Sự kiện không tồn tại hoặc đã có lỗi kết nối máy chủ.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => void detailQuery.refetch()}
                className="tv-button text-xs"
              >
                Thử lại
              </button>
              <Link href={`${basePath}/events`} className="tv-button tv-primary text-xs">
                Quay lại hàng đợi
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPending = event.status === 'PENDING_REVIEW';
  const isOwn = event.isOwnEvent;
  const isOrganizerSuspended = event.organizer.status === 'SUSPENDED';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`${basePath}/events`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={16} /> Quay lại hàng đợi
        </Link>
        <div className="flex items-center gap-2">
          {event.status === 'PENDING_REVIEW' && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              Chờ duyệt
            </span>
          )}
          {event.status === 'PUBLISHED' && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              Đã xuất bản (PUBLISHED)
            </span>
          )}
          {event.status === 'REJECTED' && (
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
              Bị từ chối (REJECTED)
            </span>
          )}
          {event.status === 'DRAFT' && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
              Bản nháp (DRAFT)
            </span>
          )}
        </div>
      </div>

      {isOwn && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <AlertTriangle size={20} className="shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-semibold">Bạn là chủ sở hữu (OWNER) của Ban tổ chức này</p>
            <p className="mt-0.5 text-amber-800">
              Bạn có quyền xem thông tin nội bộ của sự kiện nhưng không được tự phê duyệt hoặc từ chối để bảo đảm tính độc lập của quy trình kiểm duyệt.
            </p>
          </div>
        </div>
      )}

      {isOrganizerSuspended && isPending && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
          <ShieldAlert size={20} className="shrink-0 text-rose-600" />
          <div className="text-sm">
            <p className="font-semibold">Ban tổ chức đang bị tạm ngưng hoạt động (SUSPENDED)</p>
            <p className="mt-0.5 text-rose-800">
              Không thể phê duyệt sự kiện khi Ban tổ chức bị khóa. Bạn chỉ có thể từ chối hoặc yêu cầu xem xét lại trạng thái ban tổ chức.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
            <p className="mt-1 text-xs text-slate-400">Mã sự kiện: {event.eventId} · Slug: {event.slug}</p>

            {event.posterUrl && (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.posterUrl} alt="" className="max-h-96 w-full object-cover" />
              </div>
            )}

            <div className="mt-6 border-t border-slate-100 pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Mô tả sự kiện</h2>
              <div className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                {event.description || <span className="italic text-slate-400">Không có mô tả.</span>}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Suất diễn và hạng vé</h2>
            <p className="mt-1 text-xs text-slate-500">Chỉ đọc dành cho kiểm duyệt viên, không thể chỉnh sửa tại đây.</p>

            {showingsQuery.isLoading && (
              <p className="mt-4 text-sm text-slate-400">Đang tải suất diễn…</p>
            )}

            {showingsQuery.isError && <p role="alert" className="mt-4 text-sm text-rose-700">Không thể tải suất diễn. <button className="tv-button" onClick={() => void showingsQuery.refetch()}>Thử lại</button></p>}
            {!showingsQuery.isLoading && !showingsQuery.isError && showings.length === 0 && (
              <p className="mt-4 text-sm italic text-slate-400">Sự kiện chưa thiết lập suất diễn nào.</p>
            )}

            <div className="mt-4 space-y-4">
              {showings.map(sh => (
                <ShowingReviewCard key={sh.showingId} showing={sh} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Lịch sử xét duyệt sự kiện này</h2>
            {historyQuery.isLoading && (
              <p className="mt-2 text-sm text-slate-400">Đang tải lịch sử…</p>
            )}
            {historyQuery.isError && <p role="alert" className="mt-4 text-sm text-rose-700">Không thể tải lịch sử. <button className="tv-button" onClick={() => void historyQuery.refetch()}>Thử lại</button></p>}
            {!historyQuery.isLoading && !historyQuery.isError && eventHistory.length === 0 && (
              <p className="mt-2 text-sm text-slate-500">Chưa ghi nhận quyết định nào trước đó.</p>
            )}
            {!historyQuery.isLoading && eventHistory.length > 0 && (
              <div className="mt-4 divide-y divide-slate-100">
                {eventHistory.map(h => (
                  <div key={h.reviewId} className="py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${h.action === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {h.action === 'APPROVED' ? 'Phê duyệt' : 'Từ chối'}
                      </span>
                      <span className="text-xs text-slate-400">{new Date(h.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">Kiểm duyệt viên: {h.moderatorName || h.moderatorId}</p>
                    {h.reason && (
                      <p className="mt-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-700">Lý do: {h.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Ban tổ chức</h2>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <Building size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{event.organizer.name}</p>
                <p className="text-xs text-slate-400">Mã: {event.organizer.organizerId}</p>
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              Trạng thái ban tổ chức: <span className={`font-semibold ${event.organizer.status === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600'}`}>{event.organizer.status}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Quyết định kiểm duyệt</h2>
            
            {!isPending && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
                Sự kiện đang ở trạng thái <strong>{event.status}</strong>, không thể thực hiện phê duyệt hoặc từ chối tại thời điểm này.
                {event.rejectionReason && (
                  <p className="mt-2 text-rose-700">Lý do từ chối: {event.rejectionReason}</p>
                )}
              </div>
            )}

            {isPending && isOwn && (
              <div className="mt-4 rounded-xl bg-amber-50 p-4 text-xs text-amber-800">
                Hành động bị khóa do bạn sở hữu sự kiện này.
              </div>
            )}

            {isPending && !isOwn && (
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  disabled={isOrganizerSuspended}
                  onClick={() => { setActionError(''); setApproveOpen(true); }}
                  className="tv-button tv-primary flex w-full items-center justify-center gap-2 !bg-emerald-600 hover:!bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle2 size={18} /> Phê duyệt sự kiện
                </button>
                <button
                  type="button"
                  onClick={() => { setActionError(''); setRejectOpen(true); }}
                  className="tv-button flex w-full items-center justify-center gap-2 border-rose-300 text-rose-700 hover:bg-rose-50"
                >
                  <XCircle size={18} /> Từ chối sự kiện
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {approveOpen && (
        <Dialog title="Xác nhận phê duyệt sự kiện" onClose={() => setApproveOpen(false)} busy={actionBusy} light>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Sự kiện sẽ chuyển sang trạng thái <strong>PUBLISHED</strong> và xuất hiện công khai trên sàn vé cho mọi người truy cập.
            </p>
            {actionError && (
              <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{actionError}</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="tv-button"
                disabled={actionBusy}
                onClick={() => setApproveOpen(false)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="tv-button tv-primary !bg-emerald-600 hover:!bg-emerald-700"
                disabled={actionBusy}
                onClick={() => void handleApprove()}
              >
                {actionBusy ? 'Đang xử lý…' : 'Xác nhận duyệt'}
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {rejectOpen && (
        <Dialog title="Từ chối phê duyệt sự kiện" onClose={() => setRejectOpen(false)} busy={actionBusy} light>
          <form onSubmit={handleReject} className="space-y-4">
            <p className="text-sm text-slate-600">
              Vui lòng nhập lý do cụ thể để Ban tổ chức biết và chỉnh sửa lại sự kiện.
            </p>
            <label className="block text-sm" htmlFor="reject-reason">
              Lý do từ chối (bắt buộc, tối đa 2000 ký tự):
              <textarea
                id="reject-reason"
                required
                maxLength={2000}
                rows={4}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Thiếu thông tin liên hệ, poster vi phạm quy chuẩn…"
                className="tv-input text-sm"
              />
              <span className="mt-1 block text-right text-xs text-slate-400">{rejectReason.length}/2000 ký tự</span>
            </label>
            {actionError && (
              <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{actionError}</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="tv-button"
                disabled={actionBusy}
                onClick={() => setRejectOpen(false)}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="tv-button tv-primary !bg-rose-600 hover:!bg-rose-700"
                disabled={actionBusy}
              >
                {actionBusy ? 'Đang gửi…' : 'Xác nhận từ chối'}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}

function ShowingReviewCard({ showing }: { showing: Showing }) {
  const [open, setOpen] = useState(false);
  const ticketsQuery = useQuery({
    queryKey: ['moderator', 'showing-tickets', showing.showingId],
    queryFn: ({ signal }) => moderationApi.ticketTypes(showing.showingId, signal),
    enabled: open,
  });

  const tickets = ticketsQuery.data ?? [];

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{showing.name}</p>
          <p className="text-xs text-slate-500">
            {new Date(showing.startTime).toLocaleString('vi-VN')} – {new Date(showing.endTime).toLocaleString('vi-VN')}
          </p>
          <p className="text-xs text-slate-500">{showing.venueName}, {showing.city}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          {open ? 'Ẩn hạng vé' : 'Xem hạng vé'}
        </button>
      </div>

      {open && (
        <div className="mt-3 border-t border-slate-200/60 pt-3">
          {ticketsQuery.isLoading && <p className="text-xs text-slate-400">Đang tải hạng vé…</p>}
          {ticketsQuery.isError && <p role="alert" className="text-xs text-rose-700">Không thể tải hạng vé. <button className="tv-button" onClick={() => void ticketsQuery.refetch()}>Thử lại</button></p>}
          {!ticketsQuery.isLoading && !ticketsQuery.isError && tickets.length === 0 && <p className="text-xs italic text-slate-400">Chưa có hạng vé nào.</p>}
          {!ticketsQuery.isLoading && tickets.length > 0 && (
            <div className="space-y-2">
              {tickets.map(t => (
                <div key={t.ticketTypeId} className="flex items-center justify-between rounded-lg bg-white p-2.5 text-xs shadow-sm">
                  <div>
                    <span className="font-semibold text-slate-900">{t.name}</span>
                    <span className="ml-2 text-slate-400">({t.status})</span>
                    {t.description && <p className="text-slate-500">{t.description}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{Number(t.price).toLocaleString('vi-VN')} đ</p>
                    <p className="text-slate-400">SL: {t.totalQuantity}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
