'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, ChevronDown, MapPin, Ticket } from 'lucide-react';
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
  if (event.isPending) return <div role="status" className="py-8"><span className="sr-only">Đang tải sự kiện…</span><div className="grid gap-6 lg:grid-cols-2"><div className="min-h-72 rounded-2xl bg-white/10" /><div className="space-y-5 py-6"><div className="h-8 w-3/4 rounded bg-white/10" /><div className="h-5 w-1/2 rounded bg-white/10" /><div className="h-12 rounded bg-white/10" /></div></div></div>;
  if (event.isError || !event.data) return <div className="tv-panel my-8" role="alert"><h1 className="text-xl font-semibold">Chưa thể xem sự kiện này</h1><p className="my-3 tv-muted">Sự kiện có thể chưa được công bố hoặc kết nối đang gián đoạn.</p><button type="button" className="tv-button" onClick={() => void event.refetch()}>Thử lại</button></div>;
  const firstShowing = showings.data?.[0];
  return <div className="tv-event-detail pb-8 pt-5">
    <header className="tv-event-hero">
      <div className="tv-event-info"><p className="mb-4 flex items-center gap-2 text-xs font-semibold text-[#c7a4fa]"><Ticket size={16} aria-hidden="true" />TICKETVERSE · SỰ KIỆN</p><h1 className="text-balance text-2xl font-bold leading-tight sm:text-3xl">{event.data.title}</h1>
        {firstShowing && <div className="mt-6 space-y-4 text-sm leading-6"><p className="flex items-start gap-3"><CalendarDays size={18} className="mt-1 shrink-0 text-[#c7a4fa]" aria-hidden="true" /><span>{dateFormat.format(new Date(firstShowing.startTime))}{showings.data!.length > 1 && <span className="block tv-muted">Và {showings.data!.length - 1} suất diễn khác</span>}</span></p><p className="flex items-start gap-3"><MapPin size={18} className="mt-1 shrink-0 text-[#c7a4fa]" aria-hidden="true" /><span><strong>{firstShowing.venueName}</strong><span className="block tv-muted">{[firstShowing.address, firstShowing.city].filter(Boolean).join(', ')}</span></span></p></div>}
        <div className="tv-event-cta"><p className="mb-3 text-sm tv-muted">Chọn suất diễn để xem hạng vé và giá bán.</p><a href="#tickets" className="tv-button tv-primary w-full">Chọn vé ngay <ArrowRight size={18} aria-hidden="true" /></a></div>
      </div>
      <div className="tv-event-art"><EventPoster key={event.data.posterUrl} url={event.data.posterUrl} title={event.data.title} /></div>
    </header>
    <nav className="tv-event-section-nav" aria-label="Nội dung sự kiện"><a href="#introduction">Giới thiệu</a><a href="#tickets">Thông tin vé</a></nav>
    <div className="tv-event-content">
      <div className="min-w-0 space-y-6">
        <section id="introduction" className="tv-panel tv-event-section"><h2 className="mb-5 text-balance text-xl font-bold">Giới thiệu sự kiện</h2><p className="whitespace-pre-wrap break-words text-pretty text-sm leading-7 tv-muted">{event.data.description || 'Ban tổ chức chưa cập nhật mô tả sự kiện.'}</p></section>
        <section id="tickets" className="tv-event-section"><div className="mb-5"><h2 className="text-balance text-xl font-bold">Thông tin vé</h2><p className="mt-2 text-sm tv-muted">Chọn suất diễn, sau đó chọn hạng vé. Giờ Việt Nam (UTC+07:00).</p></div>
          {showings.isPending ? <p role="status" className="tv-notice">Đang tải lịch diễn…</p> : showings.isError ? <div role="alert" className="tv-panel"><p>Chưa tải được lịch diễn.</p><button type="button" className="tv-button mt-3" onClick={() => void showings.refetch()}>Thử lại</button></div> : !showings.data?.length ? <p className="tv-notice">Chưa có suất diễn được công bố.</p> : <div className="space-y-4">{showings.data.map((showing, index) => <details key={showing.showingId} name="event-showing" open={index === 0} className="tv-showing">
            <summary><span className="tv-showing-icon"><CalendarDays size={22} aria-hidden="true" /></span><span className="min-w-0 flex-1"><strong className="block text-pretty">{showing.name}</strong><span className="mt-1 block text-sm tv-muted">{dateFormat.format(new Date(showing.startTime))}</span></span><ChevronDown size={20} className="tv-disclosure-chevron shrink-0" aria-hidden="true" /></summary>
            <div className="tv-showing-body"><p className="mb-4 flex items-start gap-2 text-sm leading-6 tv-muted"><MapPin size={18} className="mt-1 shrink-0" aria-hidden="true" />{[showing.venueName, showing.address, showing.city].filter(Boolean).join(', ')}</p><TicketTypes showingId={showing.showingId} startTime={showing.startTime} /></div>
          </details>)}</div>}
        </section>
      </div>
      <aside className="tv-panel tv-event-help"><Ticket size={26} className="mb-4 text-[#c7a4fa]" aria-hidden="true" /><h2 className="text-balance text-lg font-semibold">Điểm hẹn của bạn, vé của bạn.</h2><ol className="my-5 space-y-4 text-sm leading-6 tv-muted"><li>1. Chọn suất diễn và hạng vé phù hợp.</li><li>2. Chọn số lượng vé và nhập mã ưu đãi nếu có.</li><li>3. Kiểm tra đơn và tiếp tục thanh toán.</li></ol><a href="#tickets" className="tv-button w-full">Xem hạng vé <ArrowRight size={17} aria-hidden="true" /></a><p className="mt-4 text-xs leading-6 tv-muted">Vé sau thanh toán được lưu tại mục “Vé của tôi”.</p></aside>
    </div>
  </div>;
}
