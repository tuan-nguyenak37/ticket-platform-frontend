'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Ticket,
  Search,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Music,
  Tent,
  Theater,
  Trophy,
  Lightbulb,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { logoutSession } from '@/lib/auth/session';
import { AuthModal } from '@/components/auth';

const EVENT_CATEGORIES = [
  { name: 'Concert & Âm nhạc', slug: 'music', icon: Music, color: 'text-violet-400' },
  { name: 'Lễ hội EDM & Festival', slug: 'festival', icon: Tent, color: 'text-fuchsia-400' },
  { name: 'Kịch & Sân khấu', slug: 'theater', icon: Theater, color: 'text-cyan-400' },
  { name: 'Thể thao & Giải đấu', slug: 'sports', icon: Trophy, color: 'text-amber-400' },
  { name: 'Hội thảo & Workshop', slug: 'workshop', icon: Lightbulb, color: 'text-emerald-400' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Quản lý Modal Đăng nhập / Đăng ký trực tiếp
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = status === 'authenticated' && Boolean(user);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logoutSession();
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setUserDropdownOpen(false);
        setCategoryDropdownOpen(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-white/10 px-4 md:px-8 transition-colors">
        <div className="max-w-7xl mx-auto h-20 flex items-center justify-between gap-4 lg:gap-8">
          {/* 1. Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform duration-300">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              TicketVerse
            </span>
          </Link>

          {/* 2. Quick Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md items-center">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-violet-400 transition-colors pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sự kiện, nghệ sĩ, concert..."
                className="w-full pl-11 pr-14 py-2.5 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl text-sm text-white placeholder:text-white/40 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all duration-300 outline-none"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <kbd className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white/10 border border-white/20 text-white/50">
                  Ctrl K
                </kbd>
              </div>
            </div>
          </div>

          {/* 3. Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 font-medium text-sm text-white/80">
            <Link
              href="/events"
              className="hover:text-white hover:scale-[1.02] transition-all duration-300"
            >
              Sự kiện
            </Link>

            {/* Dropdown Thể loại */}
            <div className="relative" data-dropdown>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCategoryDropdownOpen(!categoryDropdownOpen);
                  setUserDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 hover:text-white hover:scale-[1.02] transition-all duration-300 cursor-pointer"
              >
                <span>Thể loại</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${
                    categoryDropdownOpen ? 'rotate-180 text-violet-400' : ''
                  }`}
                />
              </button>

              {categoryDropdownOpen && (
                <div className="absolute left-0 mt-3 w-64 backdrop-blur-2xl bg-slate-900/95 border border-white/20 rounded-3xl p-3 shadow-2xl shadow-violet-500/30 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/50 border-b border-white/10 mb-1">
                    Danh mục nổi bật
                  </div>
                  {EVENT_CATEGORIES.map((cat) => {
                    const IconComponent = cat.icon;
                    return (
                      <Link
                        key={cat.slug}
                        href={`/events?category=${cat.slug}`}
                        onClick={() => setCategoryDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <IconComponent className={`w-4 h-4 ${cat.color}`} />
                        <span>{cat.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Nút Tạo sự kiện (Ban tổ chức) */}
            <Link
              href="/organizer/create"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl backdrop-blur-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 hover:text-white transition-all duration-300"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Tạo sự kiện</span>
            </Link>
          </nav>

          {/* 4. Auth & User Area */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Nút Vé của tôi */}
                <Link
                  href="/dashboard/tickets"
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white/90 hover:text-white hover:bg-white/20 transition-all duration-300 hover:scale-[1.02] text-sm font-medium"
                >
                  <Ticket className="w-4 h-4 text-violet-400" />
                  <span>Vé của tôi</span>
                </Link>

                {/* Chuông thông báo */}
                <button
                  type="button"
                  className="relative p-2.5 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300 cursor-pointer"
                  aria-label="Thông báo"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
                </button>

                {/* User Dropdown */}
                <div className="relative" data-dropdown>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserDropdownOpen(!userDropdownOpen);
                      setCategoryDropdownOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-violet-500/30">
                      {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
                    </div>
                    <span className="text-sm font-medium max-w-[110px] truncate text-white/90">
                      {user?.fullName || user?.email?.split('@')[0]}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-white/60 transition-transform duration-300 ${
                        userDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-60 backdrop-blur-2xl bg-slate-900/95 border border-white/20 rounded-3xl p-3 shadow-2xl shadow-violet-500/30 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-3 py-2 border-b border-white/10 mb-2">
                        <p className="text-xs text-white/50">Tài khoản</p>
                        <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-violet-400" />
                        <span>Hồ sơ cá nhân</span>
                      </Link>
                      <Link
                        href="/dashboard/tickets"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Ticket className="w-4 h-4 text-fuchsia-400" />
                        <span>Quản lý vé</span>
                      </Link>
                      <div className="pt-2 border-t border-white/10 mt-2">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm text-rose-300 hover:text-white hover:bg-rose-500/20 transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-400" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Nút Đăng nhập mở Modal */}
                <button
                  type="button"
                  onClick={() => openAuth('login')}
                  className="px-5 py-2.5 rounded-2xl font-medium transition-all duration-300 backdrop-blur-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:scale-[1.02] active:scale-95 text-sm cursor-pointer"
                >
                  Đăng nhập
                </button>
                {/* Nút Đăng ký mở Modal */}
                <button
                  type="button"
                  onClick={() => openAuth('register')}
                  className="px-5 py-2.5 rounded-2xl font-medium transition-all duration-300 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-95 text-sm cursor-pointer"
                >
                  Đăng ký ngay
                </button>
              </>
            )}
          </div>

          {/* 5. Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* 6. Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-6 border-t border-white/10 backdrop-blur-2xl bg-slate-950/95 animate-in fade-in duration-200">
            {/* Search Input on Mobile */}
            <div className="px-2 mb-5">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm sự kiện, concert..."
                  className="w-full pl-11 pr-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl text-sm text-white placeholder:text-white/40 focus:border-violet-500/50 outline-none"
                />
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col gap-1 font-medium text-white/80 mb-6 px-2">
              <Link
                href="/events"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-2xl hover:bg-white/10 hover:text-white transition-colors"
              >
                Sự kiện
              </Link>
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                Thể loại nổi bật
              </div>
              {EVENT_CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <Link
                    key={cat.slug}
                    href={`/events?category=${cat.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 rounded-2xl hover:bg-white/10 hover:text-white transition-colors text-sm"
                  >
                    <IconComponent className={`w-4 h-4 ${cat.color}`} />
                    <span>{cat.name}</span>
                  </Link>
                );
              })}
              <Link
                href="/organizer/create"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 mt-2 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-300"
              >
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>Dành cho Ban tổ chức: Tạo sự kiện</span>
              </Link>
            </div>

            {/* Auth Buttons on Mobile */}
            <div className="flex flex-col gap-3 pt-4 border-t border-white/10 px-2">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-medium backdrop-blur-xl bg-white/10 border border-white/20 text-white"
                  >
                    <UserIcon className="w-4 h-4 text-violet-400" />
                    <span>Hồ sơ ({user?.fullName || user?.email})</span>
                  </Link>
                  <Link
                    href="/dashboard/tickets"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-medium backdrop-blur-xl bg-white/10 border border-white/20 text-white"
                  >
                    <Ticket className="w-4 h-4 text-fuchsia-400" />
                    <span>Vé của tôi</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-medium bg-rose-500/20 border border-rose-500/30 text-rose-300 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => openAuth('login')}
                    className="px-6 py-3 rounded-2xl font-medium text-center backdrop-blur-xl bg-white/10 border border-white/20 text-white cursor-pointer"
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuth('register')}
                    className="px-6 py-3 rounded-2xl font-medium text-center bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-xl shadow-violet-500/25 cursor-pointer"
                  >
                    Đăng ký ngay
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 7. Modal Đăng nhập / Đăng ký Trực Tiếp Không Cần Chuyển Trang */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </>
  );
}
