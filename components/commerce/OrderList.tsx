'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { listOrders } from '@/lib/commerce/api';
import { dateTime, money, orderLabels, payoutLabels } from '@/lib/commerce/rules';
import type { OrderFilters } from '@/lib/commerce/types';
import { Failure, Pagination } from './shared';
export function OrderList({ manage = false }: { manage?: boolean }) {
  const [filters, setFilters] = useState<OrderFilters>({ page: 1, limit: 20 });
  const query = useQuery({ queryKey: ['commerce', 'orders', manage, filters], queryFn: ({ signal }) => listOrders(filters, manage, signal) });
  return <div className="space-y-5"><div className="tv-panel flex flex-wrap items-end gap-4">{!manage && <label>Loại đơn<select className="tv-input" value={filters.side ?? ''} onChange={e => setFilters({ ...filters, page: 1, side: (e.target.value || undefined) as OrderFilters['side'] })}><option value="">Mua và bán</option><option value="buyer">Đơn mua</option><option value="seller">Đơn bán</option></select></label>}<label>Trạng thái<select className="tv-input" value={filters.status ?? ''} onChange={e => setFilters({ ...filters, page: 1, status: (e.target.value || undefined) as OrderFilters['status'] })}><option value="">Tất cả</option>{Object.entries(orderLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="tv-button" disabled={query.isFetching} onClick={() => void query.refetch()}>Làm mới</button></div>
    {query.isPending ? <p role="status">Đang tải đơn hàng…</p> : query.isError ? <Failure error={query.error} retry={() => void query.refetch()} /> : <>{!query.data.items.length && <p className="tv-panel">Chưa có đơn hàng phù hợp.</p>}<div className="grid gap-4 md:grid-cols-2">{query.data.items.map(order => <article className="tv-panel space-y-3" key={order.order_id}><h2 className="text-lg font-semibold">{order.ticket.eventName}</h2><p>{order.ticket.ticketTier} · {order.ticket.seatInfo || 'Không khai báo ghế'}</p><p className="text-xl font-bold">{money(order.amount)}</p><p>{orderLabels[order.status]}</p><p className="text-sm opacity-75">Chi trả: {payoutLabels[order.payoutStatus]} · {dateTime(order.createdAt)}</p>{order.status === 'refund_pending' && <p className="rounded-xl bg-amber-500/10 p-3">Đơn đang chờ hoàn tiền; chưa hoàn tất hoàn tiền và không được tải vé.</p>}<Link className="tv-button" href={`${manage ? '/moderator/orders' : '/dashboard/orders'}/${encodeURIComponent(order.order_id)}`}>Chi tiết đơn</Link></article>)}</div><Pagination page={filters.page ?? 1} total={query.data.total} busy={query.isFetching} onChange={page => setFilters({ ...filters, page })} /></>}
  </div>;
}
