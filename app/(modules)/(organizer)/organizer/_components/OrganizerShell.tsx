'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { ArrowUpRight, Building2, CalendarDays, ChartNoAxesCombined, ChevronDown, Menu, Ticket, Wallet, X } from 'lucide-react';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import './organizer.css';

export function OrganizerShell({ organizerId, name, children, sidebar }: {
  organizerId?: string;
  name?: string;
  children: ReactNode;
  sidebar?: ReactNode;
}) {
  const pathname = usePathname();
  const { params } = useUrlFilters();
  const [menuOpen, setMenuOpen] = useState(false);
  const base = `/organizer/${organizerId}`;
  const payout = params.get('tab') === 'payout';
  const links = [
    { href: `${base}/events`, label: 'Sự kiện của tôi', icon: CalendarDays, active: pathname.startsWith(`${base}/events`) },
    { href: base, label: 'Báo cáo bán vé', icon: ChartNoAxesCombined, active: pathname === base },
    { href: `${base}/settings`, label: 'Hồ sơ ban tổ chức', icon: Building2, active: pathname === `${base}/settings` && !payout },
    { href: `${base}/settings?tab=payout`, label: 'Tài khoản nhận tiền', icon: Wallet, active: pathname === `${base}/settings` && payout },
  ];

  return <div className="tv-organizer org-shell">
    <a className="tv-skip-link" href="#organizer-content">Đến nội dung chính</a>
    <header className="org-header">
      <Link href="/organizer" className="org-brand"><Ticket size={27} aria-hidden="true" /><span>TicketVerse<small>Organizer Center</small></span></Link>
      <div className="org-header-actions"><span className="org-header-label">Không gian nhà tổ chức</span><Link href="/" className="tv-button">Trang chủ <ArrowUpRight size={16} aria-hidden="true" /></Link><button type="button" className="tv-icon-button org-menu-toggle" aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={menuOpen} aria-controls="organizer-sidebar" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button></div>
    </header>
    <div className="org-layout">
      <aside id="organizer-sidebar" className={`org-sidebar ${menuOpen ? 'is-open' : ''}`}>
        <Link href="/organizer?choose=1" className="org-organization" onClick={() => setMenuOpen(false)}><span className="org-organization-icon"><Building2 size={20} aria-hidden="true" /></span><span><small>BAN TỔ CHỨC</small><strong>{name ?? 'Chọn ban tổ chức'}</strong></span><ChevronDown size={15} aria-hidden="true" /></Link>
        {organizerId && <nav aria-label="Quản lý ban tổ chức" className="org-navigation">{links.map(({ href, label, icon: Icon, active }) => <Link key={href} href={href} aria-current={active ? 'page' : undefined} className="org-nav-item" onClick={() => setMenuOpen(false)}><Icon size={18} aria-hidden="true" />{label}</Link>)}</nav>}
        {sidebar}
        <div className="org-sidebar-note"><Ticket size={19} aria-hidden="true" /><p>Từ ý tưởng đến sự kiện.<span>Quản lý thông tin, lịch diễn và vé tại một nơi.</span></p></div>
      </aside>
      <main id="organizer-content" tabIndex={-1} className="org-main">{children}</main>
    </div>
  </div>;
}
