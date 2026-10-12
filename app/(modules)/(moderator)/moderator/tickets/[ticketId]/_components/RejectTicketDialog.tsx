'use client';
import { useEffect, useRef, useState } from 'react';
export function RejectTicketDialog({ busy, onClose, onConfirm }: { busy: boolean; onClose: () => void; onConfirm: (reason: string) => Promise<void> }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState('');
  useEffect(() => { const previous = document.activeElement; const dialog = dialogRef.current; dialog?.showModal(); return () => { dialog?.close(); if (previous instanceof HTMLElement) previous.focus(); }; }, []);
  return <dialog ref={dialogRef} aria-labelledby="reject-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-lg rounded-2xl bg-white p-6 shadow-xl backdrop:bg-slate-950/60">
    <h2 id="reject-title" className="text-lg font-bold">Từ chối vé</h2><p className="mt-2 text-sm text-slate-500">Quyết định chỉ thực hiện một lần. Người bán cần đăng vé mới nếu bị từ chối.</p>
    <label className="mt-4 block text-sm font-semibold">Lý do từ chối<textarea value={reason} disabled={busy} onChange={e => setReason(e.target.value)} maxLength={2000} rows={5} className="mt-2 w-full rounded-xl border p-3 font-normal" /></label><p className="text-right text-xs text-slate-500">{reason.trim().length}/2000</p>
    <div className="mt-5 flex justify-end gap-3"><button disabled={busy} onClick={onClose} className="rounded-xl border px-4 py-2">Đóng</button><button disabled={busy || !reason.trim() || reason.trim().length > 2000} onClick={() => void onConfirm(reason.trim())} className="rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Đang xử lý…' : 'Xác nhận từ chối'}</button></div>
  </dialog>;
}
