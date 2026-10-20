'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Compass, Music2, Ticket } from 'lucide-react';
import { ENV } from '@/config/env';
import { listCategories, listPublicEvents, type PublicEvent } from '../_lib/public-events';

export function EventPoster({ url, title }: { url: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  let source: string | undefined;
  try {
    const resolved = new URL(url || '', new URL(ENV.API_URL).origin);
    if (url && ['http:', 'https:'].includes(resolved.protocol)) source = resolved.href;
  } catch {}
  return <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#251b33]">
    {source && !failed ? <Image src={source} alt={title} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" onError={() => setFailed(true)} className="object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full flex-col items-center justify-center gap-3 text-[#d3bcef]"><Ticket size={38} strokeWidth={1} /><span className="text-xs tracking-widest">TICKETVERSE</span></div>}
  </div>;
}

function EventCard({ event, category }: { event: PublicEvent; category?: string }) {
  return <Link href={`/events/${encodeURIComponent(event.eventId)}`} className="group min-w-0 rounded-2xl focus-visible:outline-offset-8">
    <EventPoster key={event.posterUrl} url={event.posterUrl} title={event.title} />
    <p className="mt-4 text-xs font-medium text-[#c7a4fa]">{category || 'Sự kiện'}</p>
    <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-6 group-hover:text-[#d7baff]">{event.title}</h3>
    <p className="mt-3 flex items-center gap-2 text-sm tv-muted">Xem lịch diễn và thông tin vé <ArrowRight size={15} /></p>
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
  return <nav aria-label="Danh mục sự kiện" className="border-b border-white/10 py-3">
    <div className="flex gap-2 overflow-x-auto pb-1">
      <Link href={href('')} className={`tv-button shrink-0 ${!selected ? 'tv-primary' : 'border-transparent'}`} aria-current={!selected ? 'page' : undefined}><Compass size={17} />Tất cả</Link>
      {categories.data?.map(category => <Link key={category.categoryId} href={href(category.categoryId)} aria-current={selected === category.categoryId ? 'page' : undefined} className={`tv-button shrink-0 ${selected === category.categoryId ? 'tv-primary' : 'border-transparent'}`}>{category.name}</Link>)}
      {categories.isPending && <span role="status" className="p-3 text-sm tv-muted">Đang tải danh mục…</span>}
      {categories.isError && <button type="button" className="tv-button shrink-0" onClick={() => void categories.refetch()}>Tải lại danh mục</button>}
    </div>
  </nav>;
}

export function EventGrid({ query = '', categoryId = '', page = 1, home = false }: { query?: string; categoryId?: string; page?: number; home?: boolean }) {
  const params = { q: query || undefined, categoryId: categoryId || undefined, page, limit: home ? 8 : 12 };
  const events = useQuery({ queryKey: ['public', 'events', params], queryFn: () => listPublicEvents(params), staleTime: 60_000, retry: 1 });
  const categories = useQuery({ queryKey: ['public', 'categories'], queryFn: listCategories, staleTime: 300_000, retry: 1 });
  const pageHref = (next: number) => {
    const filters = new URLSearchParams({ page: String(next) });
    if (query) filters.set('q', query);
    if (categoryId) filters.set('categoryId', categoryId);
    return `/events?${filters}`;
  };
  return <section className="py-9 sm:py-12" aria-label="Danh sách sự kiện">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-semibold tracking-[.18em] text-[#c7a4fa]">TÌM ĐIỂM HẸN TIẾP THEO</p><h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{home ? 'Sự kiện mới' : query ? `Kết quả cho “${query}”` : 'Khám phá sự kiện'}</h2></div>{home ? <Link href="/events" className="tv-button">Xem tất cả <ArrowRight size={17} /></Link> : events.data && <p className="text-sm tv-muted">{events.data.total} sự kiện</p>}</div>
    {events.isPending ? <div role="status"><span className="sr-only">Đang tải sự kiện</span><div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: home ? 4 : 8 }, (_, index) => <div key={index} className="animate-pulse"><div className="aspect-[16/10] rounded-2xl bg-white/10" /><div className="mt-4 h-4 w-2/3 rounded bg-white/10" /><div className="mt-3 h-4 w-1/2 rounded bg-white/10" /></div>)}</div></div> : events.isError ? <div className="tv-panel flex flex-col items-start gap-4" role="alert"><p>Chưa thể tải sự kiện. Vui lòng thử lại sau.</p><button type="button" className="tv-button" onClick={() => void events.refetch()}>Thử lại</button></div> : !events.data?.items.length ? <div className="tv-panel flex flex-col items-center gap-3 py-14 text-center"><Music2 size={32} className="text-[#c7a4fa]" /><h3 className="text-lg font-semibold">{query || categoryId ? 'Chưa tìm thấy sự kiện phù hợp' : 'Những cuộc hẹn mới đang chờ phía trước'}</h3><p className="max-w-md text-sm leading-6 tv-muted">{query || categoryId ? 'Thử từ khóa khác hoặc xem tất cả danh mục.' : 'Sự kiện sẽ xuất hiện tại đây sau khi được công bố. Hãy quay lại để khám phá nhé.'}</p>{(query || categoryId) && <Link href="/events" className="tv-button mt-2">Xóa bộ lọc</Link>}</div> : <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">{events.data.items.map(event => <EventCard key={event.eventId} event={event} category={categories.data?.find(category => category.categoryId === event.categoryId)?.name} />)}</div>}
    {!home && events.data && (page > 1 || page * params.limit < events.data.total) && <nav aria-label="Phân trang" className="mt-10 flex items-center justify-center gap-4">{page > 1 && <Link href={pageHref(page - 1)} className="tv-button">Trang trước</Link>}<span className="text-sm tv-muted">Trang {page}</span>{page * params.limit < events.data.total && <Link href={pageHref(page + 1)} className="tv-button">Trang tiếp</Link>}</nav>}
  </section>;
}
