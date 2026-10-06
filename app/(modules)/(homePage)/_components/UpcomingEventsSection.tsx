'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, CalendarX } from 'lucide-react';
import { useUpcomingEvents } from '../_hooks/useUpcomingEvents';
import { UpcomingEventCard } from './UpcomingEventCard';
import { UpcomingEventsSkeleton } from './UpcomingEventsSkeleton';
import type { PublicEvent } from '../_lib/home.types';

const SCROLL_AMOUNT = 320;

type FilterTab = 'weekend' | 'month';

function isEventThisWeekend(event: PublicEvent): boolean {
  const date = new Date(event.startTime);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday

  // Calculate Friday of current week
  const diffToFriday = (5 - currentDay + 7) % 7;
  const thisFriday = new Date(now);
  thisFriday.setDate(now.getDate() + diffToFriday);
  thisFriday.setHours(0, 0, 0, 0);

  // Sunday night of current week
  const thisSunday = new Date(thisFriday);
  thisSunday.setDate(thisFriday.getDate() + 2);
  thisSunday.setHours(23, 59, 59, 999);

  // If today is already Friday/Saturday/Sunday, start from beginning of today
  const startCheck =
    currentDay === 5 || currentDay === 6 || currentDay === 0
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      : thisFriday;

  // Also include events in the next 7 days for rich discovery
  const weekAhead = new Date(now);
  weekAhead.setDate(now.getDate() + 7);

  return (date >= startCheck && date <= thisSunday) || (date >= now && date <= weekAhead);
}

function isEventThisMonth(event: PublicEvent): boolean {
  const date = new Date(event.startTime);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const thirtyDaysAhead = new Date(now);
  thirtyDaysAhead.setDate(now.getDate() + 30);

  const isSameCalendarMonth =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth();

  return isSameCalendarMonth || (date >= now && date <= thirtyDaysAhead);
}

export function UpcomingEventsSection() {
  const { data, isPending, isError, error, refetch } = useUpcomingEvents();
  const [activeTab, setActiveTab] = useState<FilterTab>('weekend');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const allEvents = data?.items ?? [];

  // Filter events by selected tab, gracefully fallback to all upcoming events if strict filter has no matches
  const displayedEvents = useMemo(() => {
    if (allEvents.length === 0) return [];
    const filtered = allEvents.filter(
      activeTab === 'weekend' ? isEventThisWeekend : isEventThisMonth
    );
    return filtered.length > 0 ? filtered : allEvents;
  }, [allEvents, activeTab]);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState, displayedEvents]);

  const scroll = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
      behavior: 'smooth',
    });
  };

  return (
    <section className="mt-8 md:mt-12" aria-label="Sự kiện sắp diễn ra">
      {/* Header with Tabs and 'Xem thêm >' */}
      <div className="mb-5 flex items-center justify-between border-b border-white/10">
        {/* Left Tabs */}
        <div className="flex items-center gap-6 sm:gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('weekend')}
            className={`relative pb-3 text-base sm:text-lg font-bold transition-colors ${
              activeTab === 'weekend' ? 'text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Cuối tuần này
            {activeTab === 'weekend' && (
              <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('month')}
            className={`relative pb-3 text-base sm:text-lg font-bold transition-colors ${
              activeTab === 'month' ? 'text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Tháng này
            {activeTab === 'month' && (
              <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        {/* Right 'Xem thêm >' Link */}
        <Link
          href="/events"
          className="flex items-center gap-0.5 pb-3 text-xs sm:text-sm font-medium text-white/60 transition-colors hover:text-emerald-400"
        >
          <span>Xem thêm</span>
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </div>

      {/* Content */}
      {isPending ? (
        <UpcomingEventsSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center backdrop-blur-xl">
          <CalendarX size={32} className="text-white/40" aria-hidden="true" />
          <p className="text-sm text-white/60">
            Không thể tải sự kiện: {error?.message ?? 'Đã xảy ra lỗi'}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-xs font-semibold text-slate-950 transition-all duration-300 shadow-lg shadow-emerald-500/20"
          >
            Thử lại
          </button>
        </div>
      ) : displayedEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center backdrop-blur-xl">
          <CalendarX size={32} className="text-white/40" aria-hidden="true" />
          <p className="text-sm text-white/60">Chưa có sự kiện nào trong khoảng thời gian này</p>
        </div>
      ) : (
        <div className="group/carousel relative">
          {/* Overlaid Floating Left Arrow */}
          {canScrollLeft && (
            <button
              type="button"
              aria-label="Cuộn sang trái"
              onClick={() => scroll('left')}
              className="absolute -left-3 sm:-left-4 top-[35%] -translate-y-1/2 z-20 flex size-10 sm:size-11 items-center justify-center rounded-full bg-white text-slate-900 shadow-xl shadow-black/50 transition-all duration-200 hover:scale-110 hover:bg-white active:scale-95"
            >
              <ChevronLeft size={22} className="stroke-[2.5]" aria-hidden="true" />
            </button>
          )}

          {/* Overlaid Floating Right Arrow */}
          {canScrollRight && (
            <button
              type="button"
              aria-label="Cuộn sang phải"
              onClick={() => scroll('right')}
              className="absolute -right-3 sm:-right-4 top-[35%] -translate-y-1/2 z-20 flex size-10 sm:size-11 items-center justify-center rounded-full bg-white text-slate-900 shadow-xl shadow-black/50 transition-all duration-200 hover:scale-110 hover:bg-white active:scale-95"
            >
              <ChevronRight size={22} className="stroke-[2.5]" aria-hidden="true" />
            </button>
          )}

          {/* Scrollable row */}
          <div
            ref={scrollRef}
            className="flex gap-4 md:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 pt-1 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayedEvents.map((event) => (
              <UpcomingEventCard key={event.event_id} event={event} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
