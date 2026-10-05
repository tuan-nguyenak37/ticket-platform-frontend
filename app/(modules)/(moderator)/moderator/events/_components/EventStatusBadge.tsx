'use client';

import React from 'react';

export function EventStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  if (normalized === 'published' || normalized === 'đã duyệt' || normalized === 'hoạt động') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Đã xuất bản
      </span>
    );
  }

  if (normalized === 'draft' || normalized === 'chờ duyệt' || normalized === 'nháp') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
        <span className="size-1.5 rounded-full bg-amber-500" />
        Chờ duyệt (Draft)
      </span>
    );
  }

  if (normalized === 'cancelled' || normalized === 'từ chối' || normalized === 'đã hủy') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700">
        <span className="size-1.5 rounded-full bg-rose-500" />
        Đã hủy
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
      <span className="size-1.5 rounded-full bg-slate-400" />
      {status}
    </span>
  );
}
