'use client';

import React from 'react';
import { Search, X, SlidersHorizontal, ChevronDown, RotateCcw } from 'lucide-react';
import type { TicketFilterState } from '../_lib/tickets-marketplace.types';

interface TicketFilterBarProps {
  filters: TicketFilterState;
  onQueryChange: (q: string) => void;
  onTierChange: (t: string) => void;
  onPriceChange: (p: string) => void;
  onQuantityChange: (q: string) => void;
  onSortChange: (s: TicketFilterState['sortBy']) => void;
  onReset: () => void;
  totalResults: number;
  hasActiveFilters: boolean;
}

const TIER_OPTIONS = [
  { value: 'all', label: 'Tất cả hạng vé' },
  { value: 'VIP 1', label: 'VIP 1 Diamond' },
  { value: 'VIP 2', label: 'VIP 2 Sapphire' },
  { value: 'VVIP', label: 'VVIP Premium Lounge' },
  { value: 'GA Stand', label: 'GA Stand (Đứng Fanzone)' },
  { value: 'CAT 1', label: 'CAT 1 Khán đài' },
  { value: 'CAT 2', label: 'CAT 2 Khán đài' },
];

const PRICE_OPTIONS = [
  { value: 'all', label: 'Tất cả mức giá' },
  { value: 'under_1m', label: 'Dưới 1.000.000đ' },
  { value: '1m_to_2m', label: '1.000.000đ - 2.000.000đ' },
  { value: '2m_to_4m', label: '2.000.000đ - 4.000.000đ' },
  { value: 'above_4m', label: 'Trên 4.000.000đ' },
];

const QUANTITY_OPTIONS = [
  { value: 'all', label: 'Số lượng vé' },
  { value: 'single', label: '1 vé đơn' },
  { value: 'pair', label: '2 vé liền kề' },
  { value: 'group', label: '3+ vé nhóm' },
];

const SORT_OPTIONS: { value: TicketFilterState['sortBy']; label: string }[] = [
  { value: 'newest', label: 'Mới đăng nhất' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
  { value: 'reputation', label: 'Người bán uy tín nhất' },
];

export function TicketFilterBar({
  filters,
  onQueryChange,
  onTierChange,
  onPriceChange,
  onQuantityChange,
  onSortChange,
  onReset,
  totalResults,
  hasActiveFilters,
}: TicketFilterBarProps) {
  return (
    <div id="ticket-marketplace" className="space-y-4 pt-4">
      {/* 1. Header with decorative divider */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex items-center gap-2 bg-slate-950 px-6 py-1 text-xs font-black uppercase tracking-[0.25em] text-violet-400">
          <SlidersHorizontal className="size-3.5" />
          <span>TÌM VÉ ĐANG ĐƯỢC PASS</span>
        </div>
      </div>

      {/* 2. Search & Filter Controls */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 sm:p-5 space-y-3.5 shadow-xl">
        {/* Search bar */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo hạng vé, khu vực khán đài, hàng ghế, tên người bán..."
            value={filters.query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-white/5 pl-11 pr-10 py-3 text-xs sm:text-sm text-white placeholder:text-white/40 focus:border-violet-500/60 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
          {filters.query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Hạng vé */}
            <div className="relative">
              <select
                aria-label="Chọn hạng vé"
                value={filters.tier}
                onChange={(e) => onTierChange(e.target.value)}
                className="appearance-none rounded-xl border border-white/15 bg-white/10 pl-3.5 pr-8 py-2 text-xs font-medium text-white hover:bg-white/15 focus:border-violet-400 focus:outline-none cursor-pointer transition-all"
              >
                {TIER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-white/50 pointer-events-none" />
            </div>

            {/* 2. Giá */}
            <div className="relative">
              <select
                aria-label="Chọn mức giá"
                value={filters.priceRange}
                onChange={(e) => onPriceChange(e.target.value)}
                className="appearance-none rounded-xl border border-white/15 bg-white/10 pl-3.5 pr-8 py-2 text-xs font-medium text-white hover:bg-white/15 focus:border-violet-400 focus:outline-none cursor-pointer transition-all"
              >
                {PRICE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-white/50 pointer-events-none" />
            </div>

            {/* 3. Số lượng */}
            <div className="relative">
              <select
                aria-label="Chọn số lượng vé"
                value={filters.quantity}
                onChange={(e) => onQuantityChange(e.target.value)}
                className="appearance-none rounded-xl border border-white/15 bg-white/10 pl-3.5 pr-8 py-2 text-xs font-medium text-white hover:bg-white/15 focus:border-violet-400 focus:outline-none cursor-pointer transition-all"
              >
                {QUANTITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-white/50 pointer-events-none" />
            </div>

            {/* 4. Sắp xếp */}
            <div className="relative">
              <select
                aria-label="Sắp xếp kết quả"
                value={filters.sortBy}
                onChange={(e) => onSortChange(e.target.value as TicketFilterState['sortBy'])}
                className="appearance-none rounded-xl border border-violet-500/30 bg-violet-600/20 pl-3.5 pr-8 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-600/30 focus:border-violet-400 focus:outline-none cursor-pointer transition-all"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-violet-300 pointer-events-none" />
            </div>
          </div>

          {/* Reset Filters & Results summary */}
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors"
              >
                <RotateCcw className="size-3" />
                <span>Đặt lại</span>
              </button>
            )}

            <span className="text-xs text-white/60">
              Có <strong className="font-bold text-violet-400">{totalResults}</strong> vé phù hợp
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
