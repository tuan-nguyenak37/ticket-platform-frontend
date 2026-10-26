'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, MapPin, ShoppingBag, Ticket } from 'lucide-react';
import { useAuthStore } from '@/lib/auth/auth.store';
import { listCommerce, money, vietnamDate, type Order, type TicketMetadata, type ResaleOrder, type Listing } from '@/lib/api/commerce';
import { Failure, Pagination } from '@/components/ui/commerce';
import { Empty, Status } from './shared';

export function OrdersList({ resale = false }: { resale?: boolean }) {
  const [page, setPage] = useState(1);
  const userId = useAuthStore(state => state.user?.user_id);
  const query = useQuery({ queryKey: ['commerce', userId, resale ? 'resale-orders' : 'orders', page], queryFn: () => listCommerce<Order | ResaleOrder>(resale ? 'resale/orders/mine' : 'orders/mine', page), retry: 1,
    refetchInterval: current => current.state.data?.items.some(order => order.status === 'PENDING_PAYMENT') ? 5000 : false,
  });
  if (query.isPending) return <p role="status" className="tv-panel tv-muted">Đang tải đơn hàng…</p>;
  if (query.isError) return <Failure error={query.error} retry={() => void query.refetch()} />;
  return <section className="space-y-5" aria-label={resale ? 'Đơn mua vé bán lại' : 'Đơn mua vé'}>
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{resale ? 'Đơn tôi mua lại' : 'Lịch sử đặt vé'}</h2><p className="text-sm tabular-nums tv-muted">{query.data.total} đơn hàng</p></div>
    {!query.data.items.length && <Empty text="Chưa có đơn hàng trong trang này." href={resale ? '/pass' : '/events'} action={resale ? 'Khám phá chợ vé' : 'Khám phá sự kiện'} />}
    {query.data.items.map(order => {
      const original = 'orderId' in order;
      const id = original ? order.orderId : order.resaleOrderId;
      return <article key={id} className="tv-panel min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4"><p className="flex items-center gap-2 text-xs font-semibold text-[#d2adff]"><ShoppingBag size={17} aria-hidden="true" />{original ? 'ĐẶT VÉ SỰ KIỆN' : 'MUA VÉ BÁN LẠI'}</p><Status value={order.status} /></div>
<div className="flex flex-wrap items-end justify-between gap-5"><div className="min-w-0 flex-1"><h3 className="break-words text-lg font-semibold">{original ? `${order.ticketTypeName} × ${order.quantity}` : order.event?.title ?? 'Đơn mua vé bán lại'}</h3>{!original && <div className="mt-2 space-y-2 text-sm tv-muted"><p>{order.ticketType?.name} · 1 vé</p>{order.showing && <><p>{order.showing.name} · {vietnamDate(order.showing.startTime)}</p><p>{[order.showing.venueName, order.showing.city].filter(Boolean).join(', ')}</p></>}</div>}<p className="mt-2 text-sm tabular-nums tv-muted">Ngày đặt: {vietnamDate(order.createdAt)}</p><p className="mt-2 break-all text-xs tv-muted">Mã đơn: {id}</p></div><div><p className="text-xs tv-muted">Tổng thanh toán</p><p className="mt-1 text-2xl font-bold tabular-nums text-[#d2adff]">{money(original ? order.totalAmount : order.price)}</p></div></div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-dashed border-white/20 pt-4">{!original && order.status === 'PAID' && order.ticketId && <Link className="tv-button tv-primary" href={`/account/tickets/${encodeURIComponent(order.ticketId)}`}>Mở vé / mã QR mới</Link>}<Link className={`tv-button ${order.status === 'PENDING_PAYMENT' ? 'tv-primary' : ''}`} href={`/checkout/${original ? 'orders' : 'pass'}/${encodeURIComponent(id)}`}>{order.status === 'PENDING_PAYMENT' ? 'Tiếp tục thanh toán' : 'Xem đơn hàng'}<ArrowRight size={17} aria-hidden="true" /></Link></div>
      </article>;
    })}
    {(query.data.total > 20 || page > 1) && <Pagination page={page} total={query.data.total} busy={query.isFetching} onChange={setPage} />}
  </section>;
}

