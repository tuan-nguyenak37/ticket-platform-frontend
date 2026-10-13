'use client';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { X, Paperclip } from 'lucide-react';
import { actOnOrder, getOrder, uploadDisputeEvidence } from '@/lib/commerce/api';
import type { OrderDetail } from '@/lib/commerce/types';
import { Failure } from './shared';

const formats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

export function DisputeDialog({ order, actor, onClose, onUpdated }: {
  order: OrderDetail; actor: string; onClose: () => void; onUpdated: (order: OrderDetail) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null); const heading = useId(); const lock = useRef(false);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState(''); const [reviewRequired, setReviewRequired] = useState(false);
  const [finished, setFinished] = useState(false);
  const existing = order.dispute;
  const remaining = Math.max(0, 5 - (existing?.attachments ?? []).filter(file => file.uploadedBy === actor).length);
  useEffect(() => {
    const element = dialog.current; const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element?.showModal(); document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  function choose(selected: FileList | null) {
    if (!selected) return;
    const next = [...files, ...Array.from(selected)];
    if (next.length > remaining) { setError(new Error(`Bạn có thể bổ sung tối đa ${remaining} file.`)); return; }
    const invalid = next.find(file => !formats.includes(file.type) || !file.size || file.size > 5 * 1024 * 1024);
    if (invalid) { setError(new Error(`${invalid.name}: chỉ nhận ảnh JPEG, PNG, GIF, WebP hoặc PDF, dung lượng từ 1 byte đến 5 MB. Chưa hỗ trợ video.`)); return; }
    setError(null); setFiles(next);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current || reviewRequired || finished) return;
    const data = new FormData(event.currentTarget);
    const reason = String(data.get('reason') ?? '').trim(); const evidence = String(data.get('evidence') ?? '').trim();
    if (!existing && (!reason || reason.length > 2000 || !evidence || evidence.length > 5000)) {
      setError(new Error('Vui lòng nhập lý do (tối đa 2.000 ký tự) và mô tả bằng chứng (tối đa 5.000 ký tự).')); return;
    }
    if (existing && !files.length) { setError(new Error('Vui lòng chọn file bằng chứng.')); return; }
    lock.current = true; setBusy(true); setError(null); setMessage('Đang gửi yêu cầu…');
    let sent = 0;
    try {
      let current = await getOrder(order.order_id, false);
      if (!current.dispute) current = await actOnOrder(order.order_id, { path: 'dispute', body: { reason, evidence } }, false);
      if (current.dispute?.status !== 'open' || current.status !== 'disputed') throw new Error('Tranh chấp đã đóng, không thể bổ sung bằng chứng.');
      onUpdated(current);
      const available = 5 - (current.dispute.attachments ?? []).filter(file => file.uploadedBy === actor).length;
      if (files.length > available) throw new Error(`Số file đã thay đổi. Hiện chỉ còn chỗ cho ${available} file.`);
      for (const file of files) {
        setMessage(`Đang gửi file ${sent + 1}/${files.length}: ${file.name}`);
        current = await uploadDisputeEvidence(order.order_id, file);
        sent += 1; setFiles(previous => previous.filter(item => item !== file)); onUpdated(current);
      }
      setFinished(true); setMessage(`Đã gửi ${existing ? 'bằng chứng' : 'báo cáo tranh chấp'}${sent ? ` và ${sent} file` : ''}. Bạn có thể theo dõi xử lý trong chi tiết đơn hàng.`);
    } catch (failure) {
      setError(failure); setReviewRequired(true);
      setMessage(`Đã xác nhận gửi ${sent} file trong lần này. Hãy đóng cửa sổ và kiểm tra danh sách bằng chứng trước khi gửi bổ sung; yêu cầu bị mất phản hồi có thể đã được lưu.`);
      try { onUpdated(await getOrder(order.order_id, false)); } catch { /* Keep the upload error visible if reconciliation also fails. */ }
    } finally { lock.current = false; setBusy(false); }
  }
  return <dialog ref={dialog} aria-labelledby={heading} aria-busy={busy} onCancel={event => { event.preventDefault(); if (!lock.current) onClose(); }} className="commerce fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border border-white/15 bg-[#100e20] p-6 text-white shadow-2xl backdrop:bg-slate-950/75 backdrop:backdrop-blur-sm sm:p-8">
    <div className="mb-5 flex items-start justify-between gap-4"><div><h2 id={heading} className="text-2xl font-semibold">{existing ? 'Bổ sung bằng chứng' : 'Báo cáo tranh chấp'}</h2><p className="mt-2 break-words text-sm text-white/60">{order.ticket.eventName}</p></div><button type="button" disabled={busy} onClick={onClose} aria-label="Đóng báo cáo tranh chấp" className="rounded-full p-2 hover:bg-white/10 disabled:opacity-50"><X size={20} /></button></div>
    {error != null && <Failure error={error} />}
    {message && <p role="status" className="my-4 text-sm leading-6">{message}</p>}
    {!finished && <form onSubmit={event => void submit(event)} noValidate><fieldset disabled={busy || reviewRequired} className="space-y-4">
      {!existing && <><label className="block text-sm">Lý do tranh chấp *<textarea name="reason" required maxLength={2000} rows={2} className="tv-input mt-2" placeholder="Ví dụ: Vé không sử dụng được tại sự kiện" /></label><label className="block text-sm">Mô tả bằng chứng *<textarea name="evidence" required maxLength={5000} rows={4} className="tv-input mt-2" placeholder="Mô tả vấn đề, thời điểm xảy ra và thông tin giúp xác minh…" /></label></>}
      <div className="rounded-2xl border border-dashed border-violet-400/40 bg-violet-500/5 p-4"><label className="block text-sm"><span className="mb-3 flex items-center gap-2 font-medium"><Paperclip size={18} />Ảnh hoặc tài liệu xác minh</span><input type="file" multiple accept={formats.join(',')} disabled={!remaining || busy || reviewRequired} onChange={event => { choose(event.target.files); event.target.value = ''; }} className="block w-full min-w-0 text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-violet-600 file:px-3 file:py-2 file:text-white" /></label><p className="mt-3 text-xs leading-5 text-white/60">JPEG, PNG, GIF, WebP hoặc PDF · tối đa 5 MB/file, 5 file mỗi bên. Còn {remaining} file có thể bổ sung. Chưa hỗ trợ video. File đã gửi không thể xóa.</p></div>
      {files.length > 0 && <ul className="space-y-2">{files.map((file, index) => <li key={`${file.name}:${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-3 text-sm"><span className="min-w-0 break-words">{file.name}<span className="block text-xs opacity-60">{(file.size / 1024 / 1024).toFixed(2)} MB</span></span><button type="button" onClick={() => setFiles(previous => previous.filter((_, position) => position !== index))} aria-label={`Bỏ file ${file.name}`} className="shrink-0 p-2"><X size={16} /></button></li>)}</ul>}
      <button className="tv-button tv-primary w-full">{busy ? 'Đang gửi…' : existing ? 'Gửi bằng chứng' : 'Gửi báo cáo tranh chấp'}</button>
    </fieldset></form>}
    <button type="button" disabled={busy} onClick={onClose} className="tv-button mt-4 w-full">{finished || reviewRequired ? 'Về chi tiết đơn hàng' : 'Đóng'}</button>
  </dialog>;
}
