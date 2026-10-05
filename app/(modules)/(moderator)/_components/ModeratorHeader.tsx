'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Bell, Menu, X, ChevronDown, CircleHelp } from 'lucide-react';
import { ModeratorBreadcrumb } from './ModeratorBreadcrumb';

export function ModeratorHeader({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (open: boolean) => void }) {
  const [popover, setPopover] = useState<'notifications' | 'profile' | 'help' | null>(null);
  const toggle = (value: typeof popover) => setPopover(popover === value ? null : value);
  return (
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3"><button aria-label="Mở menu điều hướng" aria-expanded={mobileOpen} aria-controls="moderator-sidebar" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"><Menu size={21} /></button><ModeratorBreadcrumb /></div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700 xl:flex"><span className="size-1.5 rounded-full bg-emerald-500" />Hệ thống ổn định</span>
            <button aria-label="Hướng dẫn giao diện" aria-expanded={popover === 'help'} onClick={() => toggle('help')} className="hidden rounded-lg p-2 text-slate-400 hover:bg-slate-50 sm:block"><CircleHelp size={20} /></button>
            <button aria-label="Thông báo, 3 thông báo mới" aria-expanded={popover === 'notifications'} onClick={() => toggle('notifications')} className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-50"><Bell size={20} /><span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-white bg-violet-500" /></button>
            <span className="h-7 w-px bg-slate-100" />
            <button aria-label="Tài khoản Moderator" aria-expanded={popover === 'profile'} onClick={() => toggle('profile')} className="flex items-center gap-2.5 rounded-lg p-1 text-left"><span className="flex size-9 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">MA</span><span className="hidden sm:block"><span className="block text-xs font-semibold">Minh Anh</span><span className="block text-[10px] text-slate-400">Moderator</span></span><ChevronDown size={14} className="text-slate-400" /></button>
          </div>
          {popover && <><button tabIndex={-1} aria-label="Đóng bảng thông tin" className="fixed inset-0 z-[-1] cursor-default" onClick={() => setPopover(null)} /><div className="absolute right-4 top-[70px] w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:right-8">
            <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">{popover === 'notifications' ? 'Thông báo mới' : popover === 'profile' ? 'Tài khoản Moderator' : 'Hướng dẫn'}</h2><button aria-label="Đóng" onClick={() => setPopover(null)} className="rounded p-1 hover:bg-slate-100"><X size={16} /></button></div>
            {popover === 'notifications' ? <div className="mt-4 space-y-3">{['Có sự kiện mới cần xét duyệt', 'Phát hiện một lượt check-in trùng', 'Có báo cáo mới từ người dùng'].map((item, i) => <Link key={item} href={i === 0 ? '/moderator/events' : i === 1 ? '/moderator/check-in' : '/moderator/reports'} onClick={() => setPopover(null)} className="block rounded-lg bg-slate-50 p-3 text-xs leading-5 hover:bg-violet-50">{item}</Link>)}</div> : <p className="mt-3 text-xs leading-6 text-slate-500">{popover === 'profile' ? 'Minh Anh · Moderator. Thông tin tài khoản đang dùng dữ liệu mẫu.' : 'Dùng menu bên trái để chuyển trang. Bạn có thể tìm kiếm, lọc danh sách và mở chi tiết. Các số liệu hiện là dữ liệu minh họa.'}</p>}
          </div></>}
        </header>

  );
}
