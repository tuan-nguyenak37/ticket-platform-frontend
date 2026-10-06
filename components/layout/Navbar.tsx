'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ticket, Search, UserRound, ChevronDown, LogOut, ArrowUpRight, LayoutDashboard, LoaderCircle, X } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { logoutSession } from '@/lib/auth/session';
import { AuthModal } from '@/components/auth';

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300';
const action = `inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white/80 transition-all duration-300 hover:text-white ${focus} motion-reduce:transition-none`;

export function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const status = useAuthStore(state => state.status);
  const user = useAuthStore(state => state.user);
  const authenticated = status === 'authenticated' && Boolean(user);
  const name = user?.fullName || user?.email?.split('@')[0] || 'Tài khoản';

  useEffect(() => {
    function outside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setAccountOpen(false);
    }
    function keyboard(event: KeyboardEvent) {
      if (event.key === 'Escape') setAccountOpen(false);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); searchRef.current?.focus();
      }
    }
    document.addEventListener('click', outside);
    document.addEventListener('keydown', keyboard);
    return () => { document.removeEventListener('click', outside); document.removeEventListener('keydown', keyboard); };
  }, []);

  function openAuth(nextMode: 'login' | 'register' = 'login') {
    setMode(nextMode); setAuthOpen(true); setAccountOpen(false);
  }
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (value) router.push(`/events?q=${encodeURIComponent(value)}`);
    else searchRef.current?.focus();
  }
  async function logout() {
    setLoggingOut(true); setError(null);
    try { await logoutSession(); setAccountOpen(false); }
    catch { setError('Chưa thể hoàn tất đăng xuất. Vui lòng thử lại.'); }
    finally { setLoggingOut(false); }
  }

  return <>
    <header style={{ fontFamily: '"Segoe UI", Arial, sans-serif' }} className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r from-slate-950/95 via-[#17102c]/95 to-slate-950/95 px-4 backdrop-blur-xl md:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 py-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-8 lg:py-5">
        <Link href="/" aria-label="TicketVerse — Trang chủ" className={`group flex w-fit items-center gap-2.5 rounded-2xl ${focus}`}><span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-violet-500/40 motion-reduce:transition-none"><Ticket size={22} aria-hidden="true" /></span><span className="text-xl font-semibold tracking-tight text-white sm:text-2xl">TicketVerse<span className="text-fuchsia-300">.</span></span></Link>
        <form role="search" onSubmit={search} className="relative col-span-2 row-start-2 w-full lg:col-span-1 lg:col-start-2 lg:row-start-1"><label htmlFor="home-search" className="sr-only">Tìm kiếm sự kiện</label><Search size={18} aria-hidden="true" className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/60" /><input ref={searchRef} id="home-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Bạn muốn tìm sự kiện nào?" className="w-full rounded-2xl border border-white/20 bg-white/10 py-3.5 pl-12 pr-24 text-sm text-white outline-none backdrop-blur-xl transition-all duration-300 placeholder:text-white/40 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 motion-reduce:transition-none" /><button type="submit" className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white ${focus}`} aria-label="Tìm sự kiện">Tìm kiếm</button></form>
        <nav aria-label="Tài khoản và vé" className="col-start-2 row-start-1 flex items-center gap-1 lg:col-start-3">
          {authenticated ? <Link href="/organizer/create" className={`${action} hidden sm:inline-flex`}>Đăng vé<ArrowUpRight size={15} aria-hidden="true" /></Link> : <button type="button" onClick={() => openAuth()} className={`${action} hidden sm:inline-flex`}>Đăng vé<ArrowUpRight size={15} aria-hidden="true" /></button>}
          {authenticated ? <Link href="/dashboard/tickets" className={`${action} hidden sm:inline-flex`}><Ticket size={17} aria-hidden="true" />Vé của tôi</Link> : <button type="button" onClick={() => openAuth()} className={`${action} hidden sm:inline-flex`}><Ticket size={17} aria-hidden="true" />Vé của tôi</button>}
          <span className="mx-2 hidden h-6 w-px bg-white/15 sm:block" />
          <div ref={menuRef} className="relative">
            <button type="button" disabled={status === 'restoring'} aria-label={authenticated ? `Tài khoản ${name}` : 'Đăng nhập hoặc đăng ký'} aria-expanded={accountOpen} aria-controls="public-account-panel" onClick={() => authenticated ? setAccountOpen(!accountOpen) : openAuth()} className={`flex items-center gap-2 rounded-2xl border border-white/20 px-3 py-2.5 text-white transition-all duration-300 hover:border-violet-400/50 disabled:opacity-60 ${focus} motion-reduce:transition-none`}>
              {status === 'restoring' ? <LoaderCircle size={20} className="motion-safe:animate-spin" aria-hidden="true" /> : authenticated ? <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-xs font-semibold">{name[0].toUpperCase()}</span> : <UserRound size={20} aria-hidden="true" />}<span className="hidden max-w-24 truncate text-sm xl:block">{authenticated ? name : 'Đăng nhập'}</span><ChevronDown size={14} aria-hidden="true" className="text-white/60" />
            </button>
            {accountOpen && <div id="public-account-panel" className="absolute right-0 top-full mt-3 w-64 rounded-3xl border border-white/20 bg-gradient-to-r from-[#17112a] to-slate-950 p-3 text-sm shadow-2xl shadow-violet-500/20"><div className="border-b border-white/10 px-3 pb-3 pt-2"><p className="font-medium text-white">{name}</p><p className="mt-1 truncate text-xs text-white/70">{user?.email}</p></div><Link href="/dashboard" onClick={() => setAccountOpen(false)} className={`${action} mt-2 w-full justify-start`}><UserRound size={17} />Hồ sơ cá nhân</Link><Link href="/dashboard/tickets" onClick={() => setAccountOpen(false)} className={`${action} w-full justify-start`}><Ticket size={17} />Vé của tôi</Link><Link href="/organizer/create" onClick={() => setAccountOpen(false)} className={`${action} w-full justify-start sm:hidden`}><ArrowUpRight size={17} />Đăng vé</Link>{(user?.role === 'moderator' || user?.role === 'admin') && <Link href="/moderator/dashboard" onClick={() => setAccountOpen(false)} className={`${action} w-full justify-start`}><LayoutDashboard size={17} />Không gian kiểm duyệt</Link>}<button type="button" disabled={loggingOut} onClick={() => void logout()} className={`${action} mt-2 w-full justify-start border-t border-white/10 text-rose-200 disabled:opacity-60`}><LogOut size={17} />{loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</button></div>}
          </div>
        </nav>
      </div>
      {error && <div role="alert" className="mx-auto flex max-w-7xl items-center justify-between gap-3 pb-3 text-sm text-rose-200"><span>{error}</span><div className="flex gap-2"><button onClick={() => void logout()} disabled={loggingOut} className={`rounded-2xl px-3 py-2 font-medium ${focus}`}>Thử lại</button><button aria-label="Đóng thông báo lỗi" onClick={() => setError(null)} className={`rounded-2xl px-3 py-2 ${focus}`}><X size={16} /></button></div></div>}
    </header>
    <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode={mode} />
  </>;
}
