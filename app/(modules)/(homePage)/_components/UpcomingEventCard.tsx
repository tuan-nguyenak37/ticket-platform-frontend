'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, ImageOff } from 'lucide-react';
import type { PublicEvent } from '../_lib/home.types';
import { getHomeImageUrl } from '../_lib/home.utils';

interface Props {
  event: PublicEvent;
}

function formatVietnameseDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Đang cập nhật';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date);
}

export function UpcomingEventCard({ event }: Props) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = getHomeImageUrl(event.bannerUrl);
  const showImage = imageUrl && !imgError;

  // Ticketbox-inspired format: price in emerald green or fallback to venue name
  const rawPrice = (event as unknown as { minPrice?: number; price?: number }).minPrice ?? (event as unknown as { minPrice?: number; price?: number }).price;
  const priceDisplay =
    rawPrice != null && !Number.isNaN(Number(rawPrice))
      ? `Từ ${new Intl.NumberFormat('vi-VN').format(Number(rawPrice))}đ`
      : event.venueName || 'Đang mở bán';

  return (
    <Link
      href={`/events/${encodeURIComponent(event.event_id)}`}
      aria-label={`Xem sự kiện ${event.name}`}
      className="group block flex-none w-[240px] sm:w-[260px] md:w-[275px] lg:w-[calc((100%-48px)/4)] snap-start transition-transform duration-300 hover:-translate-y-1"
    >
      {/* Banner — landscape 16:10 ratio with rounded corners */}
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-gradient-to-br from-violet-950/60 to-fuchsia-950/60 border border-white/10">
        {showImage ? (
          <Image
            src={imageUrl}
            alt={`Banner ${event.name}`}
            fill
            unoptimized
            sizes="(max-width: 640px) 240px, (max-width: 1024px) 275px, 320px"
            className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-2 text-white/30">
            <ImageOff size={28} aria-hidden="true" />
            <span className="text-xs">Đang cập nhật</span>
          </span>
        )}
      </div>

      {/* Info section matching reference layout */}
      <div className="mt-3 space-y-1 px-0.5">
        <h3 className="text-sm md:text-base font-bold leading-snug text-white line-clamp-2 min-h-[2.5rem] group-hover:text-emerald-300 transition-colors duration-200">
          {event.name}
        </h3>

        <p className="text-xs sm:text-sm font-semibold text-emerald-400 truncate">
          {priceDisplay}
        </p>

        <p className="flex items-center gap-1.5 text-xs text-white/60">
          <Calendar size={13} className="shrink-0 text-white/50" aria-hidden="true" />
          <span>{formatVietnameseDate(event.startTime)}</span>
        </p>
      </div>
    </Link>
  );
}
