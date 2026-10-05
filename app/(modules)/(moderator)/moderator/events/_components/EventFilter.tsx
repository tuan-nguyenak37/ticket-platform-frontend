'use client';

import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface EventFilterProps {
  query: string;
  onQueryChange: (q: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  onReset: () => void;
  totalResults?: number;
}

export function EventFilter({
  query,
  onQueryChange,
  status,
  onStatusChange,
  onReset,
  totalResults,
}: EventFilterProps) {
  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'draft', label: 'Chờ duyệt (Draft)' },
    { value: 'published', label: 'Đã xuất bản (Published)' },
    { value: 'cancelled', label: 'Đã hủy (Cancelled)' },
  ];

  const hasFilter = query.trim() !== '' || status !== 'all';

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tên sự kiện, địa điểm, ID..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-9 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/10 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <SlidersHorizontal className="absolute left-3 size-3.5 text-slate-400 pointer-events-none" />
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/60 pl-8 pr-8 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100/60 focus:border-violet-500 focus:outline-none cursor-pointer transition-all"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filter Button */}
          {hasFilter && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <X className="size-3.5" />
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Filter summary status pills */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span>Trạng thái:</span>
          {statusOptions.map((opt) => {
            const active = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onStatusChange(opt.value)}
                className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                  active
                    ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {typeof totalResults === 'number' && (
          <span className="font-medium text-slate-600">
            Tìm thấy <strong className="text-violet-600 font-semibold">{totalResults}</strong> kết quả
          </span>
        )}
      </div>
    </div>
  );
}
