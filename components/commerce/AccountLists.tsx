'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/auth.store';
import { listCommerce, money, vietnamDate, type Order, type TicketMetadata, type ResaleOrder, type Listing } from '@/lib/api/commerce';
import { Failure, Pagination } from '@/components/ui/commerce';
import { Empty, Status } from './shared';

export function OrdersList({ resale = false }: { resale?: boolean }) {
  const [page, setPage] = useState(1);
  const userId = useAuthStore(state => state.user?.user_id);
  const query = useQuery({ queryKey: ['commerce', userId, resale ? 'resale-orders' : 'orders', page], queryFn: () => listCommerce<Order | ResaleOrder>(resale ? 'resale/orders/mine' : 'orders/mine', page), retry: 1 });
  if (query.isPending) return <p role="status">Đang tải đơn hàng…</p>;
  if (query.isError) return <Failure error={query.error} retry={() => void query.refetch()} />;
  return <div className="space-y-4">{!query.data.items.length && <Empty text="Chưa có đơn hàng trong trang này." href={resale ? '/pass' : '/events'} />}{query.data.items.map(order => {
    const original = 'orderId' in order;
    const id = original ? order.orderId : order.resaleOrderId;
    return <article key={id} className="tv-panel flex flex-wrap items-center justify-between gap-5"><div className="min-w-0 space-y-2"><Status value={order.status} /><h2 className="text-lg font-semibold">{original ? `${order.ticketTypeName} × ${order.quantity}` : 'Đơn mua vé bán lại'}</h2><p className="break-all text-xs tv-muted">{id}</p><p className="text-sm tv-muted">{vietnamDate(order.createdAt)}</p></div><div className="space-y-3"><p className="text-xl font-semibold">{money(original ? order.totalAmount : order.price)}</p><Link className="tv-button" href={`/checkout/${original ? 'orders' : 'pass'}/${encodeURIComponent(id)}`}>Xem đơn hàng</Link></div></article>;
  })}<Pagination page={page} total={query.data.total} busy={query.isFetching} onChange={setPage} /></div>;
}
export function TicketsList() {
  const [page, setPage] = useState(1);
  const userId = useAuthStore(state => state.user?.user_id);
  const query = useQuery({ queryKey: ['commerce', userId, 'tickets', page], queryFn: () => listCommerce<TicketMetadata>('tickets/mine', page), retry: 1 });
  if (query.isPending) return <p role="status">Đang tải vé…</p>;
  if (query.isError) return <Failure error={query.error} retry={() => void query.refetch()} />;
  return <div className="space-y-5"><p className="tv-muted">Vé hiện thuộc tài khoản của bạn, bao gồm vé mua gốc và vé nhận chuyển nhượng.</p>{!query.data.items.length && <Empty text="Chưa có vé trong trang này." />}<div className="grid gap-5 md:grid-cols-2">{query.data.items.map(ticket => <article key={ticket.ticketId} className="tv-panel space-y-4"><Status value={ticket.status} /><h2 className="text-xl font-semibold">{ticket.event.title}</h2><p>{ticket.ticketType.name} · Vé số {ticket.ticketNumber}</p><p className="text-sm tv-muted">{ticket.showing.name} · {vietnamDate(ticket.showing.startTime)}</p><p className="text-sm tv-muted">{ticket.showing.venueName}, {ticket.showing.city}</p><Link href={`/account/tickets/${encodeURIComponent(ticket.ticketId)}`} className="tv-button tv-primary">Chi tiết vé / QR</Link></article>)}</div><Pagination page={page} total={query.data.total} busy={query.isFetching} onChange={setPage} /></div>;
}
export function ResaleAccount() {
  const [tab, setTab] = useState<'sell' | 'buy'>('sell');
  return <div className="space-y-5"><div className="flex flex-wrap gap-3"><button className={`tv-button ${tab === 'sell' ? 'tv-primary' : ''}`} aria-pressed={tab === 'sell'} onClick={() => setTab('sell')}>Vé tôi đăng bán</button><button className={`tv-button ${tab === 'buy' ? 'tv-primary' : ''}`} aria-pressed={tab === 'buy'} onClick={() => setTab('buy')}>Đơn tôi mua lại</button><Link className="tv-button" href="/account/tickets">Chọn vé để đăng bán</Link></div>{tab === 'sell' ? <MyListings /> : <OrdersList resale />}</div>;
}
function MyListings() {
  const [page, setPage] = useState(1);
  const userId = useAuthStore(state => state.user?.user_id);
  const query = useQuery({ queryKey: ['commerce', userId, 'my-listings', page], queryFn: () => listCommerce<Listing>('resale/listings/mine', page), retry: 1 });
  if (query.isPending) return <p role="status">Đang tải tin đăng…</p>;
  if (query.isError) return <Failure error={query.error} retry={() => void query.refetch()} />;
  return <div className="space-y-4">{!query.data.items.length && <Empty text="Bạn chưa có tin đăng trong trang này." href="/account/tickets" action="Chọn vé của tôi" />}{query.data.items.map(listing => <article key={listing.listingId} className="tv-panel flex flex-wrap justify-between gap-4"><div className="space-y-2"><Status value={listing.status} /><h2 className="text-lg font-semibold">{listing.event.title}</h2><p className="tv-muted">{listing.ticketType.name} · {money(listing.price)}</p></div><Link className="tv-button self-center" href={`/pass/${encodeURIComponent(listing.listingId)}`}>Quản lý tin đăng</Link></article>)}<Pagination page={page} total={query.data.total} busy={query.isFetching} onChange={setPage} /></div>;
}
