import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SiteShell } from '@/components/layout/SiteShell';
import { CategoryNav, EventGrid, HomeCollections } from './EventDiscovery';
import { PromoCarousel } from './PromoCarousel';

export function HomePage() {
  return <SiteShell><div className="mx-auto max-w-7xl px-4 md:px-8">
    <CategoryNav />
    <h1 className="sr-only">TicketVerse — Khám phá và đặt vé sự kiện</h1>
    <div className="pt-6"><PromoCarousel /></div>
    <EventGrid home />
    <HomeCollections />
    <section className="relative mb-4 mt-8 flex flex-col gap-6 overflow-hidden rounded-2xl border border-[#6c498c] bg-[#241830] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div><p className="mb-3 text-xs font-bold text-[#cfb1f1]">DÀNH CHO BAN TỔ CHỨC</p><h2 className="text-balance text-2xl font-bold sm:text-3xl">Biến ý tưởng thành điểm hẹn.</h2><p className="mt-3 max-w-xl text-pretty text-sm leading-6 tv-muted">Tạo sự kiện, thiết lập lịch diễn và quản lý hạng vé cùng TicketVerse.</p></div>
      <Link href="/organizer" className="tv-button shrink-0 border-[#b889e1] bg-[#3b2450]">Không gian ban tổ chức <ArrowUpRight size={18} /></Link>
    </section>
  </div></SiteShell>;
}
