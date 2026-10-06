'use client';

import React, { useState } from 'react';
import { Sparkles, Ticket } from 'lucide-react';
import { useTicketMarketplace } from '../_hooks/useTicketMarketplace';
import { TicketFilterBar } from './TicketFilterBar';
import { TicketCard } from './TicketCard';
import { TicketBuyModal } from './TicketBuyModal';
import type { TicketListing } from '../_lib/tickets-marketplace.types';

export function TicketMarketplace({ eventName }: { eventName: string }) {
  const {
    filters,
    setQuery,
    setTier,
    setPriceRange,
    setQuantity,
    setSortBy,
    resetFilters,
    filteredListings,
    totalCount,
    hasActiveFilters,
  } = useTicketMarketplace();

  const [selectedTicket, setSelectedTicket] = useState<TicketListing | null>(null);

  return (
    <div className="space-y-6">
      {/* Filter and Search Bar */}
      <TicketFilterBar
        filters={filters}
        onQueryChange={setQuery}
        onTierChange={setTier}
        onPriceChange={setPriceRange}
        onQuantityChange={setQuantity}
        onSortChange={setSortBy}
        onReset={resetFilters}
        totalResults={totalCount}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Ticket Listings List */}
      <div className="space-y-3.5">
        {filteredListings.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-12 text-center text-white/60 space-y-3">
            <Ticket className="size-10 mx-auto text-white/30" />
            <h3 className="text-base font-bold text-white">Không tìm thấy vé phù hợp</h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              Không có vé pass nào khớp với bộ lọc hiện tại. Thử chọn hạng vé khác hoặc bấm đặt lại bộ lọc.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition-colors cursor-pointer"
            >
              <Sparkles className="size-3.5" />
              <span>Xem tất cả vé đang pass</span>
            </button>
          </div>
        ) : (
          filteredListings.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onSelect={setSelectedTicket}
            />
          ))
        )}
      </div>

      {/* Buy Ticket Modal */}
      <TicketBuyModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        eventName={eventName}
      />
    </div>
  );
}
