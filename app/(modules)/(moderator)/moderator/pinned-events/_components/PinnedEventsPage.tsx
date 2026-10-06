'use client';

import { useRef, useState } from 'react';
import { Pin, Plus, RefreshCw } from 'lucide-react';
import { usePinnedEvents } from '@/lib/events/usePinnedEvents';
import type { PublicEvent } from '@/lib/events/events.types';
import { useEventPin } from '../_hooks/useEventPin';
import { PinnedEventCard } from './PinnedEventCard';
import { PinEventDialog } from './PinEventDialog';

export function PinnedEventsPage() {
  const query = usePinnedEvents();
  const mutation = useEventPin();
  const inFlight = useRef(false);
  const [selecting, setSelecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const events = query.data ?? [];
  const full = events.length >= 4;
  const canPin = query.isSuccess && !query.isFetching && !full && !mutation.isPending;
  const openSelector = () => { mutation.reset(); setMessage(null); setSelecting(true); };

  const changePin = async (event: PublicEvent, isPinned: boolean) => {
    if (inFlight.current || (isPinned && !canPin)) return;
    inFlight.current = true;
    setMessage(null);
    try {
      await mutation.mutateAsync({ eventId: event.event_id, isPinned });
      setMessage(`${isPinned ? 'Đã ghim' : 'Đã bỏ ghim'} sự kiện “${event.name}”.`);
      if (isPinned) setSelecting(false);
    } catch {
      // Mutation error is rendered in the page or the still-open selector.
    } finally { inFlight.current = false; }
  };

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Sự kiện ghim trang chủ</h1><p className="mt-2 text-sm text-slate-500">Quản lý các banner xuất hiện trên trang chủ.</p></div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={query.isFetching || mutation.isPending} onClick={() => void query.refetch()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50"><RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} aria-hidden="true" />Làm mới</button>
        <button type="button" disabled={!canPin} onClick={openSelector} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"><Plus size={16} aria-hidden="true" />Ghim sự kiện</button>
      </div>
    </div>
    {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
    {mutation.error && !selecting && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{mutation.error.message}</p>}
    <div className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50 p-4"><Pin size={20} className="shrink-0 text-violet-600" aria-hidden="true" /><div><p className="text-sm font-bold text-violet-900">Đang hiển thị: {query.data ? events.length : '—'}/4</p><p className="mt-1 text-xs text-violet-700">{full ? 'Đã đủ 4 sự kiện. Hãy bỏ ghim một sự kiện trước khi thêm.' : 'Sự kiện ghim gần nhất sẽ xuất hiện đầu tiên.'}</p></div></div>
    {query.isError ? <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-8 text-center"><p className="text-sm text-rose-700">{query.error.message}</p><button type="button" disabled={query.isFetching || mutation.isPending} onClick={() => void query.refetch()} className="mt-3 text-sm font-semibold text-violet-700 underline">Thử lại</button></div>
      : query.isPending ? <div role="status" className="rounded-2xl bg-white p-12 text-center text-sm text-slate-500">Đang tải sự kiện ghim…</div>
      : <>
        {!events.length && <p className="text-sm text-slate-500">Chưa có sự kiện nào được ghim. Chọn sự kiện đầu tiên để hiển thị banner trên trang chủ.</p>}
        <div className="grid gap-5 md:grid-cols-2">
          {events.map((event, index) => <PinnedEventCard key={event.event_id} event={event} index={index} busy={mutation.isPending} removing={mutation.isPending && mutation.variables?.eventId === event.event_id} onUnpin={() => void changePin(event, false)} />)}
          {Array.from({ length: Math.max(0, 4 - events.length) }, (_, index) => <button key={`empty-${index}`} type="button" disabled={!canPin} onClick={openSelector} className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-8 text-slate-500 hover:border-violet-400 hover:text-violet-700 disabled:opacity-50"><Plus size={24} aria-hidden="true" /><span className="text-sm font-semibold">{index === 0 ? 'Ghim sự kiện' : 'Vị trí còn trống'}</span><span className="text-xs">Vị trí {events.length + index + 1}</span></button>)}
        </div>
      </>}
    {selecting && <PinEventDialog pinnedIds={events.map(event => event.event_id)} busy={mutation.isPending} pendingId={mutation.variables?.eventId} error={mutation.error?.message ?? null} canPin={canPin || mutation.isPending} onClose={() => { if (!mutation.isPending) setSelecting(false); }} onPin={event => void changePin(event, true)} />}
  </div>;
}
