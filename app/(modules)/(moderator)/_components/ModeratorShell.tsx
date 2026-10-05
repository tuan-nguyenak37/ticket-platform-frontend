'use client';
import { useState, type ReactNode } from 'react';
import { ModeratorSidebar } from './ModeratorSidebar';
import { ModeratorHeader } from './ModeratorHeader';

export function ModeratorShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="min-h-screen bg-[#f6f7fb] text-slate-900 [color-scheme:light]">
    <a href="#moderator-content" className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:rounded-lg focus:bg-white focus:p-3">Đến nội dung chính</a>
    {mobileOpen && <button aria-label="Đóng menu điều hướng" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" />}
    <ModeratorSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
    <div className="lg:pl-64"><ModeratorHeader mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} /><main id="moderator-content" className="mx-auto max-w-[1600px] p-4 sm:p-8">{children}</main></div>
  </div>;
}
