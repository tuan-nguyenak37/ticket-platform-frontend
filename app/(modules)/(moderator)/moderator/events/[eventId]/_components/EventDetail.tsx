'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  FileText,
  Tag,
  ShieldCheck,
  Ticket,
} from 'lucide-react';
import type { EventItem } from '../../_lib/events.types';
import { getImageUrl } from '../../_lib/events.api';
import { EventStatusBadge } from '../../_components/EventStatusBadge';

export function EventDetail({ event }: { event: EventItem }) {
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Chưa thiết lập';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'full',
        timeStyle: 'medium',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const bannerSrc = getImageUrl(event.bannerUrl);
  const thumbSrc = getImageUrl(event.thumbnailUrl);

  return (
    <div className="space-y-6">
      {/* 1. Main Overview Header Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm overflow-hidden">
        {bannerSrc && (
          <div className="w-full h-44 sm:h-64 rounded-2xl overflow-hidden mb-6 border border-slate-100 bg-slate-100 shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerSrc}
              alt={event.name}
              className="size-full object-cover"
            />
          </div>
        )}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-start gap-4">
              {thumbSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbSrc}
                  alt={event.name}
                  className="size-16 sm:size-20 rounded-2xl object-cover border border-slate-200 shadow-md shrink-0"
                />
              )}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
              <EventStatusBadge status={event.status} />
              {event.categoryName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700">
                  <Tag className="size-3" />
                  {event.categoryName}
                </span>
              )}
              {event.phase && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  Phase: {event.phase}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {event.name}
            </h1>
            <p className="text-xs font-mono text-slate-400">ID: {event.event_id}</p>
            {event.shortDescription && (
              <p className="text-sm text-slate-600 leading-relaxed pt-1">
                {event.shortDescription}
              </p>
            )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 min-w-[200px] text-right">
            <p className="text-[11px] text-slate-400">Dự kiến sức chứa</p>
            <div className="mt-1 flex items-center justify-end gap-1.5 text-slate-800">
              <Ticket className="size-4 text-violet-600" />
              <span className="text-xl font-bold tracking-tight">
                {event.ticketsCount ? event.ticketsCount.toLocaleString('vi-VN') : '1.000+'}
              </span>
              <span className="text-xs text-slate-500 font-normal">vé</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Detailed Specs Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Schedule & Location */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Clock className="size-4 text-violet-600" />
              Lịch trình & Địa điểm tổ chức
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 pt-1">
              <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Calendar className="size-3.5 text-violet-500" />
                  <span>Thời gian bắt đầu</span>
                </div>
                <p className="text-xs font-semibold text-slate-800">{formatDate(event.startTime)}</p>
              </div>

              <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Calendar className="size-3.5 text-rose-500" />
                  <span>Thời gian kết thúc</span>
                </div>
                <p className="text-xs font-semibold text-slate-800">{formatDate(event.endTime)}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <MapPin className="size-3.5 text-emerald-500" />
                <span>Địa điểm chi tiết</span>
              </div>
              <p className="text-sm font-semibold text-slate-800">{event.venueName}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{event.address}</p>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <FileText className="size-4 text-violet-600" />
              Mô tả chi tiết sự kiện
            </h2>
            <div className="text-xs text-slate-700 leading-relaxed space-y-3 whitespace-pre-line bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              {event.description || 'Không có mô tả chi tiết được cung cấp.'}
            </div>
          </div>
        </div>

        {/* Right Column (1 col) */}
        <div className="space-y-6">
          {/* Organizer Info */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Building2 className="size-4 text-violet-600" />
              Đơn vị tổ chức
            </h2>
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center font-bold text-white text-sm">
                {event.organizerName ? event.organizerName[0].toUpperCase() : 'O'}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-xs">
                  {event.organizerName || 'Nhà tổ chức đối tác'}
                </p>
                <p className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5 font-medium">
                  <ShieldCheck className="size-3" /> Đã xác minh danh tính
                </p>
              </div>
            </div>
          </div>

          {/* Moderation Metadata */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Thông tin hệ thống
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Mã danh mục</span>
                <span className="font-mono text-slate-600">{event.categoryId || 'pm_evt_cat_music'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Ngày tạo</span>
                <span className="text-slate-600">{formatDate(event.createdAt)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Cập nhật lần cuối</span>
                <span className="text-slate-600">{formatDate(event.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
