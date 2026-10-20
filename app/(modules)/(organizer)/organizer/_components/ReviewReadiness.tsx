'use client';

import { useQueries } from '@tanstack/react-query';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { useAuthStore } from '@/lib/auth/auth.store';
import { organizerApi, type Event, type Showing } from '../_lib/organizer.api';

type Props = {
  event: Event;
  showings: Showing[] | undefined;
  showingsPending: boolean;
  showingsError: Error | null;
  retryShowings: () => unknown;
  root: readonly (string | number | undefined)[];
  writable: boolean;
  submit: () => Promise<unknown>;
};

export function ReviewReadiness({ event, showings, showingsPending, showingsError, retryShowings, root, writable, submit }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sending = useRef(false);
  const revision = useAuthStore(state => state.revision);
  const tickets = useQueries({ queries: (showings ?? []).map(showing => ({
    queryKey: [...root, event.organizerId, 'tickets', showing.showingId],
    queryFn: ({ signal }: { signal: AbortSignal }) => organizerApi.tickets(showing.showingId, signal),
    enabled: !showingsPending && !showingsError,
  })) });
  const loading = showingsPending || (!!showings && tickets.some(query => query.isPending || query.isFetching));
  const failed = !!showingsError || !showings || tickets.some(query => query.isError);
  const missing: string[] = [];
  if (showings && !loading && !failed) {
    if (!showings.length) missing.push('Chưa có suất diễn.');
    showings.forEach((showing, index) => {
      const items = tickets[index].data ?? [];
      if (!items.length) missing.push(`Suất diễn “${showing.name}” chưa có hạng vé.`);
      if (items.some(ticket => !ticket.saleStartAt || !ticket.saleEndAt)) missing.push(`Suất diễn “${showing.name}” có hạng vé chưa đặt đủ lịch bán.`);
    });
  }
  const eligible = writable && event.status === 'DRAFT' && !!event.description?.trim();

  async function confirm() {
    if (sending.current || !eligible || loading || failed) return;
    sending.current = true;
    setBusy(true);
    setError('');
    try {
      await submit();
      if (useAuthStore.getState().revision === revision) setOpen(false);
    } catch (failure) {
      if (useAuthStore.getState().revision === revision) setError(failure instanceof Error ? failure.message : 'Không thể gửi duyệt. Vui lòng thử lại.');
    } finally {
      sending.current = false;
      if (useAuthStore.getState().revision === revision) setBusy(false);
    }
  }

  return <section id="review" className="tv-panel scroll-mt-24 space-y-4" aria-labelledby="review-title">
    <h2 id="review-title" className="text-xl font-semibold">Kiểm tra & gửi duyệt</h2>
    <p>Mô tả: {event.description?.trim() ? 'Đã có' : 'Chưa có — cần bổ sung để gửi duyệt.'}</p>
    {loading && <p role="status" className="tv-muted">Đang tải suất diễn và hạng vé…</p>}
    {failed && <div role="alert" className="tv-notice space-y-3"><p>Chưa tải đủ dữ liệu để kiểm tra. Không thể xác định phần nào còn thiếu.</p><button type="button" className="tv-button" onClick={() => { retryShowings(); tickets.filter(query => query.isError).forEach(query => void query.refetch()); }}>Tải lại tóm tắt</button></div>}
    {!loading && !failed && showings && <><p>{showings.length} suất diễn đã lưu.</p><ul className="space-y-2">{showings.map((showing, index) => <li key={showing.showingId} className="rounded-xl border border-[var(--tv-border)] p-3"><Link className="font-medium text-violet-700" href={`/organizer/${event.organizerId}/events/${event.eventId}/showings/${showing.showingId}#tickets`}>{showing.name}</Link> · {tickets[index].data?.length ?? 0} hạng vé{tickets[index].data?.some(ticket => !ticket.saleStartAt || !ticket.saleEndAt) ? ' · Có hạng vé chưa đặt lịch bán' : ''}</li>)}</ul>{missing.length > 0 && <div className="tv-notice"><p className="font-semibold">Khuyến nghị trước khi gửi:</p><ul className="mt-2 list-disc pl-5">{missing.map(message => <li key={message}>{message}</li>)}</ul></div>}</>}
    {event.status === 'PENDING_REVIEW' && <p className="tv-muted">Đang chờ kiểm duyệt; nội dung sự kiện và suất diễn tạm khóa. Hạng vé có quy tắc riêng.</p>}
    {event.status === 'REJECTED' && <p className="tv-muted">Hãy sửa nội dung sự kiện hoặc suất diễn thực sự để trở về bản nháp, rồi gửi duyệt lại.</p>}
    {event.status === 'DRAFT' && !event.description?.trim() && <p className="tv-muted">Cần bổ sung mô tả trước khi gửi kiểm duyệt.</p>}
    <button type="button" className="tv-button tv-primary" disabled={!eligible || busy || loading || failed} onClick={() => { setError(''); setOpen(true); }}>Gửi kiểm duyệt</button>
    {open && eligible && <Dialog title="Xác nhận gửi kiểm duyệt" busy={busy} light onClose={() => setOpen(false)}><div className="space-y-4"><p>Sau khi gửi, nội dung sự kiện và suất diễn sẽ bị khóa trong thời gian chờ duyệt.</p>{loading && <p role="status">Đang kiểm tra dữ liệu suất diễn và hạng vé…</p>}{failed && <p role="alert">Không thể kiểm tra đủ dữ liệu. Vui lòng tải lại tóm tắt trước khi gửi.</p>}{!loading && !failed && missing.length > 0 && <div className="tv-notice"><p className="font-semibold">Những phần nên bổ sung (không bắt buộc):</p><ul className="mt-2 list-disc pl-5">{missing.map(message => <li key={message}>{message}</li>)}</ul></div>}{error && <p role="alert" className="tv-notice">{error}</p>}<div className="flex justify-end gap-3"><button type="button" className="tv-button" disabled={busy} onClick={() => setOpen(false)}>Quay lại</button><button type="button" className="tv-button tv-primary" disabled={busy || !eligible || loading || failed} onClick={() => void confirm()}>{busy ? 'Đang gửi…' : 'Xác nhận gửi'}</button></div></div></Dialog>}
  </section>;
}
