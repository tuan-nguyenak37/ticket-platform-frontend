'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock3, CheckCircle2, XCircle, RefreshCw, ArrowLeft, Plus } from 'lucide-react';
import { EventFilter } from './_components/EventFilter';
import { EventTable } from './_components/EventTable';
import { CreateEventModal } from './_components/CreateEventModal';
import { useEvents, useUpdateEventStatus } from './_hooks/useEvents';

export default function ModeratorEventsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, refetch, isFetching } = useEvents({
    q: query,
    status,
    page,
    limit,
  });

  const updateStatusMutation = useUpdateEventStatus();

  const handleApprove = async (eventId: string) => {
    if (confirm('Xác nhận duyệt và xuất bản sự kiện này lên hệ thống?')) {
      await updateStatusMutation.mutateAsync({
        eventId,
        status: 'published',
      });
    }
  };

  const handleReject = async (eventId: string) => {
    if (confirm('Xác nhận hủy sự kiện này?')) {
      await updateStatusMutation.mutateAsync({
        eventId,
        status: 'cancelled',
      });
    }
  };

  const handleReset = () => {
    setQuery('');
    setStatus('all');
    setPage(1);
  };

  const events = data?.items ?? [];
  const total = data?.total ?? 0;

  // Stats calculation
  const pendingCount = events.filter((e) => e.status === 'draft').length;
  const publishedCount = events.filter((e) => e.status === 'published').length;
  const cancelledCount = events.filter((e) => e.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/moderator/dashboard"
              className="text-xs text-slate-400 hover:text-violet-600 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="size-3" />
              <span>Quay lại Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            Quản lý sự kiện & Suất diễn
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Xem xét, kiểm duyệt và quản lý toàn bộ các sự kiện đăng bán vé trên nền tảng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin text-violet-600' : ''}`} />
            <span>{isFetching ? 'Đang làm mới...' : 'Làm mới'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-violet-200 hover:bg-violet-700 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Tạo sự kiện mới</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex size-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <CalendarDays className="size-4" />
            </span>
            <span className="text-[10px] font-semibold text-slate-400">Tất cả</span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Tổng số sự kiện</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock3 className="size-4" />
            </span>
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
              Cần duyệt
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-amber-700">{pendingCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Chờ xét duyệt</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-4" />
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              Đang bán
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-700">{publishedCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Đã xuất bản</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <XCircle className="size-4" />
            </span>
            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
              Đã hủy
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-rose-700">{cancelledCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Đã hủy bỏ</p>
        </div>
      </div>

      {/* 3. Search and Filters */}
      <EventFilter
        query={query}
        onQueryChange={(q) => {
          setQuery(q);
          setPage(1);
        }}
        status={status}
        onStatusChange={(s) => {
          setStatus(s);
          setPage(1);
        }}
        onReset={handleReset}
        totalResults={total}
      />

      {/* 4. Events Table */}
      <EventTable
        events={events}
        isLoading={isLoading}
        page={page}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* 5. Create Event Modal */}
      <CreateEventModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
