'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { listPayments } from '@/lib/commerce/payment';
import type { PaymentFilters } from '@/lib/commerce/payment-types';
import { money, dateTime } from '@/lib/commerce/rules';
import { Failure, Pagination } from './shared';
import { paymentLabels } from './PaymentHistory';

export function ManagedPayments() {
  const [filters, setFilters] = useState<PaymentFilters>({ page: 1, limit: 20 }); const [error, setError] = useState<unknown>(null);
  const query = useQuery({ queryKey: ['commerce', 'managed-payments', filters], queryFn: ({ signal }) => listPayments(filters, signal), retry: false });
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const text = (key: string) => String(data.get(key) ?? '').trim();
    const from = text('from') ? new Date(text('from')).toISOString() : undefined; const to = text('to') ? new Date(text('to')).toISOString() : undefined;
    if (from && to && from > to) { setError(new Error('Thời điểm bắt đầu phải trước hoặc bằng thời điểm kết thúc.')); return; }
    setError(null); setFilters({ page: 1, limit: 20, orderId: text('orderId') || undefined, status: (text('status') || undefined) as PaymentFilters['status'], from, to });
  }
  return <div className="space-y-5"><form className="tv-panel grid gap-4 sm:grid-cols-2" onSubmit={apply}><label>Mã đơn hàng<input name="orderId" maxLength={40} pattern="[a-zA-Z0-9_-]{1,40}" className="tv-input" /></label><label>Trạng thái<select name="status" className="tv-input"><option value="">Tất cả trạng thái</option>{Object.entries(paymentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Từ thời điểm<input name="from" type="datetime-local" className="tv-input" /></label><label>Đến thời điểm<input name="to" type="datetime-local" className="tv-input" /></label><p className="text-xs opacity-70 sm:col-span-2">Thời gian theo múi giờ thiết bị, lọc theo thời điểm tạo lần thanh toán.</p><div className="flex gap-3"><button className="tv-button tv-primary" disabled={query.isFetching}>Áp dụng</button><button className="tv-button" type="reset" onClick={() => { setError(null); setFilters({ page: 1, limit: 20 }); }}>Đặt lại</button></div></form>{error != null && <Failure error={error} />}{query.isPending && <p role="status">Đang tải giao dịch…</p>}{query.isError && <Failure error={query.error} retry={() => void query.refetch()} />}{query.data && !query.isError && <><div className="tv-panel overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr>{['Giao dịch / Đơn', 'Lần', 'Số tiền', 'Trạng thái', 'Thời gian'].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{query.data.items.map(payment => <tr key={payment.payment_id} className="border-t border-current/15"><td className="p-3"><p className="break-all text-xs opacity-70">{payment.payment_id}</p><Link className="font-medium text-violet-600 underline" href={`/moderator/orders/${encodeURIComponent(payment.orderId)}`}>{payment.orderId}</Link></td><td className="p-3">{payment.attemptNumber}</td><td className="p-3 whitespace-nowrap">{money(payment.amount)}</td><td className="p-3">{paymentLabels[payment.status]}</td><td className="p-3">{dateTime(payment.createdAt)}</td></tr>)}</tbody></table>{!query.data.items.length && <p className="py-8 text-center opacity-70">Không có giao dịch phù hợp.</p>}</div><Pagination page={filters.page} total={query.data.total} limit={filters.limit} busy={query.isFetching} onChange={page => setFilters(current => ({ ...current, page }))} /></>}</div>;
}
