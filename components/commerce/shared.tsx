'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/auth.store';
import { RequireAuth } from '@/lib/auth/RequireAuth';
import { SiteShell } from '@/components/layout/SiteShell';
import { ArrowRightLeft, ShoppingBag, Ticket, UserRound } from 'lucide-react';

export function CustomerPage({ title, children, publicView = false }: { title: string; children: ReactNode; publicView?: boolean }) {
  const revision = useAuthStore(state => state.revision);
  const pathname = usePathname();
  if (pathname.startsWith('/checkout/')) return <SiteShell><RequireAuth><div className="commerce mx-auto w-full max-w-7xl px-4 py-6 md:px-8"><div key={revision}>{children}</div></div></RequireAuth></SiteShell>;
  const content = <div className="commerce mx-auto w-full max-w-7xl space-y-7 px-4 py-6 md:px-8">
    <header className="border-b border-white/10 pb-6"><p className="mb-2 text-xs font-semibold text-[#d2adff]">TICKETVERSE / TÀI KHOẢN</p><h1 className="text-balance text-3xl font-bold">{title}</h1><p className="mt-3 text-sm tv-muted">Những cuộc hẹn, tấm vé và giao dịch của bạn.</p></header>
    <div className="grid items-start gap-7 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="tv-panel min-w-0 lg:sticky lg:top-28"><p className="mb-4 flex items-center gap-3 font-semibold"><UserRound size={21} aria-hidden="true" />Tài khoản của bạn</p><nav aria-label="Mua và quản lý vé" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col">{[
        { href: '/account', label: 'Hồ sơ cá nhân', Icon: UserRound },
        { href: '/account/tickets', label: 'Vé của tôi', Icon: Ticket },
        { href: '/account/orders', label: 'Đơn mua vé', Icon: ShoppingBag },
        { href: '/account/resale', label: 'Giao dịch bán lại', Icon: ArrowRightLeft },
      ].map(({ href, label, Icon }) => { const active = pathname === href || (href !== '/account' && pathname.startsWith(`${href}/`)); return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`tv-button shrink-0 justify-start ${active ? 'tv-primary' : 'border-transparent'}`}><Icon size={18} aria-hidden="true" />{label}</Link>; })}</nav><Link className="mt-4 hidden border-t border-white/10 pt-4 text-sm text-[#d2adff] lg:block" href="/pass">Khám phá chợ vé bán lại</Link></aside>
      <div className="min-w-0" key={publicView ? 'public' : revision}>{children}</div>
    </div>
  </div>;
  return <SiteShell>{publicView ? content : <RequireAuth>{content}</RequireAuth>}</SiteShell>;
}
const labels: Record<string, string> = {
  ACTIVE: 'Có hiệu lực', CANCELLED: 'Đã hủy', PENDING_PAYMENT: 'Chờ thanh toán', PAID: 'Đã thanh toán',
  EXPIRED: 'Đã hết hạn', PAYMENT_FAILED: 'Thanh toán thất bại', AVAILABLE: 'Đang bán lại', RESERVED: 'Đang được giữ', SOLD: 'Đã chuyển nhượng',
};
export function Status({ value }: { value: string }) {
  const positive = ['ACTIVE', 'PAID', 'AVAILABLE', 'SOLD'].includes(value);
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${positive ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-amber-300/30 bg-amber-300/10 text-amber-100'}`}>{labels[value] || value}</span>;
}
export function useClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  return now;
}
export function Empty({ text, href = '/events', action = 'Khám phá sự kiện' }: { text: string; href?: string; action?: string }) {
  return <div className="tv-panel space-y-5 py-12 text-center"><p className="text-lg tv-muted">{text}</p><Link className="tv-button tv-primary" href={href}>{action}</Link></div>;
}
