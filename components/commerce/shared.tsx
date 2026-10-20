'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/auth.store';
import { RequireAuth } from '@/lib/auth/RequireAuth';
import { SiteShell } from '@/components/layout/SiteShell';
import { CommercePage } from '@/components/ui/commerce';

export function CustomerPage({ title, children, publicView = false }: { title: string; children: ReactNode; publicView?: boolean }) {
  const revision = useAuthStore(state => state.revision);
  const pathname = usePathname();
  const content = <CommercePage title={title}><nav aria-label="Mua và quản lý vé" className="flex flex-wrap gap-2">{[
    ['/account/tickets', 'Vé của tôi'], ['/account/orders', 'Đơn mua vé'], ['/account/resale', 'Giao dịch bán lại'], ['/pass', 'Chợ vé'],
  ].map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} className={`tv-button ${pathname === href ? 'tv-primary' : ''}`}>{label}</Link>)}</nav><div key={publicView ? 'public' : revision}>{children}</div></CommercePage>;
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
