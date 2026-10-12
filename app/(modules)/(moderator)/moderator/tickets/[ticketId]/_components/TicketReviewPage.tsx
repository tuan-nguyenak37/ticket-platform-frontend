'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth.store';
import { AppApiError } from '@/lib/http/http-errors';
import { useTicketDetail } from '../../_hooks/useTicketDetail';
import type { ReviewInput } from '../../_lib/tickets.types';
import { canReview, dateTime, money, statusLabels, checkLabels } from '../../_lib/tickets.utils';
import { TicketFilePreview } from './TicketFilePreview';
import { CheckReportPanel } from './CheckReportPanel';
import { TicketReviewActions } from './TicketReviewActions';

export function TicketReviewPage({ id }: { id: string }) {
  const { query, check, review } = useTicketDetail(id);
  const actorId = useAuthStore(state => state.user?.user_id);
  const lock = useRef(false);
  const [feedback, setFeedback] = useState<{ message: string; error: boolean } | null>(null);
  const busy = check.isPending || review.isPending;
  const onReview = async (input: ReviewInput) => {
    if (lock.current || !query.data || !canReview(query.data, actorId)) return;
    lock.current = true; setFeedback(null);
    try { await review.mutateAsync(input); setFeedback({ message: input.decision === 'approve' ? 'Đã kiểm tra thông tin' : 'Đã từ chối vé.', error: false }); }
    catch (error) { setFeedback({ message: error instanceof AppApiError && error.statusCode === 409 ? `Phiên bản kiểm tra hoặc trạng thái vé đã thay đổi. Đã yêu cầu tải lại; hãy đối chiếu kết quả mới trước khi gửi lại. ${error.message}` : error instanceof Error ? error.message : 'Không thể lưu quyết định.', error: true }); }
    finally { lock.current = false; }
  };
  const onCheck = async () => {
    if (lock.current || query.data?.status !== 'pending_review') return;
    lock.current = true; setFeedback(null);
    try { await check.mutateAsync(); setFeedback({ message: 'Đã gửi yêu cầu kiểm tra. Kết quả sẽ tự cập nhật khi worker xử lý xong.', error: false }); }
    catch (error) { setFeedback({ message: error instanceof Error ? error.message : 'Không thể kiểm tra vé.', error: true }); }
    finally { lock.current = false; }
  };
  const ticket = query.data;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><Link href="/moderator/tickets" className="text-sm text-violet-700">← Danh sách vé</Link><h1 className="mt-2 break-all text-xl font-bold">Duyệt vé {id}</h1></div><button disabled={busy || query.isFetching} onClick={() => void query.refetch()} className="rounded-xl border bg-white px-4 py-2 text-sm disabled:opacity-50">Làm mới</button></div>
    {feedback && <p role={feedback.error ? 'alert' : 'status'} className={`rounded-xl p-4 text-sm ${feedback.error ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'}`}>{feedback.message}</p>}
    {query.isError && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{query.error.message} <button disabled={busy} onClick={() => void query.refetch()} className="underline">Thử lại</button></p>}
    {query.isPending ? <p role="status">Đang tải chi tiết vé…</p> : ticket && <div className="grid items-start gap-5 xl:grid-cols-2">
      <TicketFilePreview key={ticket.ticket_id} id={ticket.ticket_id} />
      <div className="space-y-5">
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Thông tin người bán khai báo</h2><h3 className="text-lg font-semibold text-violet-800">{ticket.event.name}</h3><p className="text-sm text-slate-500">{ticket.event.venueName} · {dateTime(ticket.event.startTime)}</p><dl className="grid grid-cols-2 gap-3 text-sm">{[['Hạng vé', ticket.ticketTier], ['Ghế', ticket.seatInfo || '—'], ['Giá gốc', money(ticket.originalPrice)], ['Giá bán', money(ticket.price)], ['Người bán', ticket.sellerId], ['Trạng thái', statusLabels[ticket.status]]].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-all font-medium">{value}</dd></div>)}</dl>{ticket.description && <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>}</section>
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Kết quả đối chiếu</h2>{ticket.check && <p className="text-xs text-slate-500">{checkLabels[ticket.check.status]} · Phiên bản {ticket.check.version} · {ticket.check.attempts} lần thử{ticket.check.completedAt ? ` · ${dateTime(ticket.check.completedAt)}` : ''}{ticket.check.errorCode ? ` · ${ticket.check.errorCode}` : ''}</p>}{ticket.check && ticket.check.status !== 'completed' && ticket.check.report && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Kết quả cũ chỉ để tham khảo; không dùng để duyệt lượt hiện tại.</p>}<CheckReportPanel report={ticket.check?.report ?? null} /></section>
        <TicketReviewActions key={`${ticket.ticket_id}:${ticket.check?.version ?? 0}:${ticket.check?.status ?? 'none'}:${ticket.check?.codes.map(code => code.id).join(',') ?? ''}`} ticket={ticket} actorId={actorId} busy={busy || query.isError || query.isFetching} onReview={onReview} onCheck={onCheck} />
        {ticket.review && <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Quyết định đã lưu</h2><p className="font-semibold text-violet-700">{ticket.review.decision === 'approve' ? 'Đã kiểm tra thông tin' : 'Đã từ chối'}</p><p className="text-sm">{ticket.review.method === 'manual' ? 'Duyệt thủ công' : 'Duyệt tự động'} · {dateTime(ticket.review.createdAt)}</p><p className="text-xs text-slate-500">Người duyệt: {ticket.review.actorId ?? 'Hệ thống'} · Phiên bản: {ticket.review.checkVersion ?? '—'}</p><p className="whitespace-pre-wrap text-sm">{ticket.review.note ?? 'Không có ghi chú.'}</p><details><summary className="cursor-pointer text-sm font-semibold text-violet-700">Báo cáo tại thời điểm quyết định</summary><div className="mt-4"><CheckReportPanel report={ticket.review.report} /></div></details></section>}
      </div>
    </div>}
  </div>;
}
