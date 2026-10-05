import Link from 'next/link';
import { ArrowUpRight, Clock3, CalendarDays, ScanLine } from 'lucide-react';

export function EventSummary() { return (
    <div className="grid gap-4 sm:grid-cols-3">
      {[{ label: 'Sự kiện chờ duyệt', value: '12', note: '4 sự kiện mới trong hôm nay', icon: Clock3, style: 'bg-amber-50 text-amber-600', href: '/moderator/events', trend: 'Cần xem xét' },
        { label: 'Sự kiện đang diễn ra', value: '5', note: 'Mọi hoạt động đang ổn định', icon: CalendarDays, style: 'bg-violet-50 text-violet-600', href: '/moderator/events', trend: 'Đang hoạt động' },
        { label: 'Lượt check-in hôm nay', value: '650', note: '+18% so với ngày hôm qua', icon: ScanLine, style: 'bg-emerald-50 text-emerald-600', href: '/moderator/check-in', trend: '+18%' }].map(({ label, value, note, icon: Icon, style, href, trend }) => <Link key={label} href={href} className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-shadow hover:shadow-md sm:p-6"><div className="flex items-center justify-between"><span className={`flex size-10 items-center justify-center rounded-xl ${style}`}><Icon size={20} aria-hidden="true" /></span><ArrowUpRight size={17} className="text-slate-300 transition-colors group-hover:text-violet-500" aria-hidden="true" /></div><p className="mt-5 text-xs font-medium text-slate-500">{label}</p><div className="mt-1.5 flex items-center gap-3"><span className="text-3xl font-bold tracking-tight">{value}</span><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${style}`}>{trend}</span></div><p className="mt-3 text-[11px] text-slate-400">{note}</p></Link>)}
    </div>

); }
