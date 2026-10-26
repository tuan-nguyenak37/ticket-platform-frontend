'use client';

import { useState, type FormEvent } from 'react';
import { Banknote, Ticket, Repeat2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/auth.store';
import { Failure } from '@/components/ui/commerce';
import { adminApi, type AdminStatistics as Statistics, type StatisticsFilter } from '../_lib/admin.api';

const countFormat = new Intl.NumberFormat('vi-VN');
const compactFormat = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 });
const moneyFormat = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const statuses = [
  { status: 'SUCCEEDED', label: 'Thành công', color: '#34d399' },
  { status: 'FAILED', label: 'Thất bại', color: '#fb7185' },
  { status: 'PENDING', label: 'Đang chờ', color: '#a78bfa' },
  { status: 'REVIEW', label: 'Cần kiểm tra', color: '#fbbf24' },
] as const;

function recentRange(days: number): StatisticsFilter {
  const dateTo = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
  return { dateFrom: new Date(Date.parse(`${dateTo}T00:00:00Z`) - (days - 1) * 86400000).toISOString().slice(0, 10), dateTo, groupBy: 'day' };
}

function percentage(value: bigint, maximum: bigint) {
  return maximum === BigInt(0) ? 0 : Number(value * BigInt(10000) / maximum) / 100;
}

function dateLabel(date: string, monthly = false) {
  const [year, month, day] = date.split('-');
  return monthly ? `${month}/${year}` : `${day}/${month}/${year}`;
}

export function AdminStatistics() {
  const user = useAuthStore(state => state.user);
  const revision = useAuthStore(state => state.revision);
  const [filter, setFilter] = useState<StatisticsFilter>(() => recentRange(30));
  const [draft, setDraft] = useState(filter);
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['admin', 'statistics', user?.user_id, revision, filter],
    queryFn: ({ signal }) => adminApi.statistics(filter, signal),
    enabled: user?.role === 'ADMIN',
    gcTime: 0,
    retry: 1,
  });

  function apply(event: FormEvent) {
    event.preventDefault();
    const start = Date.parse(`${draft.dateFrom}T00:00:00Z`);
    const end = Date.parse(`${draft.dateTo}T00:00:00Z`);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || end - start > 365 * 86400000) {
      setError('Chọn khoảng thời gian hợp lệ từ 1 đến 366 ngày.');
      return;
    }
    setError('');
    setFilter({ ...draft });
  }

  return (
    <section className="min-w-0 space-y-5" aria-label="Biểu đồ thống kê">
      <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-semibold">Kết quả bán vé</h2><p className="mt-1 text-xs tv-muted">Theo ngày thanh toán · Giờ Việt Nam</p></div>
          <div className="flex flex-wrap gap-2" aria-label="Khoảng thời gian nhanh">
            {[7, 30].map(days => { const range = recentRange(days); const active = filter.dateFrom === range.dateFrom && filter.dateTo === range.dateTo && filter.groupBy === 'day'; return <button key={days} aria-pressed={active} className={`tv-button ${active ? 'tv-primary' : ''}`} onClick={() => { setDraft(range); setFilter(range); setError(''); }}>{days} ngày gần nhất</button>; })}
            <button className="tv-button" disabled={query.isFetching} onClick={() => void query.refetch()}>Làm mới số liệu</button>
          </div>
        </div>
        <form onSubmit={apply} className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="min-w-0 flex-1 text-sm">Từ ngày<input type="date" required value={draft.dateFrom} onChange={event => setDraft({ ...draft, dateFrom: event.target.value })} className="tv-input" /></label>
          <label className="min-w-0 flex-1 text-sm">Đến ngày<input type="date" required value={draft.dateTo} onChange={event => setDraft({ ...draft, dateTo: event.target.value })} className="tv-input" /></label>
          <label className="min-w-0 flex-1 text-sm">Chia kỳ<select value={draft.groupBy} onChange={event => setDraft({ ...draft, groupBy: event.target.value as StatisticsFilter['groupBy'] })} className="tv-input"><option value="day">Theo ngày</option><option value="month">Theo tháng</option></select></label>
          <button type="submit" className="tv-button tv-primary">Áp dụng</button>
        </form>
        {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      </div>
      {query.isPending ? <p role="status" className="tv-panel">Đang tải biểu đồ thống kê…</p> : query.isError ? <Failure error={query.error} retry={() => void query.refetch()} /> : <StatisticsCharts data={query.data} />}
    </section>
  );
}

