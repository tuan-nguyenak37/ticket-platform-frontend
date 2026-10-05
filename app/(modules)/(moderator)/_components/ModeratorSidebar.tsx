'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Ticket, X, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { moderatorMenu } from '../_lib/moderator-menu';

export function ModeratorSidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (open: boolean) => void }) {
  const pathname = usePathname();
  return (
      <aside id="moderator-sidebar" className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-20 items-center gap-3 px-6">
          <Link href="/moderator/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
            <span className="flex size-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-200"><Ticket size={22} aria-hidden="true" /></span>
            <span className="text-xl font-bold tracking-tight">ticket<span className="text-violet-600">verse</span><span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.24em] text-slate-400">Moderator workspace</span></span>
          </Link>
          <button className="ml-auto lg:hidden" aria-label="Đóng menu" onClick={() => setMobileOpen(false)}><X size={20} /></button>
        </div>
        <div className="mx-5 mt-5 flex items-center gap-2 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2.5 text-xs font-medium text-violet-700"><ShieldCheck size={16} aria-hidden="true" />Không gian kiểm duyệt</div>
        <p className="mb-3 mt-7 px-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Quản lý nền tảng</p>
        <nav aria-label="Điều hướng Moderator" className="space-y-1 px-3">
          {moderatorMenu.map(({ href, label, icon: Icon, badge }) => {
            const selected = pathname === href;
            return <Link key={href} href={href} aria-current={selected ? 'page' : undefined} onClick={() => { setMobileOpen(false); }} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${selected ? 'bg-violet-600 font-semibold text-white shadow-md shadow-violet-200/60' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
              <Icon size={19} strokeWidth={selected ? 2 : 1.7} aria-hidden="true" />{label}{badge && <span className={`ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${selected ? 'bg-white/20 text-white' : 'bg-violet-50 text-violet-600'}`}>{badge}</span>}
            </Link>;
          })}
        </nav>
        <div className="mt-auto p-5">
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-700">Cùng giữ trải nghiệm an toàn</p><p className="mt-1.5 text-xs leading-5 text-slate-400">Mỗi lượt kiểm duyệt giúp cộng đồng sự kiện tốt hơn.</p><Link href="/" className="mt-3 flex items-center gap-1 text-xs font-semibold text-violet-600">Xem nền tảng<ArrowUpRight size={14} aria-hidden="true" /></Link></div>
          <p className="mt-4 text-center text-[10px] text-slate-400">© 2026 TicketVerse</p>
        </div>
      </aside>

  );
}
