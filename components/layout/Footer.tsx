import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-slate-950/90 backdrop-blur-xl text-white/80 py-16 md:py-20 px-4 md:px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 mb-16">
          {/* Brand info (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform duration-300">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
              </div>
              <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                TicketVerse
              </span>
            </Link>
            <p className="text-sm text-white/70 max-w-sm leading-relaxed">
              Nền tảng mua bán vé sự kiện, đêm nhạc trực tiếp và lễ hội âm nhạc công nghệ cao. Trải nghiệm check-in QR bảo mật và giao dịch vé an toàn.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-xs text-white/80">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Hệ thống vận hành 24/7 an toàn & xác thực
            </div>
          </div>

          {/* Column 1: Khám phá */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-base">Khám phá</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/events?category=concert" className="hover:text-white transition-colors">
                  Concert Âm nhạc
                </Link>
              </li>
              <li>
                <Link href="/events?category=festival" className="hover:text-white transition-colors">
                  Lễ hội EDM & Rock
                </Link>
              </li>
              <li>
                <Link href="/events?category=theater" className="hover:text-white transition-colors">
                  Kịch & Sân khấu
                </Link>
              </li>
              <li>
                <Link href="/events?category=sports" className="hover:text-white transition-colors">
                  Giải đấu Thể thao
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Ban tổ chức */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-base">Ban tổ chức</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/organizer/create" className="hover:text-white transition-colors">
                  Đăng ký tạo sự kiện
                </Link>
              </li>
              <li>
                <Link href="/organizer/checkin" className="hover:text-white transition-colors">
                  Giải pháp soát vé QR
                </Link>
              </li>
              <li>
                <Link href="/organizer/pricing" className="hover:text-white transition-colors">
                  Biểu phí & Quyền lợi
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Hỗ trợ */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-base">Hỗ trợ & Pháp lý</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Trung tâm trợ giúp
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-white transition-colors">
                  Chính sách hoàn vé
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Điều khoản dịch vụ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Chính sách bảo mật
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <p>© {new Date().getFullYear()} TicketVerse Platform. Bản quyền được bảo lưu.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white transition-colors cursor-pointer">Bảo mật giao dịch SSL 256-bit</span>
            <span>•</span>
            <span className="hover:text-white transition-colors cursor-pointer">Tiêu chuẩn vé điện tử</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