function StatisticsCharts({ data }: { data: Statistics }) {
  const originalAmount = data.series.reduce((total, row) => total + BigInt(row.originalAmount), BigInt(0));
  const resaleAmount = data.series.reduce((total, row) => total + BigInt(row.resaleAmount), BigInt(0));
  const originalOrders = data.series.reduce((total, row) => total + BigInt(row.originalOrders), BigInt(0));
  const resaleOrders = data.series.reduce((total, row) => total + BigInt(row.resaleOrders), BigInt(0));
  const totalAmount = originalAmount + resaleAmount;
  const maxTickets = data.topEvents.reduce((maximum, row) => [BigInt(row.originalTickets), BigInt(row.resaleTickets), maximum].reduce((largest, value) => value > largest ? value : largest), BigInt(0));
  return <div className="min-w-0 space-y-5">
    <p className="text-xs tv-muted">Đang xem: <strong className="font-medium text-violet-200">{dateLabel(data.dateFrom)} – {dateLabel(data.dateTo)}</strong> · {data.groupBy === 'month' ? 'Theo tháng' : 'Theo ngày'}</p>
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <section aria-label="Tổng thu trong kỳ" className="relative min-w-0 overflow-hidden rounded-2xl border border-violet-400/40 bg-[linear-gradient(120deg,#3b1e64,#211334_70%,#191224)] p-5 sm:col-span-2 sm:p-6">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white/10"><Banknote aria-hidden="true" className="size-5 text-violet-200" /></span><h3 className="text-sm font-medium text-violet-100">Tổng thu</h3><span className="ml-auto rounded-full border border-violet-300/20 px-2 py-1 text-[11px] text-violet-200">Đã thanh toán</span></div>
        <p className="mt-5 break-words text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">{moneyFormat.format(totalAmount)}</p>
        <p className="mt-2 text-xs text-violet-200/80">{countFormat.format(originalOrders + resaleOrders)} đơn thanh toán thành công</p>
        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-white/15 pt-4 text-xs"><div className="min-w-0"><dt className="text-violet-200/80">Thu từ vé gốc</dt><dd className="mt-1 break-words font-semibold tabular-nums">{moneyFormat.format(originalAmount)}</dd></div><div className="min-w-0"><dt className="text-cyan-200">Thu từ vé bán lại</dt><dd className="mt-1 break-words font-semibold tabular-nums">{moneyFormat.format(resaleAmount)}</dd></div></dl>
      </section>
      <section className="tv-panel flex flex-col"><Ticket aria-hidden="true" className="mb-5 size-6 text-violet-300" /><h3 className="text-sm tv-muted">Đơn vé gốc</h3><p className="mt-2 break-words text-3xl font-bold tabular-nums">{countFormat.format(originalOrders)}</p><p className="mt-auto pt-4 text-xs leading-5 tv-muted">Đã thanh toán trong kỳ, bao gồm đơn miễn phí.</p></section>
      <section className="tv-panel flex flex-col"><Repeat2 aria-hidden="true" className="mb-5 size-6 text-cyan-300" /><h3 className="text-sm tv-muted">Đơn vé bán lại</h3><p className="mt-2 break-words text-3xl font-bold tabular-nums">{countFormat.format(resaleOrders)}</p><p className="mt-auto pt-4 text-xs leading-5 tv-muted">Đã thanh toán trong kỳ. Không phải vé phát hành mới.</p></section>
    </div>
    <p className="text-xs leading-6 tv-muted">Tổng thu = tiền thanh toán vé gốc + vé bán lại trong kỳ, chưa trừ phí, hoàn tiền hay khoản chi trả. Đây không phải lợi nhuận; một vé bán lại có thể phát sinh thêm lần thu.</p>
    <TrendChart data={data} title="Xu hướng tổng thu" original="originalAmount" resale="resaleAmount" currency />
    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
      <TrendChart data={data} title="Số đơn đã thanh toán" original="originalOrders" resale="resaleOrders" />
    <section className="tv-panel space-y-5">
      <h3 className="text-lg font-semibold">Sự kiện bán chạy</h3>
      <p className="text-sm tv-muted">Top 10 theo vé gốc đã thanh toán và lượt bán lại trong kỳ. Lượt bán lại không phải vé phát hành mới; một vé có thể được bán lại nhiều lần.</p>
      {!data.topEvents.length ? <p className="text-sm tv-muted">Chưa có vé được thanh toán trong khoảng thời gian này.</p> : <ol className="space-y-5">{data.topEvents.map((event, index) => <li key={event.eventId} className="space-y-2">
        <p className="break-words text-sm font-semibold">{index + 1}. {event.title}</p>
        <p className="break-all text-xs tv-muted">{event.eventId}</p>
        {(['originalTickets', 'resaleTickets'] as const).map(field => <div key={field} className="space-y-1"><div className="flex flex-wrap justify-between gap-2 text-xs tv-muted"><span>{field === 'originalTickets' ? 'Vé gốc đã thanh toán' : 'Lượt bán lại'}</span><span className="tabular-nums">{countFormat.format(BigInt(event[field]))}</span></div><div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${field === 'originalTickets' ? 'bg-violet-400' : 'bg-cyan-400'}`} style={{ width: `${percentage(BigInt(event[field]), maxTickets)}%` }} /></div></div>)}
      </li>)}</ol>}
    </section>
    </div>
    <section className="tv-panel space-y-5">
      <h3 className="text-lg font-semibold">Trạng thái giao dịch VNPay</h3>
      <p className="text-sm tv-muted">Theo ngày tạo giao dịch, hiển thị trạng thái hiện tại. Mỗi lần thử là một giao dịch; một đơn có thể có nhiều lần thử. Đơn miễn phí không qua VNPay.</p>
      <div className="grid gap-6 sm:grid-cols-2">{(['orders', 'resale'] as const).map(kind => {
        const rows = data.payments.filter(row => row.kind === kind);
        const total = rows.reduce((sum, row) => sum + BigInt(row.count), BigInt(0));
        return <section key={kind} className="min-w-0 space-y-3"><h4 className="font-semibold">{kind === 'orders' ? 'Mua vé gốc' : 'Mua vé bán lại'}</h4><p className="text-sm tv-muted">{countFormat.format(total)} giao dịch</p>{total === BigInt(0) ? <p className="text-sm tv-muted">Chưa có giao dịch VNPay trong kỳ.</p> : statuses.map(status => {
          const count = BigInt(rows.find(row => row.status === status.status)?.count ?? '0');
          const ratio = percentage(count, total);
          return <div key={status.status} className="space-y-1"><div className="flex flex-wrap justify-between gap-2 text-sm"><span>{status.label}</span><span className="tabular-nums tv-muted">{countFormat.format(count)} · {ratio.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%</span></div><div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${ratio}%`, backgroundColor: status.color }} /></div></div>;
        })}</section>;
      })}</div>
    </section>
  </div>;
}

