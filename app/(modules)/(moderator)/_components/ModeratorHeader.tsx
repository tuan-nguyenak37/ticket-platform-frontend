'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown, CircleHelp } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { ModeratorBreadcrumb } from './ModeratorBreadcrumb';

export function ModeratorHeader({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (open: boolean) => void }) {
  const [popover, setPopover] = useState<'profile' | 'help' | null>(null);
  const user = useAuthStore(state => state.user);
  const name = user?.fullName || user?.email?.split('@')[0] || 'Chưa đăng nhập';
  const role = user?.role === 'admin' ? 'Admin' : user?.role === 'moderator' ? 'Moderator' : 'Tài khoản';
  const toggle = (value: typeof popover) => setPopover(popover === value ? null : value);
  return <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-8">
    <div className="flex min-w-0 items-center gap-3"><button aria-label="Mở menu điều hướng" aria-expanded={mobileOpen} aria-controls="moderator-sidebar" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"><Menu size={21} /></button><ModeratorBreadcrumb /></div>
    <div className="flex items-center gap-2 sm:gap-4"><button aria-label="Hướng dẫn giao diện" aria-expanded={popover === 'help'} onClick={() => toggle('help')} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"><CircleHelp size={20} /></button><button aria-label={`Tài khoản ${role}`} aria-expanded={popover === 'profile'} onClick={() => toggle('profile')} className="flex items-center gap-2 rounded-lg p-1 text-left"><span className="flex size-9 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{name.slice(0, 2).toUpperCase()}</span><span className="hidden sm:block"><span className="block max-w-36 truncate text-xs font-semibold">{name}</span><span className="block text-[10px] text-slate-500">{role}</span></span><ChevronDown size={14} /></button></div>
    {popover && <><button tabIndex={-1} aria-label="Đóng bảng thông tin" className="fixed inset-0 z-[-1] cursor-default" onClick={() => setPopover(null)} /><div className="absolute right-4 top-[70px] w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:right-8"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">{popover === 'profile' ? 'Tài khoản hiện tại' : 'Hướng dẫn'}</h2><button aria-label="Đóng" onClick={() => setPopover(null)} className="rounded p-1 hover:bg-slate-100"><X size={16} /></button></div><p className="mt-3 break-words text-xs leading-6 text-slate-600">{popover === 'profile' ? `${name} · ${role}` : 'Dùng mục Vé để kiểm tra PDF và duyệt thông tin; mục Đơn hàng để xem xét tranh chấp. Admin và Moderator có quyền xử lý nhưng không được tự xử lý giao dịch của mình.'}</p><Link className="mr-4 mt-3 inline-block text-sm text-violet-700" href="/dashboard/profile">Hồ sơ cá nhân</Link><Link className="mt-3 inline-block text-sm text-violet-700" href="/tickets">Về sàn vé</Link></div></>}
  </header>;
}
