'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/auth.store';
import { Failure } from '@/components/ui/commerce';
import { organizerApi, vnd } from '../_lib/organizer.api';

const countFormat = new Intl.NumberFormat('vi-VN');
const timeFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' });

function csvCell(value: string) {
  const safe = /^[=+\-@]/u.test(value.trimStart()) || value.charCodeAt(0) < 32 || value.trimStart().charCodeAt(0) < 32 ? "'" + value : value;
  return '"' + safe.replace(/"/g, '""') + '"';
}

export function ReportPanel({ organizerId, eventId }: { organizerId: string; eventId?: string }) {
  const revision = useAuthStore(state => state.revision);
  const userId = useAuthStore(state => state.user?.user_id);
  const scope = JSON.stringify([userId, revision, organizerId, eventId]);
  const [selection, setSelection] = useState({ scope, eventId: '', showingId: '' });
  const [exportError, setExportError] = useState('');
  const selectedEvent = eventId ?? (selection.scope === scope ? selection.eventId : '');
  const selectedShowing = selection.scope === scope ? selection.showingId : '';
  const query = useQuery({
    queryKey: ['organizer', userId, revision, organizerId, 'report', eventId],
    queryFn: ({ signal }) => organizerApi.report(organizerId, eventId, signal),
    enabled: !!userId,
    gcTime: 0,
    retry: 1,
  });
  const data = !query.isPending && !query.isError ? query.data : undefined;
  const events = new Map(data?.rows.map(row => [row.eventId, row.eventTitle]));
  const eventRows = data?.rows.filter(row => !selectedEvent || row.eventId === selectedEvent) ?? [];
  const showings = new Map(eventRows.map(row => [row.showingId, row]));
  const rows = eventRows.filter(row => !selectedShowing || row.showingId === selectedShowing);
  const totals = rows.reduce((sum, row) => ({ orderCount: sum.orderCount + BigInt(row.orderCount), ticketCount: sum.ticketCount + BigInt(row.ticketCount), amount: sum.amount + BigInt(row.amount) }), { orderCount: BigInt(0), ticketCount: BigInt(0), amount: BigInt(0) });

  function exportCsv() {
    const session = useAuthStore.getState();
    if (!data || !rows.length || !userId || session.status !== 'authenticated' || session.revision !== revision || session.user?.user_id !== userId) return;
    try {
      const csv = [
        ['Mã sự kiện', 'Sự kiện', 'Mã suất diễn', 'Suất diễn', 'Bắt đầu (giờ Việt Nam)', 'Mã hạng vé', 'Hạng vé', 'Đơn đã thanh toán', 'Vé đã bán', 'Tổng thu (VND)'],
        ...rows.map(row => [row.eventId, row.eventTitle, row.showingId, row.showingName, timeFormat.format(new Date(row.showingStartTime)), row.ticketTypeId, row.ticketTypeName, row.orderCount, row.ticketCount, row.amount]),
        ['', 'TỔNG CỘNG', '', '', '', '', '', totals.orderCount.toString(), totals.ticketCount.toString(), totals.amount.toString()],
      ].map(row => row.map(csvCell).join(',')).join('\r\n');
      const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
      try {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'bao-cao-ban-ve-' + new Date().toISOString().slice(0, 10) + '.csv';
        document.body.appendChild(anchor);
        try { anchor.click(); } finally { anchor.remove(); }
      } finally { window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
      setExportError('');
    } catch {
      setExportError('Không thể xuất CSV. Vui lòng thử lại.');
    }
  }

  return <section className="min-w-0 space-y-5" aria-label="Báo cáo bán vé">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-violet-300">Tổng quan</p><h2 className="mt-2 text-2xl font-semibold">Báo cáo bán vé</h2><p className="mt-2 text-sm tv-muted">Toàn thời gian · Chỉ đơn mua vé gốc đã thanh toán. Không cộng giao dịch bán lại.</p></div>
      <div className="flex flex-wrap gap-2"><button className="tv-button" disabled={query.isFetching} onClick={() => { setExportError(''); void query.refetch(); }}>Làm mới</button><button className="tv-button tv-primary" disabled={!data || !rows.length} onClick={exportCsv}><Download aria-hidden="true" className="size-4" />Xuất CSV</button></div>
    </header>
    <div className="tv-panel grid gap-4 sm:grid-cols-2">
      <label>Sự kiện<select className="tv-input" value={selectedEvent} disabled={!data || !!eventId} onChange={event => { setSelection({ scope, eventId: event.target.value, showingId: '' }); setExportError(''); }}><option value="">Tất cả sự kiện</option>{selectedEvent && !events.has(selectedEvent) && <option value={selectedEvent}>Sự kiện đã chọn (chưa có dữ liệu)</option>}{Array.from(events, ([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label>
      <label>Suất diễn<select className="tv-input" value={selectedShowing} disabled={!data} onChange={event => { setSelection({ scope, eventId: selectedEvent, showingId: event.target.value }); setExportError(''); }}><option value="">Tất cả suất diễn</option>{selectedShowing && !showings.has(selectedShowing) && <option value={selectedShowing}>Suất diễn đã chọn (không còn dữ liệu)</option>}{Array.from(showings, ([id, row]) => <option key={id} value={id}>{!selectedEvent ? row.eventTitle + ' — ' : ''}{row.showingName} · {timeFormat.format(new Date(row.showingStartTime))}</option>)}</select></label>
    </div>
    {exportError && <p role="alert" className="text-sm text-rose-300">{exportError}</p>}
    {query.isPending ? <p role="status" className="tv-panel">Đang tải báo cáo…</p> : query.isError ? <Failure error={query.error} retry={() => void query.refetch()} /> : data && <>
      <dl className="grid gap-4 sm:grid-cols-3">{[['Đơn đã thanh toán', countFormat.format(totals.orderCount)], ['Vé đã bán', countFormat.format(totals.ticketCount)], ['Tổng thu', vnd(totals.amount.toString())]].map(([label, value]) => <div key={label} className={'tv-panel ' + (label === 'Tổng thu' ? 'border-violet-400/40 bg-violet-500/10' : '')}><dt className="text-sm tv-muted">{label}</dt><dd className="mt-3 break-words text-2xl font-semibold tabular-nums">{value}</dd></div>)}</dl>
      <p className="text-xs leading-6 tv-muted">Tổng thu là số tiền đơn vé gốc đã thanh toán sau giảm giá, chưa trừ phí, hoàn tiền hay khoản chi trả; không phải lợi nhuận hoặc tiền thực nhận. CSV chứa đúng dữ liệu đang lọc, tiền là số nguyên VND.</p>
      <div className="tv-panel overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><caption className="sr-only">Báo cáo bán vé theo sự kiện, suất diễn và hạng vé; toàn thời gian.</caption><thead><tr className="border-b border-white/20"><th scope="col" className="p-3">Sự kiện / suất diễn / hạng vé</th><th scope="col" className="p-3 text-right">Đơn</th><th scope="col" className="p-3 text-right">Vé đã bán</th><th scope="col" className="p-3 text-right">Tổng thu</th></tr></thead><tbody>{rows.map(row => <tr className="border-b border-white/10" key={row.ticketTypeId}><th scope="row" className="p-3 font-normal"><p className="font-medium">{row.eventTitle}</p><p className="mt-1 text-xs tv-muted">{row.showingName} · {timeFormat.format(new Date(row.showingStartTime))}</p><p className="mt-1 text-xs text-violet-200">{row.ticketTypeName}</p></th><td className="p-3 text-right tabular-nums">{countFormat.format(BigInt(row.orderCount))}</td><td className="p-3 text-right tabular-nums">{countFormat.format(BigInt(row.ticketCount))}</td><td className="whitespace-nowrap p-3 text-right tabular-nums">{vnd(row.amount)}</td></tr>)}</tbody>{rows.length > 0 && <tfoot><tr className="border-t border-white/20 font-semibold"><th scope="row" className="p-3">Tổng cộng</th><td className="p-3 text-right tabular-nums">{countFormat.format(totals.orderCount)}</td><td className="p-3 text-right tabular-nums">{countFormat.format(totals.ticketCount)}</td><td className="whitespace-nowrap p-3 text-right tabular-nums">{vnd(totals.amount.toString())}</td></tr></tfoot>}</table>{!rows.length && <p className="p-3 text-sm tv-muted">Chưa có hạng vé phù hợp với bộ lọc. Các hạng vé chưa bán được vé hiển thị số liệu 0.</p>}</div>
    </>}
  </section>;
}
