'use client';

import React from 'react';
import {
  Ticket,
  QrCode,
  ShieldCheck,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { TicketListing } from '../_lib/tickets-marketplace.types';

interface TicketCardProps {
  ticket: TicketListing;
  onSelect: (ticket: TicketListing) => void;
}

export function TicketCard({ ticket, onSelect }: TicketCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const hasDiscount = ticket.resalePrice < ticket.originalPrice;
  const discountAmount = ticket.originalPrice - ticket.resalePrice;

  // Colors for ticket categories
  const tierColorClasses: Record<string, string> = {
    violet: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
    emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    blue: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
    amber: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    rose: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  };

  const currentTierColor = tierColorClasses[ticket.tierColor || 'violet'] || tierColorClasses.violet;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 sm:p-6 transition-all duration-300 hover:border-violet-500/50 hover:bg-white/[0.08] hover:shadow-xl hover:shadow-violet-950/40">
      {/* Decorative concert ticket stub notches */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-slate-950 border-r border-white/10" />
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-slate-950 border-l border-white/10" />

      <div className="grid gap-5 md:grid-cols-[1fr_auto] items-center">
        {/* Left Column: Ticket Specs & Seller */}
        <div className="space-y-3">
          {/* Tier Name & Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1 text-xs font-bold tracking-tight ${currentTierColor}`}>
              <Sparkles className="size-3" />
              {ticket.tierName}
            </span>

            {ticket.isAdjacentSeats ? (
              <span className="inline-flex items-center gap-1 rounded-xl bg-violet-600/20 border border-violet-500/30 px-2.5 py-1 text-[11px] font-semibold text-violet-300">
                <Layers className="size-3" />
                {ticket.quantity} vé liền kề
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-xl bg-white/10 border border-white/15 px-2.5 py-1 text-[11px] font-medium text-white/80">
                {ticket.quantity} vé đơn
              </span>
            )}

            {ticket.ticketType === 'eticket' ? (
              <span className="inline-flex items-center gap-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 text-[11px] font-medium text-cyan-300">
                <QrCode className="size-3" />
                Vé điện tử (QR)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                <Ticket className="size-3" />
                Vé cứng / Vòng tay
              </span>
            )}
          </div>

          {/* Seat position & zone */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {ticket.zone}
            </h3>
            <p className="text-xs text-white/70 font-medium mt-0.5">
              Vị trí: <strong className="text-white font-semibold">{ticket.seatNumber || 'Vào cửa tự do'}</strong>
            </p>
          </div>

          {ticket.note && (
            <p className="text-xs text-white/50 italic line-clamp-1 max-w-xl">
              &quot;{ticket.note}&quot;
            </p>
          )}

          {/* Seller metadata */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-white/60 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              <div className="size-6 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-[10px] font-bold text-white">
                {ticket.seller.name[0]}
              </div>
              <span className="font-semibold text-white/90">{ticket.seller.name}</span>
              {ticket.seller.isIdentityVerified && (
                <span title="Người bán đã xác minh danh tính" className="text-emerald-400">
                  <ShieldCheck className="size-3.5" />
                </span>
              )}
            </div>

            <span>•</span>

            <span className="text-white/50">{ticket.seller.successfulSales} lượt pass thành công</span>

            <span>•</span>
            <span className="text-white/40">{ticket.createdAt}</span>
          </div>
        </div>

        {/* Right Column: Price & Buy CTA */}
        <div className="flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
          <div className="text-left md:text-right">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {formatCurrency(ticket.resalePrice)}
              </span>
              <span className="text-xs text-white/50">/ vé</span>
            </div>

            {hasDiscount && (
              <div className="flex items-center md:justify-end gap-1.5 mt-0.5">
                <span className="text-xs text-white/40 line-through">
                  {formatCurrency(ticket.originalPrice)}
                </span>
                <span className="rounded px-1.5 py-0.2 text-[10px] font-bold text-emerald-400 bg-emerald-500/20">
                  Giảm {formatCurrency(discountAmount)}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelect(ticket)}
            className="flex items-center gap-1 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-violet-600/30 hover:scale-[1.03] active:scale-95 transition-all cursor-pointer"
          >
            <span>Mua vé ngay</span>
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
