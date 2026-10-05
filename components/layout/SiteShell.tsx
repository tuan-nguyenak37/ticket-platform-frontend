'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AmbientGlow } from './AmbientGlow';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/moderator' || pathname.startsWith('/moderator/')) return children;
  return <><AmbientGlow /><Navbar /><main className="flex-1 relative z-10 flex flex-col">{children}</main><Footer /></>;
}
