'use client';

import type { EventItem } from '../_lib/events.types';
import { useManagedEventBanner } from '../_hooks/useManagedEventBanner';

export function ManagedEventBanner({ event, className }: { event: EventItem; className?: string }) {
  const src = useManagedEventBanner(event);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={event.name} className={className} />
  ) : <div role="img" aria-label={`Chưa có ảnh cho ${event.name}`} className={`${className ?? ''} flex items-center justify-center bg-violet-50 text-violet-600`}>{event.name.charAt(0)}</div>;
}
