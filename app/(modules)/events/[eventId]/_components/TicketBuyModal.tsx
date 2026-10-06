'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  QrCode,
  Ticket,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import type { TicketListing } from '../_lib/tickets-marketplace.types';

interface TicketBuyModalProps {
  ticket: TicketListing | null;
  onClose: () => void;
  eventName: string;
}

export function TicketBuyModal({ ticket, onClose, eventName }: TicketBuyModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!ticket) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const totalPrice = ticket.resalePrice * ticket.quantity;

  const handleCheckout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-slate-900/95 p-6 sm:p-8 shadow-2xl z-10 text-white overflow-hidden backdrop-blur-2xl">
        {/* Glow decoration */}
        <div className="absolute -top-20 -right-20 size-48 rounded-full bg-violet-600/30 blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/30">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Chi tiết vé sang nhượng</h2>
              <p className="text-xs text-white/50">{eventName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4 animate-in zoom-in-95">
            <div className="size-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Giữ vé thành công!</h3>
              <p className="text-xs text-white/60 max-w-xs mx-auto">
                Vé đã được khóa thành công cho bạn. Hệ thống Escrow đang bảo vệ giao dịch, người bán sẽ gửi vé trong vòng 15 phút.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-xs space-y-1.5">
              <p className="text-white/60">Mã giao dịch: <strong className="text-white font-mono">TX-{Date.now().toString(36).toUpperCase()}</strong></p>
              <p className="text-white/60">Hạng vé: <strong className="text-white">{ticket.tierName}</strong> ({ticket.quantity} vé)</p>
              <p className="text-white/60">Vị trí: <strong className="text-white">{ticket.seatNumber}</strong></p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl bg-violet-600 py-3 text-xs font-bold text-white hover:bg-violet-700 transition-colors"
            >
              Đóng và tiếp tục xem
            </button>
          </div>
        ) : (
          <div className="space-y-5 py-4">
            {/* Ticket Info Card */}
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-violet-500/20 border border-violet-500/30 px-3 py-1 text-xs font-bold text-violet-300">
                  {ticket.tierName}
                </span>
                <span className="text-xs font-medium text-white/60">
                  {ticket.quantity} vé
                </span>
              </div>

              <div>
                <p className="text-sm font-bold text-white">{ticket.zone}</p>
                <p className="text-xs text-white/60">Chỗ ngồi: <strong className="text-white">{ticket.seatNumber || 'Tự do'}</strong></p>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-2 text-xs">
                <span className="text-white/50">Loại vé:</span>
                <span className="font-semibold text-white flex items-center gap-1">
                  {ticket.ticketType === 'eticket' ? <QrCode className="size-3.5 text-cyan-400" /> : <Ticket className="size-3.5 text-amber-400" />}
                  {ticket.ticketType === 'eticket' ? 'Vé điện tử (QR Code)' : 'Vé cứng'}
                </span>
              </div>
            </div>

            {/* Seller Info */}
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3.5 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center font-bold text-white">
                  {ticket.seller.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-1 font-semibold text-white">
                    <span>{ticket.seller.name}</span>
                    {ticket.seller.isIdentityVerified && (
                      <ShieldCheck className="size-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div className="text-[11px] text-white/50">
                    <span>{ticket.seller.successfulSales} lượt pass thành công</span>
                  </div>
                </div>
              </div>
              <span className="rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold">
                Đã bảo chứng
              </span>
            </div>

            {/* Escrow Guarantee Assurance */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs space-y-1.5 text-emerald-200">
              <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                <Lock className="size-3.5" />
                <span>Bảo hiểm giao dịch TicketVerse Escrow 100%</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-100/70">
                Tiền thanh toán sẽ được giữ trung gian. Người bán chỉ nhận được tiền sau khi bạn check-in thành công tại sự kiện.
              </p>
            </div>

            {/* Price breakdown */}
            <div className="space-y-1.5 border-t border-white/10 pt-3 text-xs">
              <div className="flex justify-between text-white/60">
                <span>Đơn giá ({ticket.quantity} vé):</span>
                <span>{formatCurrency(ticket.resalePrice * ticket.quantity)}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Phí dịch vụ & Bảo hiểm Escrow:</span>
                <span className="text-emerald-400 font-medium">Miễn phí</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-white/10">
                <span>Tổng thanh toán:</span>
                <span className="text-lg font-black text-violet-400">{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-violet-600/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Đang xử lý giao dịch an toàn...</span>
                </>
              ) : (
                <>
                  <CreditCard className="size-4" />
                  <span>Xác nhận & Giữ vé ngay</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
