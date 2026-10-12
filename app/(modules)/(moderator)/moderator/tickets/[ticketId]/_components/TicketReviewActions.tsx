'use client';
import { useState } from 'react';
import type { TicketDetail, ReviewInput } from '../../_lib/tickets.types';
import { approvalError, canReview } from '../../_lib/tickets.utils';
import { RejectTicketDialog } from './RejectTicketDialog';

export function TicketReviewActions({ ticket, actorId, busy, onReview, onCheck }: { ticket: TicketDetail; actorId?: string; busy: boolean; onReview: (input: ReviewInput) => Promise<void>; onCheck: () => Promise<void> }) {
  const codes = ticket.check?.codes ?? [];
  const [selected, setSelected] = useState(codes.length === 1 ? codes[0].id : '');
  const [note, setNote] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  // The parent keys this form by check version/status, resetting stale code selections.
  const allowed = canReview(ticket, actorId);
  const running = ['queued', 'processing'].includes(ticket.check?.status ?? '');
  const error = approvalError(ticket, actorId, selected, note, 0);
  const approve = async () => {
    const error = approvalError(ticket, actorId, selected, note, Date.now());
    if (error) { setLocalError(error); return; }
    setLocalError(null);
    await onReview({ decision: 'approve', checkVersion: ticket.check!.version, selectedCodeId: selected, ...(note.trim() ? { note: note.trim() } : {}) });
  };
  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
    <h2 className="font-bold">Quyết định kiểm duyệt</h2>
    {ticket.sellerId === actorId && <p className="text-sm text-amber-800">Bạn không được duyệt hoặc từ chối vé do chính mình đăng.</p>}
    {ticket.status !== 'pending_review' || ticket.review ? <p className="text-sm text-slate-500">Vé này không còn chờ quyết định kiểm duyệt.</p> : <>
      {running && <p role="status" className="rounded-xl bg-violet-50 p-3 text-sm text-violet-700">{ticket.check?.status === 'queued' ? 'Đang xếp hàng' : 'Đang kiểm tra'} · Tự cập nhật tối đa 100 lần; dùng Làm mới nếu worker chưa hoàn tất.</p>}
      <p className="text-xs text-slate-500">Kiểm tra lại chỉ dành cho vé chờ duyệt, ít nhất một phút sau lần cập nhật kiểm tra trước. Backend xác định thời điểm được phép.</p>
      <fieldset disabled={busy || !allowed || ticket.check?.status !== 'completed'} className="space-y-2"><legend className="mb-2 text-sm font-semibold">Chọn mã vé đã đọc được</legend>{codes.length ? codes.map((code, index) => <label key={code.id} className="flex items-center gap-2 rounded-xl border p-3 text-sm"><input type="radio" name="decoded-code" value={code.id} checked={selected === code.id} onChange={() => setSelected(code.id)} /><span>Mã {index + 1} · {code.format} · Trang {code.page}</span></label>) : <p className="text-sm text-slate-500">Chưa đọc được mã vé; không thể duyệt hoặc nhập mã bằng tay.</p>}</fieldset>
      <label className="block text-sm font-semibold">Ghi chú xử lý cảnh báo{Boolean(ticket.check?.report?.reasons.length) && ' (bắt buộc)'}<textarea value={note} maxLength={2000} disabled={busy || !allowed} onChange={e => setNote(e.target.value)} rows={4} className="mt-2 w-full rounded-xl border p-3 font-normal" /></label><p className="text-right text-xs text-slate-500">{note.trim().length}/2000</p>
      {(localError || error) && <p role={localError ? 'alert' : undefined} className="text-sm text-amber-800">{localError || error}</p>}
      <div className="flex flex-wrap gap-2"><button disabled={busy || running} onClick={() => void onCheck()} className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50">{ticket.check ? 'Kiểm tra lại' : 'Bắt đầu kiểm tra'}</button><button disabled={busy || Boolean(error)} onClick={() => void approve()} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Duyệt vé</button><button disabled={busy || !allowed} onClick={() => setRejecting(true)} className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50">Từ chối vé</button></div>
    </>}
    {rejecting && <RejectTicketDialog busy={busy} onClose={() => setRejecting(false)} onConfirm={async reason => { setRejecting(false); await onReview({ decision: 'reject', reason }); }} />}
  </section>;
}
