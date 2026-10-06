'use client';

import { useEffect, useRef } from 'react';
import { X, Search, Pin } from 'lucide-react';
import type { PublicEvent } from '@/lib/events/events.types';
import { usePinCandidates } from '../_hooks/usePinCandidates';
import { EventBanner, eventSchedule } from './EventBanner';

interface Props {
  pinnedIds: string[];
  busy: boolean;
  pendingId?: string;
  error: string | null;
  canPin: boolean;
  onClose: () => void;
  onPin: (event: PublicEvent) => void;
}

export function PinEventDialog({ pinnedIds, busy, pendingId, error, canPin, onClose, onPin }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const result = usePinCandidates();
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.showModal();
    inputRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  const pages = Math.max(1, Math.ceil((result.data?.total ?? 0) / 10));
  return <dialog ref={dialogRef} aria-labelledby="pin-dialog-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 text-slate-900 shadow-2xl backdrop:bg-slate-950/60 sm:p-7">
    <div className="flex items-center justify-between gap-4">
      <h2 id="pin-dialog-title" className="text-lg font-bold">Chọn sự kiện để ghim</h2>
      <button type="button" onClick={onClose} disabled={busy} aria-label="Đóng hộp chọn" className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-50"><X size={20} /></button>
    </div>
    <p className="mt-2 text-sm text-slate-500">Chọn sự kiện đã công bố và chưa kết thúc để hiển thị trên trang chủ.</p>
    <fieldset disabled={busy} className="mt-5 min-w-0 space-y-4">
      <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5">
        <Search size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
        <span className="sr-only">Tìm theo tên sự kiện</span>
        <input ref={inputRef} value={result.search} maxLength={255} onChange={event => result.setSearch(event.target.value)} placeholder="Tìm theo tên sự kiện…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
      </label>
      <div className="flex gap-2" role="group" aria-label="Thời gian sự kiện">
        {([{ value: 'upcoming', label: 'Sắp diễn ra' }, { value: 'ongoing', label: 'Đang diễn ra' }] as const).map(tab => <button key={tab.value} type="button" aria-pressed={result.phase === tab.value} onClick={() => result.setPhase(tab.value)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${result.phase === tab.value ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{tab.label}</button>)}
      </div>
    </fieldset>
    {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {!canPin && <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Hiện chưa thể ghim thêm. Kiểm tra danh sách ghim hoặc bỏ ghim một sự kiện nếu đã đủ 4 vị trí.</p>}
    <div className="mt-4" aria-busy={result.isFetching || busy}>
      {result.isPending || result.isDebouncing ? <p role="status" className="py-12 text-center text-sm text-slate-500">Đang tìm sự kiện…</p>
        : result.isError ? <div role="alert" className="py-8 text-center text-sm text-rose-700"><p>{result.error.message}</p><button type="button" disabled={busy} onClick={() => void result.refetch()} className="mt-3 font-semibold underline">Thử lại</button></div>
        : !result.data.items.length ? <p className="py-12 text-center text-sm text-slate-500">Không tìm thấy sự kiện phù hợp.</p>
        : <ul className="divide-y divide-slate-100">{result.data.items.map(event => {
          const pinned = pinnedIds.includes(event.event_id) || event.isPinned;
          const eligible = event.status === 'published' && event.phase !== 'ended';
          return <li key={event.event_id} className="flex flex-wrap items-center gap-3 py-4 sm:flex-nowrap">
            <EventBanner event={event} compact />
            <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">{event.name}</h3><p className="mt-1 text-xs text-slate-500">{eventSchedule(event)}</p></div>
            <button type="button" onClick={() => onPin(event)} disabled={busy || pinned || !eligible || !canPin} className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:bg-slate-100 disabled:text-slate-500"><Pin size={14} aria-hidden="true" />{pendingId === event.event_id && busy ? 'Đang ghim…' : pinned ? 'Đã ghim' : !eligible ? 'Đã kết thúc' : 'Ghim'}</button>
          </li>;
        })}</ul>}
    </div>
    <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
      <button type="button" disabled={busy || result.isFetching || result.isDebouncing || result.page <= 1} onClick={() => result.setPage(result.page - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Trước</button>
      <span className="text-slate-500">Trang {result.page} / {pages}</span>
      <button type="button" disabled={busy || result.isFetching || result.isDebouncing || result.isError || result.page >= pages} onClick={() => result.setPage(result.page + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Sau</button>
    </div>
  </dialog>;
}
