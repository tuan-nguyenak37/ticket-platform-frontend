'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getRevenue, revenueBuckets, revenueLabels, type RevenueStatus } from '@/lib/commerce/revenue';
import { dateTime, money } from '@/lib/commerce/rules';
import { useAuthStore } from '@/lib/store/auth.store';
import { PayoutAccount } from '@/components/users/PayoutAccount';
import { Failure, Pagination } from './shared';
import { PaymentHistory } from './PaymentHistory';

export function RevenuePage() {
  const actor = useAuthStore(state => state.user?.user_id);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<RevenueStatus | ''>('');
  const query = useQuery({
    queryKey: ['commerce', 'revenue', actor, page, status],
    queryFn: ({ signal }) => getRevenue({ page, limit: 20, status: status || undefined }, signal),
    retry: false, refetchInterval: false, refetchOnWindowFocus: false, refetchOnReconnect: false,
  });
  const revenue = query.data;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><p className="max-w-2xl text-sm leading-6 opacity-75">Theo dõi tiền bán vé và các khoản chi trả. Khi giao dịch đủ điều kiện và hết thời hạn tranh chấp, hệ thống tự xử lý chi trả về tài khoản nhận tiền của bạn.</p><button className="tv-button" disabled={query.isFetching} onClick={() => void query.refetch()}>{query.isFetching ? 'Đang tải…' : 'Làm mới doanh thu'}</button></div>
    {query.isPending && <p role="status">Đang tải doanh thu…</p>}
    {query.isError && <Failure error={query.error} retry={() => void query.refetch()} />}
    {revenue && !query.isError && <>
      {revenue.isMock && <p className="text-sm opacity-70">Các khoản chi trả hiện được mô phỏng, chưa chuyển tiền qua ngân hàng.</p>}
      {revenue.requiredAction === 'add_payout_account' && <section className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5"><h2 className="font-semibold">Bổ sung tài khoản để nhận tiền bán vé</h2><p className="my-3 text-sm leading-6">Bạn vẫn có thể đăng vé khi chưa có tài khoản nhận tiền. Các khoản đủ điều kiện sẽ chờ đến khi bạn bổ sung tài khoản.</p><a className="tv-button tv-primary inline-block" href="#payout-account">Thêm tài khoản nhận tiền</a></section>}
      {!revenue.automaticPayoutsEnabled && <p className="tv-panel text-sm">Chi trả tự động hiện chưa được bật. Bạn vẫn có thể cập nhật tài khoản và theo dõi các khoản chờ chi trả.</p>}
      <section className="space-y-4" aria-label="Tổng quan doanh thu"><div><h2 className="text-xl font-semibold">Tổng quan · {revenue.summary.totalOrders} đơn bán</h2><p className="mt-1 text-sm opacity-60">Tổng tiền của tất cả đơn bán hợp lệ, không thay đổi theo bộ lọc bên dưới.</p></div><dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{revenueBuckets.map(bucket => <div key={bucket.status} className={`tv-panel min-w-0 ${bucket.status === 'paid' ? 'border-emerald-400/30 bg-emerald-500/10' : ''}`}><dt className="text-sm opacity-75">{revenueLabels[bucket.status]}</dt><dd className="mt-3 break-words text-2xl font-semibold">{money(revenue.summary[bucket.amount])}</dd></div>)}</dl></section>
    </>}
    <PayoutAccount />
    <section className="space-y-4" aria-label="Danh sách doanh thu"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Đơn bán của bạn</h2><label className="text-sm">Trạng thái chi trả<select className="tv-input mt-1" value={status} onChange={event => { setStatus(event.target.value as RevenueStatus | ''); setPage(1); }}><option value="">Tất cả trạng thái</option>{revenueBuckets.map(bucket => <option key={bucket.status} value={bucket.status}>{revenueLabels[bucket.status]}</option>)}</select></label></div>
      {revenue && !query.isError && <>
        {!revenue.items.length && <p className="tv-panel">{status ? 'Chưa có đơn bán ở trạng thái này.' : 'Chưa có doanh thu từ vé đã bán.'}</p>}
        {revenue.items.map(order => <article key={order.order_id} className="tv-panel min-w-0 space-y-4"><div className="flex flex-wrap justify-between gap-3"><div className="min-w-0"><h3 className="break-words text-lg font-semibold">{order.ticket.eventName}</h3><p className="mt-1 text-sm opacity-70">{order.ticket.ticketTier}{order.ticket.seatInfo && ` · ${order.ticket.seatInfo}`}</p></div><p className="h-fit rounded-full bg-violet-400/10 px-3 py-2 text-sm">{revenueLabels[order.revenueStatus]}</p></div><p className="break-all text-xs opacity-60">Mã đơn: {order.order_id} · {dateTime(order.createdAt)}</p><dl className="grid gap-3 text-sm sm:grid-cols-3"><div><dt className="opacity-60">Giá bán</dt><dd className="mt-1">{money(order.amount)}</dd></div><div><dt className="opacity-60">Phí nền tảng</dt><dd className="mt-1">{money(order.platformFee)}</dd></div><div><dt className="opacity-60">Tiền bán sau phí</dt><dd className="mt-1 font-semibold">{money(order.sellerNetAmount)}</dd></div></dl>{order.transferId && <p className="break-all text-sm opacity-75">Mã chi trả: {order.transferId} · {order.legacyTransfer ? 'Ghi nhận dữ liệu trước đây: ' : ''}{dateTime(order.transferRecordedAt)}</p>}<Link className="tv-button inline-block" href={`/don-hang/${encodeURIComponent(order.order_id)}`}>Chi tiết đơn hàng</Link><PaymentHistory id={order.order_id} /></article>)}
        <Pagination page={revenue.page} total={revenue.total} limit={revenue.limit} busy={query.isFetching} onChange={setPage} />
      </>}
    </section>
  </div>;
}
