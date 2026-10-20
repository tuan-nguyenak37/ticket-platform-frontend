'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarDays, MapPin } from 'lucide-react';
import { EventPoster } from '@/app/_components/EventDiscovery';
import { getPublicEvent, listPublicShowings, listPublicTicketTypes } from '@/app/_lib/public-events';
import { BuyTicket } from '@/components/commerce/BuyTicket';

const dateFormat = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'full', timeStyle: 'short' });

function TicketTypes({ showingId, startTime }: { showingId: string; startTime: string }) {
  const tickets = useQuery({ queryKey: ['public', 'ticket-types', showingId], queryFn: () => listPublicTicketTypes(showingId), retry: 1 });
  if (tickets.isPending) return <p role="status" className="mt-4 text-sm tv-muted">Đang tải hạng vé…</p>;
  if (tickets.isError) return <div role="alert" className="mt-4"><p>Chưa tải được hạng vé.</p><button type="button" className="tv-button mt-2" onClick={() => void tickets.refetch()}>Thử lại</button></div>;
  return <div className="mt-5 grid gap-5">{tickets.data?.length ? tickets.data.map(ticket => <BuyTicket key={ticket.ticketTypeId} ticket={ticket} startTime={startTime} />) : <p className="text-sm tv-muted">Chưa có hạng vé được công bố.</p>}</div>;
}

export function EventDetail({ eventId }: { eventId: string }) {
  const event = useQuery({ queryKey: ['public', 'event', eventId], queryFn: () => getPublicEvent(eventId), retry: 1 });
  const showings = useQuery({ queryKey: ['public', 'showings', eventId], queryFn: () => listPublicShowings(eventId), enabled: event.isSuccess, retry: 1 });
  if (event.isPending) return <p role="status" className="py-16 tv-muted">Đang tải sự kiện…</p>;
  if (event.isError || !event.data) return <div className="tv-panel my-8" role="alert"><h1 className="text-xl font-semibold">Chưa thể xem sự kiện này</h1><p className="my-3 tv-muted">Sự kiện có thể chưa được công bố hoặc kết nối đang gián đoạn.</p><button type="button" className="tv-button" onClick={() => void event.refetch()}>Thử lại</button></div>;
  return <div className="py-8 sm:py-12"><div className="grid items-start gap-8 lg:grid-cols-2"><EventPoster key={event.data.posterUrl} url={event.data.posterUrl} title={event.data.title} /><div><p className="mb-4 text-sm font-semibold text-[#c7a4fa]">SỰ KIỆN · TICKETVERSE</p><h1 className="text-3xl font-bold leading-tight sm:text-4xl">{event.data.title}</h1><p className="mt-6 whitespace-pre-wrap break-words leading-7 tv-muted">{event.data.description || 'Ban tổ chức chưa cập nhật mô tả sự kiện.'}</p></div></div>
    <section className="mt-12"><h2 className="mb-6 text-2xl font-bold">Lịch diễn & hạng vé</h2><p className="mb-5 text-sm tv-muted">Thời gian hiển thị theo giờ Việt Nam (UTC+07:00).</p>{showings.isPending ? <p role="status">Đang tải lịch diễn…</p> : showings.isError ? <div role="alert" className="tv-panel"><p>Chưa tải được lịch diễn.</p><button type="button" className="tv-button mt-3" onClick={() => void showings.refetch()}>Thử lại</button></div> : !showings.data?.length ? <p className="tv-notice">Chưa có suất diễn được công bố.</p> : <div className="grid gap-5 md:grid-cols-2">{showings.data.map(showing => <article key={showing.showingId} className="tv-panel"><h3 className="text-lg font-semibold">{showing.name}</h3><p className="mt-3 flex items-start gap-2 text-sm leading-6 tv-muted"><CalendarDays size={18} className="mt-1 shrink-0" />{dateFormat.format(new Date(showing.startTime))}</p><p className="mt-2 flex items-start gap-2 text-sm leading-6 tv-muted"><MapPin size={18} className="mt-1 shrink-0" />{[showing.venueName, showing.address, showing.city].filter(Boolean).join(', ')}</p><TicketTypes showingId={showing.showingId} startTime={showing.startTime} /></article>)}</div>}</section>
  </div>;
}
