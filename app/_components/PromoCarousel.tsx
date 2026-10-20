'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

const slides = [
  { image: '/images/banners/live-music.jpg', eyebrow: 'KHÁM PHÁ CÙNG TICKETVERSE', title: 'Sống trọn từng khoảnh khắc', text: 'Âm nhạc, ánh đèn và những cuộc gặp gỡ đáng nhớ.', alt: 'Khán giả hòa mình trong ánh đèn sân khấu' },
  { image: '/images/banners/live-stage.jpg', eyebrow: 'THẾ GIỚI SỰ KIỆN', title: 'Đêm nay, đi đâu?', text: 'Tìm một buổi diễn khiến bạn muốn kể lại mãi về sau.', alt: 'Nghệ sĩ biểu diễn trên sân khấu' },
  { image: '/images/banners/festival.jpg', eyebrow: 'CHỌN TRẢI NGHIỆM CỦA BẠN', title: 'Hẹn nhau ở hàng ghế đầu', text: 'Khám phá sự kiện mới và chọn điểm hẹn tiếp theo.', alt: 'Khán giả tham dự lễ hội âm nhạc' },
];

export function PromoCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (paused || stopped) return;
    const timer = window.setInterval(() => {
      if (!document.hidden && !motion.matches) setActive((current) => (current + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [paused, stopped]);

  const slide = slides[active];
  return (
    <section aria-label="Ảnh quảng bá TicketVerse" className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#211a32] shadow-[0_30px_80px_-35px_#12091c]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
      <div className="relative min-h-[420px] sm:min-h-[490px] lg:min-h-[540px]">
        {slides.map((item, index) => <Image key={item.image} src={item.image} alt={index === active ? item.alt : ''} fill priority={index === 0} sizes="(max-width: 768px) 100vw, 1280px" className={`object-cover transition-opacity duration-700 ${index === active ? 'opacity-100' : 'opacity-0'}`} aria-hidden={index !== active} />)}
        <div className="absolute inset-0 bg-gradient-to-r from-[#100d1be8] via-[#100d1b94] to-[#100d1b12] max-sm:bg-gradient-to-t max-sm:from-[#100d1bf5] max-sm:via-[#100d1b70] max-sm:to-transparent" />
        <div className="relative z-10 flex min-h-[420px] flex-col justify-end px-6 pb-24 pt-20 sm:min-h-[490px] sm:px-12 sm:pb-24 lg:min-h-[540px] lg:px-16">
          <p className="mb-4 text-xs font-bold tracking-[.22em] text-[#e2b9ff]">{slide.eyebrow}</p>
          <h1 className="max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">{slide.title}</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/90 sm:text-lg">{slide.text}</p>
          <Link href="/events" className="tv-button tv-primary mt-8 w-fit">Khám phá sự kiện <ArrowRight size={18} /></Link>
        </div>
      </div>
      <div className="absolute bottom-5 left-6 z-20 flex items-center gap-2 sm:left-12 lg:left-16" aria-label="Chọn banner">
        {slides.map((item, index) => <button key={item.image} type="button" onClick={() => setActive(index)} aria-label={`Banner ${index + 1}: ${item.title}`} aria-current={active === index ? 'true' : undefined} className={`h-11 min-w-11 rounded-full px-2 ${active === index ? 'text-white' : 'text-white/65'}`}><span className={`mx-auto block h-1.5 rounded-full transition-all ${active === index ? 'w-8 bg-white' : 'w-4 bg-white/50'}`} /></button>)}
      </div>
      <div className="absolute bottom-5 right-5 z-20 flex gap-2"><button type="button" className="tv-icon-button border-white/40 bg-black/35 text-white" aria-label={stopped ? 'Tự động chuyển banner' : 'Dừng chuyển banner'} onClick={() => setStopped(!stopped)}>{stopped ? <Play size={17} /> : <Pause size={17} />}</button><button type="button" className="tv-icon-button border-white/40 bg-black/35 text-white" aria-label="Banner trước" onClick={() => setActive((active + slides.length - 1) % slides.length)}><ChevronLeft size={20} /></button><button type="button" className="tv-icon-button border-white/40 bg-black/35 text-white" aria-label="Banner tiếp theo" onClick={() => setActive((active + 1) % slides.length)}><ChevronRight size={20} /></button></div>
    </section>
  );
}

