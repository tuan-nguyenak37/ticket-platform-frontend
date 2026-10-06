'use client';

import { usePinnedEvents } from '@/lib/events/usePinnedEvents';
import { useBannerCarousel } from '../_hooks/useBannerCarousel';
import { HomeBannerSkeleton } from './HomeBannerSkeleton';
import { HomeBannerFallback } from './HomeBannerFallback';
import { PinnedEventSlide } from './PinnedEventSlide';
import { CarouselControls } from './CarouselControls';

export function PinnedEventCarousel() {
  const query = usePinnedEvents();
  const events = query.data ?? [];
  const carousel = useBannerCarousel(events.map(event => event.event_id));
  if (query.isPending) return <HomeBannerSkeleton />;
  if (!events.length) return <HomeBannerFallback error={query.isError ? query.error.message : undefined} onRetry={() => void query.refetch()} />;
  return <section aria-roledescription="carousel" aria-label="Sự kiện nổi bật" tabIndex={0}
    onFocusCapture={e => { if (e.target instanceof HTMLElement && e.target.matches(':focus-visible')) carousel.setFocused(true); }} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) carousel.setFocused(false); }}
    onKeyDown={e => {
      if (e.target !== e.currentTarget) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); carousel.select(carousel.index + (e.key === 'ArrowRight' ? 1 : -1)); }
    }} className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-white/20 shadow-2xl shadow-violet-500/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400 sm:aspect-[21/9]">
    {events.map((event, i) => <PinnedEventSlide key={event.event_id} event={event} active={i === carousel.index} first={i === 0} />)}
    {events.length > 1 && <CarouselControls names={events.map(event => event.name)} index={carousel.index} paused={carousel.paused} reducedMotion={carousel.reducedMotion} onSelect={carousel.select} onToggle={() => carousel.setPaused(!carousel.paused)} />}
    <p aria-live={carousel.paused ? "polite" : "off"} className="sr-only">Sự kiện {carousel.index + 1} trên {events.length}: {events[carousel.index]?.name}</p>
  </section>;
}
