import Link from 'next/link';
import { PinOff } from 'lucide-react';
import type { PublicEvent } from '@/lib/events/events.types';
import { EventBanner, eventSchedule } from './EventBanner';

export function PinnedEventCard({ event, index, busy, removing, onUnpin }: { event: PublicEvent; index: number; busy: boolean; removing: boolean; onUnpin: () => void }) {
  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <EventBanner event={event} />
    <div className="space-y-3 p-5">
      <span className="text-xs font-semibold text-violet-600">Vị trí {index + 1}</span>
      <h2 className="text-base font-bold text-slate-900">{event.name}</h2>
      <p className="text-xs text-slate-500">{eventSchedule(event)}</p>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <Link href={`/moderator/events/${encodeURIComponent(event.event_id)}`} className="text-sm font-semibold text-violet-700 hover:underline">Xem chi tiết</Link>
        <button type="button" disabled={busy} onClick={onUnpin} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><PinOff size={15} aria-hidden="true" />{removing ? 'Đang bỏ ghim…' : 'Bỏ ghim'}</button>
      </div>
    </div>
  </article>;
}
