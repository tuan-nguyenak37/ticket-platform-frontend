'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Ticket, Search, UserRound, LogOut, LayoutDashboard, Compass, Plus, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/lib/auth/auth.store';
import { useAuthUi } from '@/lib/auth/auth-ui.store';
import { logoutSession } from '@/lib/auth/session';

export function Navbar() {
  const router = useRouter(); const pathname = usePathname();
  const [query, setQuery] = useState(''); const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false); const [error, setError] = useState('');
  const menuRef = useRef<HTMLDivElement>(null); const triggerRef = useRef<HTMLButtonElement>(null); const searchRef = useRef<HTMLInputElement>(null);
  const status = useAuthStore(state => state.status); const user = useAuthStore(state => state.user);
  const showAuth = useAuthUi(state => state.show);
  const name = user?.full_name || 'Tài khoản';
  const authenticated = status === 'authenticated';
  useEffect(() => {
    function outside(e: MouseEvent) { if (!menuRef.current?.contains(e.target as Node)) setAccountOpen(false); }
    function keyboard(e: KeyboardEvent) {
      if (e.key === 'Escape' && accountOpen) { setAccountOpen(false); triggerRef.current?.focus(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchRef.current?.focus(); }
    }
    document.addEventListener('click', outside); document.addEventListener('keydown', keyboard);
    return () => { document.removeEventListener('click', outside); document.removeEventListener('keydown', keyboard); };
  }, [accountOpen]);
  function search(e: FormEvent<HTMLFormElement>) { e.preventDefault(); router.push(`/events${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`); }
  async function logout() {
    setLoggingOut(true); setError('');
    try { await logoutSession(); setAccountOpen(false); } catch { setError('Chưa thể đăng xuất. Vui lòng thử lại.'); }
    finally { setLoggingOut(false); }
  }
  const links = [
    { href: '/account/tickets', label: 'Vé của tôi', icon: Ticket },
    { href: '/pass', label: 'Bán lại vé', icon: Compass },
    { href: '/organizer', label: 'Tạo sự kiện', icon: Plus },
  ];
  return <>
    <header className="tv-header commerce"><div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 md:px-8 lg:flex-nowrap">
      <Link href="/" aria-label="TicketVerse — Trang chủ" className="flex items-center gap-2.5 text-xl font-semibold tracking-tight"><span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500"><Ticket size={23} /></span>TicketVerse<span className="-ml-2 text-fuchsia-300">.</span></Link>
      <form role="search" onSubmit={search} className="relative order-3 w-full lg:order-none lg:ml-5 lg:max-w-sm lg:flex-1"><Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 tv-muted" /><label className="sr-only" htmlFor="site-search">Tìm kiếm sự kiện</label><input ref={searchRef} id="site-search" type="search" maxLength={255} value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm kiếm sự kiện" className="tv-input !mt-0 !pl-10 !pr-16" /><button className="absolute right-1 top-1/2 min-h-11 -translate-y-1/2 rounded-lg px-3 text-sm font-semibold" type="submit">Tìm</button></form>
      <nav className="ml-auto hidden shrink-0 items-center gap-1 lg:flex" aria-label="Điều hướng chính">{links.map(link => <Link key={link.href} href={link.href} className={`tv-nav-link ${pathname.startsWith(link.href) ? 'active' : ''}`} aria-current={pathname.startsWith(link.href) ? 'page' : undefined}>{link.label}</Link>)}</nav>
      <div className="relative ml-auto lg:ml-0" ref={menuRef} onBlur={e => { if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) setAccountOpen(false); }}>
        <button ref={triggerRef} type="button" className="tv-button" disabled={status === 'restoring'} aria-expanded={accountOpen} aria-controls="account-menu" onClick={() => { if (authenticated) setAccountOpen(!accountOpen); else showAuth(); }}><UserRound size={18} /><span className="max-w-28 truncate">{status === 'restoring' ? 'Đang tải…' : authenticated ? name : 'Đăng nhập'}</span></button>
        {accountOpen && authenticated && <div id="account-menu" className="tv-account-menu"><div className="border-b border-white/10 px-3 pb-3"><p className="font-semibold">{name}</p><p className="mt-1 truncate text-sm tv-muted">{user?.email}</p></div><nav className="mt-2 grid" aria-label="Tài khoản"><Link className="tv-nav-link" href="/account" onClick={() => setAccountOpen(false)}><UserRound size={18} />Hồ sơ cá nhân</Link><Link className="tv-nav-link" href="/account/tickets" onClick={() => setAccountOpen(false)}><Ticket size={18} />Vé của tôi</Link><Link className="tv-nav-link" href="/account/orders" onClick={() => setAccountOpen(false)}><Ticket size={18} />Đơn mua vé</Link><Link className="tv-nav-link" href="/account/resale" onClick={() => setAccountOpen(false)}><Ticket size={18} />Giao dịch bán lại</Link><Link className="tv-nav-link" href="/organizer" onClick={() => setAccountOpen(false)}><LayoutDashboard size={18} />Ban tổ chức</Link>{user?.role === 'MODERATOR' && <Link className="tv-nav-link" href="/moderator/events" onClick={() => setAccountOpen(false)}><LayoutDashboard size={18} />Kiểm duyệt</Link>}{user?.role === 'ADMIN' && <Link className="tv-nav-link" href="/admin" onClick={() => setAccountOpen(false)}><ShieldCheck size={18} />Quản trị hệ thống</Link>}<button className="tv-nav-link text-left" disabled={loggingOut} onClick={() => void logout()}><LogOut size={18} />{loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</button></nav>{error && <p role="alert" className="p-3 text-sm text-rose-200">{error}</p>}</div>}
      </div>

    </div>{error && <div role="alert" className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 pb-3 text-sm text-rose-200"><span>{error}</span><button className="tv-button" disabled={loggingOut} onClick={() => void logout()}>Thử đăng xuất lại</button></div>}</header>
    <nav className="tv-mobile-nav" aria-label="Điều hướng trên điện thoại"><Link href="/" aria-current={pathname === '/' ? 'page' : undefined}><Compass size={21} /><span>Trang chủ</span></Link><Link href="/pass" aria-current={pathname.startsWith('/pass') ? 'page' : undefined}><Ticket size={21} /><span>Bán lại vé</span></Link><Link href="/account/tickets" aria-current={pathname.startsWith('/account/tickets') ? 'page' : undefined}><Ticket size={21} /><span>Vé của tôi</span></Link><Link href="/account" aria-current={pathname === '/account' ? 'page' : undefined}><UserRound size={21} /><span>Tài khoản</span></Link></nav>
  </>;
}


