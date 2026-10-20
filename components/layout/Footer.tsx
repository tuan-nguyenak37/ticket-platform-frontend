import Link from 'next/link';

export function Footer() {
  return <footer className="tv-footer"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[2fr_1fr_1fr] md:px-8">
    <div><Link href="/" className="text-xl font-semibold">TicketVerse<span className="text-fuchsia-300">.</span></Link><p className="mt-3 max-w-md text-sm leading-6 tv-muted">Khám phá sự kiện, tìm những trải nghiệm mới và kết nối với điều bạn yêu thích.</p></div>
    <nav aria-label="Khám phá"><h2 className="mb-3 font-semibold">Khám phá</h2><div className="grid gap-3 text-sm tv-muted"><Link href="/events">Tất cả sự kiện</Link><Link href="/">Trang chủ</Link></div></nav>
    <nav aria-label="Tài khoản và tổ chức"><h2 className="mb-3 font-semibold">Dành cho bạn</h2><div className="grid gap-3 text-sm tv-muted"><Link href="/account">Tài khoản của tôi</Link><Link href="/organizer">Không gian ban tổ chức</Link></div></nav>
    <p className="border-t border-white/10 pt-5 text-sm tv-muted md:col-span-3">© {new Date().getFullYear()} TicketVerse · Khám phá. Kết nối. Trải nghiệm.</p>
  </div></footer>;
}
