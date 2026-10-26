'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  { image: '/images/banners/live-music.jpg', eyebrow: 'ÂM NHẠC & KẾT NỐI', title: 'Sống trọn từng khoảnh khắc', text: 'Tìm điểm hẹn tiếp theo của bạn.', alt: 'Khán giả hòa mình trong ánh đèn sân khấu' },
  { image: '/images/banners/live-stage.jpg', eyebrow: 'KHÁM PHÁ TICKETVERSE', title: 'Đêm nay, đi đâu?', text: 'Một sân khấu. Hàng ngàn cảm xúc.', alt: 'Nghệ sĩ biểu diễn trên sân khấu' },
  { image: '/images/banners/festival.jpg', eyebrow: 'TRẢI NGHIỆM MỚI', title: 'Hẹn nhau ở hàng ghế đầu', text: 'Khám phá những sự kiện đang mở bán.', alt: 'Khán giả tham dự lễ hội âm nhạc' },
];

export function PromoCarousel() {
  const [active, setActive] = useState(0);
  return <section className="tv-promos" aria-label="Khám phá cùng TicketVerse" aria-roledescription="bộ banner">
    <div className="tv-promo-grid">
      {[slides[active], slides[(active + 1) % slides.length]].map((slide, index) => <Link key={slide.image} href="/events" className={`tv-promo ${index === 1 ? 'tv-promo-secondary' : ''}`}>
        <div className="tv-promo-image"><Image src={slide.image} alt={slide.alt} fill priority={index === 0} sizes="(max-width: 767px) 100vw, 50vw" className="object-cover" /></div>
        <div className="tv-promo-caption"><p className="text-xs font-semibold text-[#d2adff]">{slide.eyebrow}</p><h2 className="mt-2 text-balance text-2xl font-bold sm:text-3xl">{slide.title}</h2><div className="mt-3 flex items-center justify-between gap-3"><p className="text-pretty text-sm tv-muted">{slide.text}</p><ArrowUpRight size={22} aria-hidden="true" className="shrink-0" /></div></div>
      </Link>)}
    </div>
    <div className="mt-3 flex items-center justify-between gap-3">
      <p className="text-xs tv-muted">Khám phá. Kết nối. Trải nghiệm.</p>
      <div className="flex items-center gap-2"><button className="tv-icon-button" type="button" aria-label="Banner trước" onClick={() => setActive((active + slides.length - 1) % slides.length)}><ChevronLeft size={18} /></button><span className="min-w-10 text-center text-xs tabular-nums tv-muted" aria-live="polite">{active + 1} / {slides.length}</span><button className="tv-icon-button" type="button" aria-label="Banner tiếp theo" onClick={() => setActive((active + 1) % slides.length)}><ChevronRight size={18} /></button></div>
    </div>
  </section>;
}
