import { PinnedEventCarousel } from './PinnedEventCarousel';

export function HomePage() {
  return <div style={{ fontFamily: '"Segoe UI", Arial, sans-serif' }} className="relative isolate flex-1 overflow-hidden">
    <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-40 -z-10 size-[500px] rounded-full bg-violet-600/20 blur-3xl" />
    <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-20 -z-10 size-[450px] rounded-full bg-fuchsia-600/15 blur-3xl" />
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 md:px-8 md:pb-24 md:pt-8"><PinnedEventCarousel /><div className="mt-6 flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-white/70"><p>Âm nhạc, lễ hội và những trải nghiệm bạn không muốn bỏ lỡ.</p><span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-fuchsia-300" />Khám phá cùng TicketVerse</span></div></div>
  </div>;
}
