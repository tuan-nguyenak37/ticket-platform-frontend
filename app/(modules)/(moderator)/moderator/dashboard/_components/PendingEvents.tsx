'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, SlidersHorizontal, Music2, Cpu, Mic2, ChevronRight } from 'lucide-react';
import { Panel } from '@/app/(modules)/(moderator)/_components/Panel';
import { PreviewDialog, type PreviewDetails } from '@/app/(modules)/(moderator)/_components/PreviewDialog';
import type { ModerationEvent } from '../../events/_lib/events.types';
const eventStyles: Record<string, string> = {
  violet: 'bg-violet-100 text-violet-600', blue: 'bg-blue-100 text-blue-600',
  orange: 'bg-orange-100 text-orange-600', pink: 'bg-pink-100 text-pink-600',
};
const eventIcons = [Music2, Cpu, Mic2, Music2];

export function PendingEvents({ events }: { events: ModerationEvent[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [details, setDetails] = useState<PreviewDetails | null>(null);
  const filtered = events.filter(event => (category === 'Tất cả' || event.category === category) && `${event.name} ${event.organizer} ${event.id}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')));
  function openEvent(event: ModerationEvent) {
    setDetails({ title: event.name, fields: [
      { label: 'Mã sự kiện', value: event.id }, { label: 'Nhà tổ chức', value: event.organizer },
      { label: 'Danh mục', value: event.category }, { label: 'Địa điểm', value: event.location },
      { label: 'Thời gian', value: event.date }, { label: 'Số vé', value: event.tickets.toLocaleString('vi-VN') },
      { label: 'Trạng thái', value: 'Chờ duyệt' },
    ] });
  }
  return <>
    <Panel title="Sự kiện chờ duyệt" eyebrow="Hàng đợi kiểm duyệt" action={<Link href="/moderator/events" className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800">Xem tất cả<ArrowRight size={14} aria-hidden="true" /></Link>}>
      <div className="flex flex-wrap gap-3 border-y border-slate-100 px-5 py-3 sm:px-6"><label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2"><Search size={15} className="shrink-0 text-slate-400" aria-hidden="true" /><input aria-label="Tìm sự kiện chờ duyệt" placeholder="Tìm sự kiện, nhà tổ chức…" value={query} onChange={e => setQuery(e.target.value)} className="min-w-0 w-full bg-transparent text-xs outline-none placeholder:text-slate-400" /></label><label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 text-slate-500"><SlidersHorizontal size={14} aria-hidden="true" /><select aria-label="Lọc danh mục sự kiện" value={category} onChange={e => setCategory(e.target.value)} className="bg-transparent py-2 text-xs outline-none">{['Tất cả', 'Âm nhạc', 'Workshop', 'Hội nghị'].map(value => <option key={value}>{value}</option>)}</select></label></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-xs"><thead className="bg-slate-50/70 text-[10px] font-medium uppercase tracking-wider text-slate-400"><tr>{['Sự kiện', 'Nhà tổ chức', 'Thời gian gửi', 'Trạng thái', ''].map((heading, i) => <th key={i} scope="col" className="px-5 py-3 font-medium sm:px-6">{heading || <span className="sr-only">Thao tác</span>}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(event => { const Icon = eventIcons[events.indexOf(event)]; return <tr key={event.id} className="hover:bg-slate-50/70"><td className="px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${eventStyles[event.color]}`}><Icon size={19} aria-hidden="true" /></span><div><p className="font-semibold text-slate-800">{event.name}</p><p className="mt-1 text-[10px] text-slate-400">{event.id} · {event.category}</p></div></div></td><td className="px-5 py-4 text-slate-500 sm:px-6">{event.organizer}</td><td className="px-5 py-4 text-slate-500 sm:px-6">{event.submittedAt}</td><td className="px-5 py-4 sm:px-6"><span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-700"><span className="size-1 rounded-full bg-amber-500" />Chờ duyệt</span></td><td className="px-5 py-4 sm:px-6"><button onClick={() => openEvent(event)} aria-label={`Xem ${event.name}`} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700">Xem<ChevronRight size={13} aria-hidden="true" /></button></td></tr>; })}{filtered.length === 0 && <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">Không tìm thấy sự kiện phù hợp.</td></tr>}</tbody></table></div><p className="border-t border-slate-100 px-6 py-3 text-[10px] text-slate-400">Hiển thị {filtered.length} sự kiện mẫu trong hàng đợi.</p>
    </Panel>
<PreviewDialog details={details} onClose={() => setDetails(null)} /></>;
}
