'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ImageOff } from 'lucide-react';
import type { PublicEvent } from '../_lib/home.types';
import { getHomeImageUrl } from '../_lib/home.utils';

export function PinnedEventSlide({ event, active, first }: { event: PublicEvent; active: boolean; first: boolean }) {
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const image = [getHomeImageUrl(event.bannerUrl)]
    .find((url): url is string => Boolean(url && !failedUrls.includes(url)));

  return <Link href={`/events/${encodeURIComponent(event.event_id)}`} aria-label={`Xem sự kiện ${event.name}`}
    aria-hidden={!active} inert={!active} tabIndex={active ? 0 : -1}
    className={`absolute inset-0 bg-gradient-to-r from-violet-950 to-fuchsia-950 transition-opacity duration-700 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-violet-300 motion-reduce:transition-none ${active ? 'z-10 opacity-100' : 'pointer-events-none z-0 opacity-0'}`}>
    {image ? <Image src={image} alt={`Banner ${event.name}`} fill unoptimized
      sizes="(max-width: 1280px) 100vw, 1280px" preload={first} loading={first ? undefined : 'lazy'}
      className="object-contain" onError={() => setFailedUrls(current => [...current, image])} />
      : <span className="flex h-full flex-col items-center justify-center gap-3 px-12 text-center text-white/80"><ImageOff size={32} aria-hidden="true" /><span className="text-sm">Banner đang được cập nhật</span><span className="sr-only">{event.name}</span></span>}
  </Link>;
}
