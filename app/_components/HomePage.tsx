import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SiteShell } from '@/components/layout/SiteShell';
import { CategoryNav, EventGrid } from './EventDiscovery';
import { PromoCarousel } from './PromoCarousel';

export function HomePage() {
  return <SiteShell><div className="mx-auto max-w-7xl px-4 md:px-8">
    <CategoryNav />
    <div className="pb-2 pt-6 sm:pt-8"><PromoCarousel /></div>
    <EventGrid home />
    <section className="relative mb-4 flex flex-col gap-6 overflow-hidden rounded-3xl border border-[#6c498c] bg-[#241830] p-7 sm:flex-row sm:items-center sm:justify-between sm:p-10">
      <div><p className="mb-3 text-xs font-bold tracking-[.2em] text-[#cfb1f1]">DÀNH CHO BAN TỔ CHỨC</p><h2 className="text-2xl font-bold sm:text-3xl">Biến ý tưởng thành điểm hẹn.</h2><p className="mt-3 max-w-xl text-sm leading-6 tv-muted">Tạo sự kiện, thiết lập lịch diễn và quản lý hạng vé cùng TicketVerse.</p></div>
      <Link href="/organizer" className="tv-button shrink-0 border-[#b889e1] bg-[#3b2450]">Không gian ban tổ chức <ArrowUpRight size={18} /></Link>
    </section>
  </div></SiteShell>;
}
