'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { moderatorMenu } from '../_lib/moderator-menu';

export function ModeratorBreadcrumb() {
  const pathname = usePathname();
  const label = moderatorMenu.find(item => item.href === pathname)?.label
    ?? (pathname.startsWith('/moderator/events/') ? 'Chi tiết sự kiện' : 'Moderator');
  return <nav aria-label="Breadcrumb" className="text-sm text-slate-400"><Link href="/moderator/dashboard" className="hover:text-violet-600">Workspace</Link><span className="mx-2 text-slate-300">/</span><span aria-current="page" className="font-medium text-slate-700">{label}</span></nav>;
}
