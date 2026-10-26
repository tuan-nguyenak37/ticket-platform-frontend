'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Failure } from '@/components/ui/commerce';
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

export function ReviewReadiness({ event, root, writable, submit }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const sending = useRef(false);
  const readiness = useQuery({ queryKey: [...root, event.eventId, 'readiness'], queryFn: ({ signal }) => organizerApi.readiness(event.eventId, signal) });
  const eligible = writable && event.status === 'DRAFT' && readiness.data?.ready && !readiness.isFetching;
  async function confirm() {
    if (sending.current || !eligible) return;
    sending.current = true; setBusy(true); setError(null);
    try { await submit(); setOpen(false); }
    catch (failure) { setError(failure); await readiness.refetch(); }
    finally { sending.current = false; setBusy(false); }
  }
  return <section id="review" className="tv-panel scroll-mt-24 space-y-4" aria-labelledby="review-title">
    <h2 id="review-title" className="text-xl font-semibold">Kiểm tra & gửi duyệt</h2>
    <p>Điều kiện gửi duyệt được kiểm tra trực tiếp tại backend.</p>
    {readiness.isPending && <p role="status">Đang kiểm tra…</p>}
    {readiness.error && <Failure error={readiness.error} retry={() => void readiness.refetch()} />}
    {readiness.data?.issues.map(issue => <p className="tv-notice" key={issue.code + issue.resourceId}><Link className="underline" href={`/organizer/${event.organizerId}/events/${event.eventId}?step=${issue.step === 3 ? 2 : issue.step}`}>{issue.message}</Link></p>)}
    {readiness.data?.ready && <p className="tv-notice">Dữ liệu đã sẵn sàng. Gửi duyệt chưa phải xuất bản.</p>}
    {event.status === 'PENDING_REVIEW' && <p className="tv-muted">Nội dung đang chờ kiểm duyệt.</p>}
    {event.status === 'REJECTED' && <p className="tv-muted">Chỉnh sửa nội dung để trở về bản nháp trước khi gửi lại.</p>}
    <button type="button" className="tv-button tv-primary" disabled={!eligible || busy} onClick={() => setOpen(true)}>Gửi kiểm duyệt</button>
    {open && <Dialog title="Xác nhận gửi kiểm duyệt" busy={busy} onClose={() => setOpen(false)}><p>Nội dung sự kiện và vé bị khóa trong thời gian chờ duyệt.</p>{error != null && <Failure error={error} />}<div className="mt-5 flex justify-end gap-3"><button className="tv-button" disabled={busy} onClick={() => setOpen(false)}>Quay lại</button><button className="tv-button tv-primary" disabled={busy || !eligible} onClick={() => void confirm()}>Xác nhận gửi</button></div></Dialog>}
  </section>;
}
