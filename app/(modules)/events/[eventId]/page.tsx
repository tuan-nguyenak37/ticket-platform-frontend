'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Ticket, AlertCircle } from 'lucide-react';
import { usePublicEventDetail } from './_hooks/usePublicEventDetail';
import { EventHero } from './_components/EventHero';
import { TicketMarketplace } from './_components/TicketMarketplace';
import { EventInfoTabs } from './_components/EventInfoTabs';
import { mockTicketListings } from './_lib/tickets-marketplace.mock';

export default function PublicEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: event, isLoading, error } = usePublicEventDetail(eventId);

  const ticketCount = mockTicketListings.length;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-12">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 animate-pulse space-y-6">
          <div className="h-6 w-32 bg-white/10 rounded-xl" />
          <div className="grid gap-6 md:grid-cols-[240px_1fr]">
            <div className="aspect-[3/4] bg-white/10 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-white/10 rounded-xl" />
              <div className="h-5 w-1/2 bg-white/10 rounded-xl" />
              <div className="h-5 w-2/3 bg-white/10 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-20 text-center">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-10 space-y-4">
          <AlertCircle className="size-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Không tìm thấy thông tin sự kiện</h2>
          <p className="text-xs text-white/50 max-w-md mx-auto">
            Sự kiện có mã &quot;{eventId}&quot; không tồn tại hoặc chưa được mở bán công khai.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-700 transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span>Quay về trang chủ</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-10">
      {/* 1. Hero Event Section (Poster + Tiêu đề + Ngày giờ + Địa điểm + Đếm vé pass) */}
      <EventHero event={event} ticketCount={ticketCount} />

      {/* 2. TÌM VÉ (Sàn Pass Vé Marketplace) */}
      <TicketMarketplace eventName={event.name} />

      {/* 3. Thông tin bổ sung, Sơ đồ khán đài & Chính sách */}
      <EventInfoTabs event={event} />
    </div>
  );
}
