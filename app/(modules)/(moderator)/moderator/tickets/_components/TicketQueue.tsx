'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Search } from 'lucide-react';
import { TicketFilters as AdvancedFilters } from '@/components/commerce/TicketFilters';
import { useTickets } from '../_hooks/useTickets';
import type { TicketFilters } from '../_lib/tickets.types';
import { statusLabels, checkLabels, dateTime, money } from '../_lib/tickets.utils';

export function TicketQueue() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<TicketFilters>({ page: 1, limit: 20 });
  useEffect(() => { const timer = setTimeout(() => setFilters(current => current.q === (search.trim() || undefined) ? current : { ...current, q: search.trim() || undefined, page: 1 }), 300); return () => clearTimeout(timer); }, [search]);
  const query = useTickets(filters);
  const update = (value: Partial<TicketFilters>) => setFilters(current => ({ ...current, ...value, page: 1 }));
  const pages = Math.max(1, Math.ceil((query.data?.total ?? 0) / 20));
  return <div className="space-y-5">
    <details className="commerce commerce-light"><summary className="cursor-pointer text-sm font-semibold text-violet-700">Lọc theo sự kiện, danh mục, hạng và khoảng giá</summary><AdvancedFilters hideSort onApply={({ eventId, categoryId, ticketTier, minPrice, maxPrice, q }) => { setSearch(q ?? ''); update({ eventId, categoryId, ticketTier, minPrice, maxPrice, q }); }} /></details>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-900">Vé / Duyệt thủ công</h1><p className="mt-1 text-sm text-slate-500">Đối chiếu thông tin vé · Vé đăng trước được xem xét trước.</p></div><button onClick={() => void query.refetch()} disabled={query.isFetching} className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={16} />Làm mới</button></div>
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <label className="flex items-center gap-2 rounded-xl border p-3"><Search size={17} aria-hidden="true" /><span className="sr-only">Tìm tên sự kiện hoặc hạng vé</span><input value={search} maxLength={100} onChange={event => setSearch(event.target.value)} placeholder="Tìm tên sự kiện, hạng vé…" className="min-w-0 flex-1 text-sm outline-none" /></label>
      <div className="flex flex-wrap gap-3">
        <select aria-label="Trạng thái vé" value={filters.status ?? ''} onChange={e => update({ status: (e.target.value || undefined) as TicketFilters['status'] })} className="rounded-xl border p-2 text-sm"><option value="">Hàng chờ cần duyệt</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select aria-label="Trạng thái kiểm tra" value={filters.checkStatus ?? ''} onChange={e => update({ checkStatus: (e.target.value || undefined) as TicketFilters['checkStatus'] })} className="rounded-xl border p-2 text-sm"><option value="">Kiểm tra: mặc định</option>{Object.entries(checkLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select aria-label="Cách duyệt" value={filters.reviewMethod ?? ''} onChange={e => update({ reviewMethod: (e.target.value || undefined) as TicketFilters['reviewMethod'] })} className="rounded-xl border p-2 text-sm"><option value="">Mọi cách duyệt</option><option value="manual">Thủ công</option><option value="automatic">Tự động</option></select>
        <button onClick={() => { setSearch(''); setFilters({ page: 1, limit: 20 }); }} className="text-sm font-semibold text-violet-700">Đặt lại</button>
      </div>
      <p className="text-xs text-slate-500">{!filters.status && !filters.checkStatus ? 'Hàng chờ: cần xem xét, kiểm tra lỗi hoặc chưa có lượt kiểm tra.' : `Đang lọc nhóm ${statusLabels[filters.status ?? 'pending_review'].toLowerCase()}.`}</p>
    </div>
    {query.isError ? <div role="alert" className="rounded-xl bg-rose-50 p-5 text-rose-700">{query.error.message} <button onClick={() => void query.refetch()} className="underline">Thử lại</button></div> : query.isPending ? <p role="status">Đang tải hàng chờ…</p> : <>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Sự kiện / Mã vé', 'Hạng / Ghế', 'Giá bán', 'Trạng thái / Kiểm tra', 'Ngày đăng', ''].map((text, i) => <th key={i} scope="col" className="p-4">{text}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{query.data.items.map(ticket => <tr key={ticket.ticket_id}><td className="p-4"><p className="font-semibold">{ticket.event.name}</p><p className="mt-1 text-xs text-slate-500">{ticket.ticket_id}</p></td><td className="p-4">{ticket.ticketTier}<p className="text-xs text-slate-500">{ticket.seatInfo || 'Không có ghế'}</p></td><td className="p-4 whitespace-nowrap">{money(ticket.price)}</td><td className="p-4"><p>{statusLabels[ticket.status]}</p><p className="mt-1 text-xs text-violet-700">{ticket.check ? `${checkLabels[ticket.check.status]}${ticket.check.outcome === 'needs_review' ? ' · Cần xem xét' : ''}` : 'Chưa kiểm tra'}</p></td><td className="p-4 text-xs">{dateTime(ticket.createdAt)}</td><td className="p-4"><Link href={`/moderator/tickets/${encodeURIComponent(ticket.ticket_id)}`} className="font-semibold text-violet-700 hover:underline">Xem vé<span className="sr-only"> {ticket.ticket_id}</span></Link></td></tr>)}</tbody></table>{!query.data.items.length && <p className="p-12 text-center text-sm text-slate-500">Không có vé phù hợp với bộ lọc.</p>}</div>
      <div className="flex items-center justify-between text-sm"><button disabled={(filters.page ?? 1) <= 1 || query.isFetching} onClick={() => setFilters(current => ({ ...current, page: (current.page ?? 1) - 1 }))} className="rounded-lg border px-3 py-2 disabled:opacity-40">Trước</button><span>{query.data.total} vé · Trang {filters.page} / {pages}</span><button disabled={(filters.page ?? 1) >= pages || query.isFetching} onClick={() => setFilters(current => ({ ...current, page: (current.page ?? 1) + 1 }))} className="rounded-lg border px-3 py-2 disabled:opacity-40">Sau</button></div>
    </>}
  </div>;
}
