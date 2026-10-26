import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
export function SiteShell({ children }: { children: ReactNode }) {
  return <div className="tv-site flex min-h-dvh flex-col"><a href="#main-content" className="tv-skip-link">Đến nội dung chính</a><Navbar /><main id="main-content" className="min-w-0 flex-1">{children}</main><Footer /></div>;
}
