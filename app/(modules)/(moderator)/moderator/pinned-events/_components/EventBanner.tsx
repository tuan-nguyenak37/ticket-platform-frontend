'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { getEventImageUrl } from '@/lib/events/events.api';
import type { PublicEvent } from '@/lib/events/events.types';

export function EventBanner({ event, compact = false }: { event: PublicEvent; compact?: boolean }) {
  const src = getEventImageUrl(event.bannerUrl);
  const [failed, setFailed] = useState<string | null>(null);
  return <div className={`${compact ? 'h-14 w-24 shrink-0 rounded-lg' : 'aspect-video w-full rounded-t-2xl'} flex items-center justify-center overflow-hidden bg-slate-100`}>
    {src && failed !== src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={`Banner ${event.name}`} className="size-full object-contain" loading="lazy" onError={() => setFailed(src)} />
    ) : <ImageOff className="size-6 text-slate-400" aria-label="Banner chưa được cập nhật" />}
  </div>;
}

export function eventSchedule(event: PublicEvent) {
  const date = new Date(event.startTime);
  const label = event.phase === 'ongoing' ? 'Đang diễn ra' : event.phase === 'ended' ? 'Đã kết thúc' : 'Sắp diễn ra';
  return `${label} · ${Number.isNaN(date.getTime()) ? 'Chưa có lịch' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(date)}`;
}
