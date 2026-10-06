'use client';

import React, { useState } from 'react';
import { FileText, Map, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { PublicEvent as EventItem } from '@/lib/events/events.types';

export function EventInfoTabs({ event }: { event: EventItem }) {
  const [activeTab, setActiveTab] = useState<'info' | 'seatmap' | 'policy'>('info');

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-xl">
      {/* Tabs selector */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'info'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
              : 'text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          <FileText className="size-4" />
          <span>Thông tin sự kiện</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('seatmap')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'seatmap'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
              : 'text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Map className="size-4" />
          <span>Sơ đồ khán đài (Seat Map)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('policy')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'policy'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
              : 'text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          <ShieldAlert className="size-4" />
          <span>Bảo hiểm Pass vé & Quy định</span>
        </button>
      </div>

      {/* Tab 1: Thông tin sự kiện */}
      {activeTab === 'info' && (
        <div className="space-y-4 text-xs sm:text-sm text-white/80 leading-relaxed animate-in fade-in">

          <div className="whitespace-pre-line rounded-2xl bg-white/5 p-5 border border-white/10 space-y-3">
            {event.description || 'Chưa có mô tả cho sự kiện này.'}
          </div>
        </div>
      )}

      {/* Tab 2: Sơ đồ khán đài */}
      {activeTab === 'seatmap' && (
        <div className="space-y-4 animate-in fade-in text-center">
          <div className="rounded-2xl border border-white/15 bg-slate-900/60 p-6 sm:p-10 flex flex-col items-center justify-center space-y-4">
            <div className="w-full max-w-md h-12 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 flex items-center justify-center font-black tracking-widest text-xs uppercase text-white shadow-lg shadow-violet-600/30">
              SÂN KHẤU CHÍNH (STAGE)
            </div>

            {/* Simulated interactive seat layout zones */}
            <div className="w-full max-w-xl grid grid-cols-2 gap-3 pt-3">
              <div className="rounded-xl border border-violet-500/40 bg-violet-500/20 p-4 text-center">
                <p className="font-bold text-sm text-violet-200">VIP 1 Diamond</p>
                <p className="text-[11px] text-white/60">Chính diện • Ghế nệm ngồi</p>
              </div>
              <div className="rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/20 p-4 text-center">
                <p className="font-bold text-sm text-fuchsia-200">VIP 2 Sapphire</p>
                <p className="text-[11px] text-white/60">Cánh gà • Ghế nệm ngồi</p>
              </div>
            </div>

            <div className="w-full max-w-xl rounded-xl border border-emerald-500/40 bg-emerald-500/20 p-4 text-center">
              <p className="font-bold text-sm text-emerald-200">GA STAND ZONE (Fanzone)</p>
              <p className="text-[11px] text-white/60">Khu đứng gần sân khấu nhất</p>
            </div>

            <div className="w-full max-w-xl grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-blue-500/40 bg-blue-500/20 p-4 text-center">
                <p className="font-bold text-sm text-blue-200">CAT 1 Khán đài A</p>
                <p className="text-[11px] text-white/60">Tầng 2 • View toàn cảnh</p>
              </div>
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/20 p-4 text-center">
                <p className="font-bold text-sm text-amber-200">CAT 2 Khán đài B</p>
                <p className="text-[11px] text-white/60">Tầng 2 • Góc nghiêng</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-white/40">Sơ đồ mang tính chất định vị khu vực khán đài chính thức tại sự kiện.</p>
        </div>
      )}

      {/* Tab 3: Quy định & Bảo hiểm */}
      {activeTab === 'policy' && (
        <div className="space-y-4 text-xs sm:text-sm text-white/80 leading-relaxed animate-in fade-in">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
              <h4 className="font-bold text-emerald-300 flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="size-4" />
                Bảo vệ người mua 100% (Escrow)
              </h4>
              <p className="text-xs text-emerald-100/70">
                TicketVerse giữ tiền thanh toán trung gian. Tiền chỉ được chuyển cho người bán sau khi bạn quét mã vé vào cổng thành công.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 space-y-2">
              <h4 className="font-bold text-cyan-300 flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="size-4" />
                Cam kết hoàn tiền trong 30 phút
              </h4>
              <p className="text-xs text-cyan-100/70">
                Nếu vé bị trùng hoặc không hợp lệ tại cổng soát vé, đường dây nóng hỗ trợ 24/7 sẽ hoàn lại 100% tiền ngay lập tức.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-4 border border-white/10 space-y-1.5">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Lưu ý khi mua vé:</h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-white/60">
              <li>Mỗi vé chỉ áp dụng cho một người tham gia sự kiện.</li>
              <li>Khán giả vui lòng xuất trình căn cước công dân hoặc giấy tờ tùy thân trùng tên khi được yêu cầu.</li>
              <li>Tuyệt đối không chia sẻ ảnh chụp mã QR vé lên mạng xã hội trước giờ vào cổng.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