export function TicketsList() {
  const [page, setPage] = useState(1);
  const userId = useAuthStore(state => state.user?.user_id);
  const query = useQuery({ queryKey: ['commerce', userId, 'tickets', page], queryFn: () => listCommerce<TicketMetadata>('tickets/mine', page), retry: 1 });
  if (query.isPending) return <p role="status" className="tv-panel tv-muted">Đang tải vé…</p>;
  if (query.isError) return <Failure error={query.error} retry={() => void query.refetch()} />;
  return <section className="space-y-5" aria-label="Vé đang sở hữu">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Bộ sưu tập vé của bạn</h2><p className="text-sm tabular-nums tv-muted">{query.data.total} vé</p></div>
    <p className="text-sm leading-6 tv-muted">Vé hiện thuộc tài khoản của bạn, bao gồm vé mua gốc và vé nhận chuyển nhượng. Mở chi tiết để xem QR hoặc đăng bán lại.</p>
    {!query.data.items.length && <Empty text="Chưa có vé trong trang này." />}
    <div className="grid gap-5 xl:grid-cols-2">{query.data.items.map(ticket => <article key={ticket.ticketId} className="tv-panel flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="flex items-center gap-2 text-xs font-semibold text-[#d2adff]"><Ticket size={18} aria-hidden="true" />VÉ ĐIỆN TỬ</span><Status value={ticket.status} /></div>
      <h3 className="break-words text-pretty text-xl font-semibold">{ticket.event.title}</h3>
      <p className="border-y border-dashed border-white/20 py-4 text-sm"><strong className="break-words text-[#d2adff]">{ticket.ticketType.name}</strong><span className="mt-1 block text-xs tabular-nums tv-muted">Vé số {ticket.ticketNumber} · {ticket.showing.name}</span></p>
      <p className="flex items-start gap-2 text-sm tv-muted"><CalendarDays size={17} className="mt-0.5 shrink-0" aria-hidden="true" /><span className="tabular-nums">{vietnamDate(ticket.showing.startTime)}</span></p>
      <p className="flex items-start gap-2 text-sm tv-muted"><MapPin size={17} className="mt-0.5 shrink-0" aria-hidden="true" /><span className="break-words">{[ticket.showing.venueName, ticket.showing.city].filter(Boolean).join(', ')}</span></p>
      <Link href={`/account/tickets/${encodeURIComponent(ticket.ticketId)}`} className="tv-button tv-primary mt-auto w-full">Chi tiết vé / QR<ArrowRight size={17} aria-hidden="true" /></Link>
    </article>)}</div>
    {(query.data.total > 20 || page > 1) && <Pagination page={page} total={query.data.total} busy={query.isFetching} onChange={setPage} />}
  </section>;
}

export function ResaleAccount({ initialTab = 'sell' }: { initialTab?: 'sell' | 'buy' } = {}) {
  const [tab, setTab] = useState<'sell' | 'buy'>(initialTab);
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5"><div className="flex flex-wrap gap-2"><button className={`tv-button ${tab === 'sell' ? 'tv-primary' : ''}`} aria-pressed={tab === 'sell'} onClick={() => setTab('sell')}>Vé tôi đăng bán</button><button className={`tv-button ${tab === 'buy' ? 'tv-primary' : ''}`} aria-pressed={tab === 'buy'} onClick={() => setTab('buy')}>Đơn tôi mua lại</button></div><Link className="tv-button" href="/account/tickets">Chọn vé để đăng bán<ArrowRight size={17} aria-hidden="true" /></Link></div>{tab === 'sell' ? <MyListings /> : <OrdersList resale />}</div>;
}

function MyListings() {
  const [page, setPage] = useState(1);
  const userId = useAuthStore(state => state.user?.user_id);
  const query = useQuery({ queryKey: ['commerce', userId, 'my-listings', page], queryFn: () => listCommerce<Listing>('resale/listings/mine', page), retry: 1,
    refetchInterval: query => query.state.data?.items.some(listing => ['AVAILABLE', 'RESERVED'].includes(listing.status) || listing.settlement?.payout?.status === 'PENDING') ? 5000 : false,
  });
  if (query.isPending) return <p role="status" className="tv-panel tv-muted">Đang tải tin đăng…</p>;
  if (query.isError) return <Failure error={query.error} retry={() => void query.refetch()} />;
  return <section className="space-y-5" aria-label="Lịch sử đăng bán">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Lịch sử đăng bán</h2><p className="text-sm tabular-nums tv-muted">{query.data.total} tin đăng</p></div>
    <p className="text-sm leading-6 tv-muted">“Đã chuyển nhượng” là trạng thái chuyển vé, không phải xác nhận nhận tiền. Kiểm tra thông tin giao dịch trước khi xác nhận khoản tiền đã nhận.</p>
    {!query.data.items.length && <Empty text="Bạn chưa có tin đăng trong trang này." href="/account/tickets" action="Chọn vé của tôi" />}
    {query.data.items.map(listing => <article key={listing.listingId} className="tv-panel min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs font-semibold text-[#d2adff]"><Ticket size={18} aria-hidden="true" />1 VÉ · {listing.ticketType.name}</span><Status value={listing.status} /></div>
      <h3 className="break-words text-lg font-semibold">{listing.event.title}</h3><p className="flex items-start gap-2 text-sm tv-muted"><CalendarDays size={17} className="mt-0.5 shrink-0" aria-hidden="true" /><span>{vietnamDate(listing.showing.startTime)} · {listing.showing.name}</span></p><p className="break-words text-sm tv-muted">{[listing.showing.venueName, listing.showing.city].filter(Boolean).join(', ')}</p>
      {listing.settlement ? <div className="space-y-2 rounded-xl bg-white/5 p-4 text-sm"><p>Phí nền tảng (5%): <strong className="tabular-nums">{money(listing.settlement.feeAmount)}</strong></p><p>Thực nhận: <strong className="tabular-nums text-[#d2adff]">{money(listing.settlement.netAmount)}</strong></p><p className="tv-muted">{listing.settlement.bankName} · {listing.settlement.maskedAccountNumber} · {listing.settlement.accountHolder}</p><p role="status">Chi trả: {listing.settlement.payout ? listing.settlement.payout.status === 'SUCCEEDED' ? 'Đã xử lý chi trả' : listing.settlement.payout.status === 'FAILED' ? 'Chi trả cần kiểm tra' : 'Chờ chi trả' : 'Chưa phát sinh'}</p>{listing.settlement.payout?.processedAt && <p className="tv-muted">Xử lý lúc: {vietnamDate(listing.settlement.payout.processedAt)}</p>}</div> : <p className="tv-notice">{listing.status === 'AVAILABLE' ? 'Tin đăng chưa có tài khoản nhận tiền. Hãy hủy và đăng lại để tiếp tục mở bán.' : 'Tin đăng cũ không áp dụng chi trả tự động.'}</p>}
      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-dashed border-white/20 pt-4"><div><p className="text-xs tv-muted">Giá đăng bán</p><p className="mt-1 text-2xl font-bold tabular-nums text-[#d2adff]">{money(listing.price)}</p><p className="mt-2 text-xs tv-muted">Ngày đăng: {vietnamDate(listing.createdAt)}</p></div><Link className="tv-button" href={`/pass/${encodeURIComponent(listing.listingId)}`}>Quản lý tin đăng<ArrowRight size={17} aria-hidden="true" /></Link></div>
    </article>)}
    {(query.data.total > 20 || page > 1) && <Pagination page={page} total={query.data.total} busy={query.isFetching} onChange={setPage} />}
  </section>;
}