function TrendChart({ data, title, original, resale, currency = false }: {
  data: Statistics; title: string; original: 'originalAmount' | 'originalOrders'; resale: 'resaleAmount' | 'resaleOrders'; currency?: boolean;
}) {
  const fields = currency ? ['total', original, resale] as const : [original, resale] as const;
  const labels = { total: 'Tổng thu', [original]: 'Vé gốc', [resale]: 'Bán lại' };
  const colors = { total: '#d2adff', [original]: '#9662ea', [resale]: '#22d3ee' };
  const value = (row: Statistics['series'][number], field: typeof fields[number]) => field === 'total' ? BigInt(row[original]) + BigInt(row[resale]) : BigInt(row[field]);
  const maximum = data.series.reduce((largest, row) => fields.reduce((maximum, field) => value(row, field) > maximum ? value(row, field) : maximum, largest), BigInt(0));
  const scale = maximum < BigInt(4) ? BigInt(4) : (maximum + BigInt(3)) / BigInt(4) * BigInt(4);
  const plotX = (index: number) => data.series.length < 2 ? 410 : 90 + index / (data.series.length - 1) * 630;
  const plotY = (amount: bigint) => 200 - percentage(amount, scale) * 1.7;
  const format = (amount: bigint) => (currency ? moneyFormat : countFormat).format(amount);
  return <section className="tv-panel min-w-0 space-y-4">
    <h3 className="text-lg font-semibold">{title}{currency ? ' (VND)' : ''}</h3>
    <div className="flex flex-wrap gap-4 text-xs">{fields.map(field => <span key={field} className="flex items-center gap-2"><span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: colors[field] }} />{labels[field]}</span>)}</div>
    {maximum === BigInt(0) ? <p className="py-8 text-center text-sm tv-muted">{currency ? 'Tổng thu trong kỳ là 0 ₫.' : 'Chưa có đơn đã thanh toán trong kỳ.'}</p> : <div className="overflow-x-auto">
      <svg viewBox="0 0 760 250" className="w-full min-w-[380px] sm:min-w-0" role="img" aria-label={`${title}${currency ? ': tổng thu là tổng vé gốc và bán lại' : ': số đơn vé gốc và bán lại'}. Bảng số liệu chi tiết ở bên dưới.`}>
        {currency && data.series.length > 1 && <polygon aria-hidden="true" fill="#a78bfa12" points={`${plotX(0)},200 ${data.series.map((row, index) => `${plotX(index)},${plotY(value(row, 'total'))}`).join(' ')} ${plotX(data.series.length - 1)},200`} />}
        {[0, 1, 2, 3, 4].map(tick => <g key={tick}><line x1="90" y1={200 - tick * 42.5} x2="720" y2={200 - tick * 42.5} stroke="#ffffff1a" /><text x="80" y={204 - tick * 42.5} fill="#c4b5d5" textAnchor="end" fontSize="12">{compactFormat.format(scale * BigInt(tick) / BigInt(4))}</text></g>)}
        {fields.map(field => <g key={field} stroke={colors[field]}><polyline fill="none" strokeWidth={field === 'total' ? 3 : 2} strokeDasharray={currency && field !== 'total' ? '5 4' : undefined} strokeLinejoin="round" points={data.series.map((row, index) => `${plotX(index)},${plotY(value(row, field))}`).join(' ')} />{data.series.map((row, index) => <circle key={row.period} cx={plotX(index)} cy={plotY(value(row, field))} r={data.series.length > 60 ? 1.5 : 3} fill={colors[field]}><title>{`${dateLabel(row.period, data.groupBy === 'month')} · ${labels[field]}: ${format(value(row, field))}`}</title></circle>)}</g>)}
        {[...new Set([0, Math.floor((data.series.length - 1) / 2), data.series.length - 1])].map(index => data.series[index] && <text key={index} x={plotX(index)} y="230" fill="#c4b5d5" fontSize="12" textAnchor={index === 0 ? 'start' : index === data.series.length - 1 ? 'end' : 'middle'}>{dateLabel(data.series[index].period, data.groupBy === 'month')}</text>)}
      </svg>
    </div>}
    <details><summary className="cursor-pointer py-2 text-sm text-[#d2adff]">Xem bảng số liệu</summary><div className="max-h-80 overflow-auto"><table className="w-full text-left text-xs tabular-nums"><caption className="sr-only">{title}, từ {dateLabel(data.dateFrom)} đến {dateLabel(data.dateTo)}</caption><thead><tr><th scope="col" className="p-2">Kỳ</th>{fields.map(field => <th key={field} scope="col" className="p-2">{labels[field]}</th>)}</tr></thead><tbody>{data.series.map(row => <tr key={row.period} className="border-t border-white/10"><th scope="row" className="whitespace-nowrap p-2 font-normal">{dateLabel(row.period, data.groupBy === 'month')}</th>{fields.map(field => <td key={field} className="whitespace-nowrap p-2">{format(value(row, field))}</td>)}</tr>)}</tbody></table></div></details>
  </section>;
}
