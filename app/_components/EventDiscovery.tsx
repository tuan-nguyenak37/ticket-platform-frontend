'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Compass, Music2, Ticket } from 'lucide-react';
import { ENV } from '@/config/env';
import { money, vietnamDate } from '@/lib/api/commerce';
import { listCategories, listPublicEvents, type PublicEvent } from '../_lib/public-events';

export function EventPoster({ url, title }: { url: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  let source: string | undefined;
  try {
    const resolved = new URL(url || '', new URL(ENV.API_URL).origin);
    if (url && ['http:', 'https:'].includes(resolved.protocol)) source = resolved.href;
  } catch {}
  return <div className="tv-event-poster relative aspect-video overflow-hidden rounded-xl bg-[#251b33]">
    {source && !failed ? <Image src={source} alt={title} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" onError={() => setFailed(true)} className="object-cover" /> : <div className="flex h-full flex-col items-center justify-center gap-3 text-[#d3bcef]"><Ticket size={38} strokeWidth={1} aria-hidden="true" /><span className="text-xs">TICKETVERSE</span></div>}
  </div>;
}

function EventCard({ event, category }: { event: PublicEvent; category?: string }) {
  return <Link href={`/events/${encodeURIComponent(event.eventId)}`} className="tv-event-card group min-w-0 rounded-xl focus-visible:outline-offset-8">
    <EventPoster key={event.posterUrl} url={event.posterUrl} title={event.title} />
    <div className="tv-event-card-body"><p className="mb-2 text-xs font-medium text-[#c7a4fa]">{category || 'Sự kiện'}</p>
    <h3 className="line-clamp-2 text-pretty text-base font-semibold leading-6 group-hover:text-[#d7baff]">{event.title}</h3>
    <p className="mt-4 font-semibold tabular-nums text-[#d2adff]">{event.minPrice != null ? (event.minPrice === '0' ? 'Miễn phí' : `Từ ${money(event.minPrice)}`) : 'Chưa công bố giá vé'}</p>
    <p className="mt-2 flex items-center justify-between gap-2 text-sm tv-muted"><span>{event.nextShowingAt ? vietnamDate(event.nextShowingAt) : 'Chưa có lịch diễn sắp tới'}</span><ArrowRight size={16} className="shrink-0" aria-hidden="true" /></p></div>
  </Link>;
}

export function CategoryNav({ selected = '', query = '' }: { selected?: string; query?: string }) {
  const categories = useQuery({ queryKey: ['public', 'categories'], queryFn: listCategories, staleTime: 300_000, retry: 1 });
  const href = (categoryId: string) => {
    const params = new URLSearchParams();
    if (categoryId) params.set('categoryId', categoryId);
    if (query) params.set('q', query);
    return `/events${params.size ? `?${params}` : ''}`;
  };
  return <nav aria-label="Danh mục sự kiện" className="tv-category-nav border-b border-white/10 py-3">
    <div className="flex gap-2 overflow-x-auto pb-1">
      <Link href={href('')} className={`tv-button shrink-0 ${!selected ? 'tv-primary' : 'border-transparent'}`} aria-current={!selected ? 'page' : undefined}><Compass size={17} />Tất cả</Link>
      {categories.data?.map(category => <Link key={category.categoryId} href={href(category.categoryId)} aria-current={selected === category.categoryId ? 'page' : undefined} className={`tv-button shrink-0 ${selected === category.categoryId ? 'tv-primary' : 'border-transparent'}`}>{category.name}</Link>)}
      {categories.isPending && <span role="status" className="p-3 text-sm tv-muted">Đang tải danh mục…</span>}
      {categories.isError && <button type="button" className="tv-button shrink-0" onClick={() => void categories.refetch()}>Tải lại danh mục</button>}
    </div>
  </nav>;
}

export function EventGrid({ query = '', categoryId = '', page = 1, home = false, title }: { query?: string; categoryId?: string; page?: number; home?: boolean; title?: string }) {
  const params = { q: query || undefined, categoryId: categoryId || undefined, page, limit: home ? (title ? 4 : 8) : 12 };
  const Heading = home ? 'h2' : 'h1';
  const events = useQuery({ queryKey: ['public', 'events', params], queryFn: () => listPublicEvents(params), staleTime: 60_000, retry: 1 });
  const categories = useQuery({ queryKey: ['public', 'categories'], queryFn: listCategories, staleTime: 300_000, retry: 1 });
  const pageHref = (next: number) => {
    const filters = new URLSearchParams({ page: String(next) });
    if (query) filters.set('q', query);
    if (categoryId) filters.set('categoryId', categoryId);
    return `/events?${filters}`;
  };
  if (title && events.isSuccess && !events.data.items.length) return null;
  return <section className="py-7 sm:py-8" aria-label={title || 'Danh sách sự kiện'}>
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div>{!title && <p className="mb-2 text-xs font-semibold text-[#c7a4fa]">TÌM ĐIỂM HẸN TIẾP THEO</p>}<Heading className="text-balance text-2xl font-bold">{title || (home ? 'Sự kiện mới dành cho bạn' : query ? `Kết quả cho “${query}”` : 'Khám phá sự kiện')}</Heading></div>{home ? <Link href={categoryId ? `/events?${new URLSearchParams({ categoryId })}` : '/events'} className="tv-button">Xem tất cả <ArrowRight size={17} aria-hidden="true" /></Link> : events.data && <p className="text-sm tabular-nums tv-muted">{events.data.total} sự kiện</p>}</div>
    {events.isPending ? <div role="status"><span className="sr-only">Đang tải sự kiện</span><div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: home ? 4 : 8 }, (_, index) => <div key={index} className="animate-pulse"><div className="aspect-[16/10] rounded-2xl bg-white/10" /><div className="mt-4 h-4 w-2/3 rounded bg-white/10" /><div className="mt-3 h-4 w-1/2 rounded bg-white/10" /></div>)}</div></div> : events.isError ? <div className="tv-panel flex flex-col items-start gap-4" role="alert"><p>Chưa thể tải sự kiện. Vui lòng thử lại sau.</p><button type="button" className="tv-button" onClick={() => void events.refetch()}>Thử lại</button></div> : !events.data?.items.length ? <div className="tv-panel flex flex-col items-center gap-3 py-14 text-center"><Music2 size={32} className="text-[#c7a4fa]" /><h3 className="text-lg font-semibold">{query || categoryId ? 'Chưa tìm thấy sự kiện phù hợp' : 'Những cuộc hẹn mới đang chờ phía trước'}</h3><p className="max-w-md text-sm leading-6 tv-muted">{query || categoryId ? 'Thử từ khóa khác hoặc xem tất cả danh mục.' : 'Sự kiện sẽ xuất hiện tại đây sau khi được công bố. Hãy quay lại để khám phá nhé.'}</p>{(query || categoryId) && <Link href="/events" className="tv-button mt-2">Xóa bộ lọc</Link>}</div> : <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">{events.data.items.map(event => <EventCard key={event.eventId} event={event} category={categories.data?.find(category => category.categoryId === event.categoryId)?.name} />)}</div>}
    {!home && events.data && (page > 1 || page * params.limit < events.data.total) && <nav aria-label="Phân trang" className="mt-10 flex items-center justify-center gap-4">{page > 1 && <Link href={pageHref(page - 1)} className="tv-button">Trang trước</Link>}<span className="text-sm tv-muted">Trang {page}</span>{page * params.limit < events.data.total && <Link href={pageHref(page + 1)} className="tv-button">Trang tiếp</Link>}</nav>}
  </section>;
}

export function HomeCollections() {
  const categories = useQuery({ queryKey: ['public', 'categories'], queryFn: listCategories, staleTime: 300_000, retry: 1 });
  return <>{categories.data?.slice(0, 2).map(category => <EventGrid key={category.categoryId} home categoryId={category.categoryId} title={category.name} />)}</>;
}
