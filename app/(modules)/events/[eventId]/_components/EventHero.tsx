'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  ArrowLeft,
  Flame,
  Tag,
  Share2,
  Heart,
  ShieldCheck,
  Ticket,
} from 'lucide-react';
import type { PublicEvent as EventItem } from '@/lib/events/events.types';
import { getEventImageUrl as getImageUrl } from '@/lib/events/events.api';
import { useEventCategories } from '@/lib/events/useEventCategories';

interface EventHeroProps {
  event: EventItem;
  ticketCount: number;
}

export function EventHero({ event, ticketCount }: EventHeroProps) {
  const { data: categories } = useEventCategories();
  const categoryName = categories?.find(category => category.category_id === event.categoryId)?.name;
  const posterSrc = getImageUrl(event.bannerUrl);

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Sắp công bố';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('Đã sao chép liên kết sự kiện vào bộ nhớ tạm!');
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Back link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-violet-400 transition-colors py-1"
        >
          <ArrowLeft className="size-3.5" />
          <span>Quay lại Sự kiện</span>
        </Link>
      </div>

      {/* 2. Main Hero Poster & Information Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl">
        {/* Ambient subtle glow background */}
        <div className="absolute -top-24 -right-24 size-80 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-80 rounded-full bg-fuchsia-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid gap-6 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] items-start">
          {/* CỘT TRÁI: POSTER KHUNG CHUẨN */}
          <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/20 bg-slate-900 shadow-2xl shadow-violet-950/50">
            {posterSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={posterSrc}
                alt={event.name}
                className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center bg-gradient-to-br from-violet-900/60 to-slate-950 p-4 text-center">
                <Ticket className="size-12 text-violet-400/80 mb-2" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                  {event.name}
                </span>
                <span className="text-[10px] text-white/40 mt-1">TicketVerse Official</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-semibold text-white/90">
              <span className="flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 backdrop-blur-md border border-white/10">
                <ShieldCheck className="size-3.5 text-emerald-400" /> Vé chính chủ
              </span>
            </div>
          </div>

          {/* CỘT PHẢI: THÔNG TIN SỰ KIỆN */}
          <div className="flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              {/* Badges & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 border border-violet-500/30 px-3 py-1 text-xs font-medium text-violet-300">
                    <Tag className="size-3" />
                    {categoryName || 'Sự kiện'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-xs font-medium text-emerald-300">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Đang mở pass vé
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    title="Chia sẻ sự kiện"
                    className="flex size-9 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-white/80 hover:bg-white/20 hover:text-white transition-all cursor-pointer"
                  >
                    <Share2 className="size-4" />
                  </button>
                  <button
                    type="button"
                    title="Yêu thích sự kiện"
                    className="flex size-9 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-white/80 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
                  >
                    <Heart className="size-4" />
                  </button>
                </div>
              </div>

              {/* Tên sự kiện */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                {event.name}
              </h1>

              {/* Thời gian & Địa điểm */}
              <div className="space-y-2 pt-1 text-sm text-white/80">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    <Calendar className="size-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{formatDate(event.startTime)}</p>
                    <p className="text-xs text-white/50">Đến {formatDate(event.endTime)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                    <MapPin className="size-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{event.venueName}</p>
                    <p className="text-xs text-white/50">{event.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wireframe-matched simple indicator */}
        <div className="pt-6 border-t border-white/10 text-center">
          <p className="text-sm font-semibold tracking-wide text-white/80">
            <span className="text-violet-400 font-bold">{ticketCount}</span> vé đang được pass
          </p>
        </div>
      </div>
    </div>
  );
}
