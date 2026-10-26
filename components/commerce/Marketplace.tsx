'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, QrCode, ShieldCheck, Ticket } from 'lucide-react';
import { useAuthStore } from '@/lib/auth/auth.store';
import { useAuthenticatedAction } from '@/lib/auth/useAuthenticatedAction';
import { getCommerce, postCommerce, money, vietnamDate, type Listing } from '@/lib/api/commerce';
import type { Page } from '@/types/api';
import { Failure, Pagination } from '@/components/ui/commerce';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatHttpError } from '@/lib/api/http-errors';
import { EventPoster } from '@/app/_components/EventDiscovery';
import { Empty, Status, useClock } from './shared';

export function Marketplace({ page = 1, filters = {} }: { page?: number; filters?: Record<string, string> } = {}) {
  const router = useRouter();
  const query = useQuery({ queryKey: ['public', 'resale-listings', page, filters], queryFn: () => getCommerce<Page<Listing>>('resale/listings', { ...filters, page, limit: 20 }, true), retry: 1 });
  const events = useQuery({ queryKey: ['public', 'resale-events'], queryFn: () => getCommerce<{ eventId: string; title: string }[]>('resale/events', undefined, true), retry: 1 });
  const filtered = Object.keys(filters).length > 0;
  return <div className="space-y-8 break-words">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-semibold text-[#d2adff]">TICKETVERSE / BÁN LẠI VÉ</p><h1 className="text-balance text-3xl font-bold">Chợ vé bán lại</h1></div><Link href="/account/tickets" className="tv-button">Bán lại vé của tôi <ArrowRight size={17} aria-hidden="true" /></Link></header>
    <section className="tv-panel grid gap-6 lg:grid-cols-2 lg:items-center">
      <div><span className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-[#9b6df51a] text-[#d2adff]"><Ticket size={26} aria-hidden="true" /></span><h2 className="max-w-lg text-balance text-2xl font-bold sm:text-3xl">Một tấm vé.<br />Một cuộc hẹn mới.</h2><p className="mt-4 max-w-xl text-pretty text-sm leading-7 tv-muted">Tìm vé được chủ sở hữu bán lại trên TicketVerse. Chọn đúng sự kiện, suất diễn và hạng vé trước khi tiếp tục thanh toán.</p></div>
      <ol className="grid gap-4 text-sm"><li className="flex items-start gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#9b6df566] text-[#d2adff]">1</span><div><strong>Chọn vé phù hợp</strong><p className="mt-1 leading-6 tv-muted">Mỗi tin đăng tương ứng một vé.</p></div></li><li className="flex items-start gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#9b6df566] text-[#d2adff]">2</span><div><strong>Kiểm tra & thanh toán</strong><p className="mt-1 leading-6 tv-muted">Kiểm tra thông tin vé và tiếp tục thanh toán qua VNPay.</p></div></li><li className="flex items-start gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#9b6df566] text-[#d2adff]">3</span><div><strong>Nhận vé trong tài khoản</strong><p className="mt-1 leading-6 tv-muted">Sau khi hệ thống xác nhận thanh toán thành công, vé được chuyển sang bạn với mã QR mới.</p></div></li></ol>
    </section>
    <form action="/pass" method="get" aria-label="Lọc vé bán lại" className="tv-panel space-y-4 [color-scheme:dark]">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="min-w-0 space-y-2 text-sm"><span>Tìm tên sự kiện</span><input name="q" type="search" maxLength={255} defaultValue={filters.q} placeholder="Bạn muốn đi sự kiện nào?" className="tv-input w-full" /></label>
        <label className="min-w-0 space-y-2 text-sm"><span>Sự kiện</span><select name="eventId" defaultValue={filters.eventId || ''} className="tv-input w-full"><option value="">Tất cả sự kiện</option>{filters.eventId && <option key={filters.eventId} value={filters.eventId}>{events.data?.find(event => event.eventId === filters.eventId)?.title || 'Sự kiện đã chọn'}</option>}{events.data?.filter(event => event.eventId !== filters.eventId).map(event => <option key={event.eventId} value={event.eventId}>{event.title}</option>)}</select></label>
        <label className="min-w-0 space-y-2 text-sm"><span>Ngày diễn từ</span><input name="dateFrom" type="date" defaultValue={filters.dateFrom} className="tv-input w-full" /></label>
        <label className="min-w-0 space-y-2 text-sm"><span>Ngày diễn đến</span><input name="dateTo" type="date" defaultValue={filters.dateTo} className="tv-input w-full" /></label>
        <label className="min-w-0 space-y-2 text-sm"><span>Giá thấp nhất (đ)</span><input name="minPrice" inputMode="numeric" pattern="[0-9]+" maxLength={19} defaultValue={filters.minPrice} placeholder="0" className="tv-input w-full" /></label>
        <label className="min-w-0 space-y-2 text-sm"><span>Giá cao nhất (đ)</span><input name="maxPrice" inputMode="numeric" pattern="[0-9]+" maxLength={19} defaultValue={filters.maxPrice} placeholder="Không giới hạn" className="tv-input w-full" /></label>
      </div>
      <div className="flex flex-wrap items-center gap-3"><button type="submit" className="tv-button tv-primary">Tìm vé</button>{filtered && <Link href="/pass" className="tv-button">Xóa bộ lọc</Link>}<p className="text-xs tv-muted">Ngày diễn theo giờ Việt Nam · giá cho 1 vé</p></div>
      {events.isError && <p role="alert" className="text-sm tv-muted">Chưa tải được danh sách sự kiện. <button type="button" className="underline" onClick={() => void events.refetch()}>Tải lại</button></p>}
    </form>
    <section aria-label="Danh sách vé bán lại" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><h2 className="text-balance text-xl font-bold">Vé đang bán lại</h2>{query.data && <p className="text-sm tabular-nums tv-muted">{query.data.total} vé</p>}</div>
      {query.isPending ? <div role="status"><span className="sr-only">Đang tìm vé bán lại…</span><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="tv-panel space-y-5"><div className="h-8 w-1/2 rounded-lg bg-white/10" /><div className="h-16 rounded-lg bg-white/10" /><div className="h-24 rounded-lg bg-white/10" /><div className="h-11 rounded-lg bg-white/10" /></div>)}</div></div> : query.isError ? <Failure error={query.error} retry={() => void query.refetch()} /> : <>
        {!query.data.items.length ? <Empty text={filtered ? 'Không tìm thấy vé phù hợp. Thử thay đổi bộ lọc.' : 'Chưa có vé bán lại trong trang này.'} href={filtered || page > 1 ? '/pass' : '/events'} action={filtered ? 'Xóa bộ lọc' : page > 1 ? 'Về trang đầu chợ vé' : 'Khám phá sự kiện'} /> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{query.data.items.map(listing => <article className="tv-panel flex min-w-0 flex-col gap-4 hover:border-[#9b6df5]" key={listing.listingId}>
          <Link href={`/pass/${encodeURIComponent(listing.listingId)}`} aria-label={`Xem vé bán lại: ${listing.event.title}`}><EventPoster key={listing.event.posterUrl} url={listing.event.posterUrl ?? null} title={listing.event.title} /></Link>
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="inline-flex items-center gap-2 text-xs font-semibold text-[#d2adff]"><Ticket size={17} aria-hidden="true" />1 VÉ · {listing.ticketType.name}</span><Status value={listing.status} /></div>
          <h3 className="line-clamp-2 min-h-12 break-words text-pretty text-lg font-semibold leading-6"><Link href={`/pass/${encodeURIComponent(listing.listingId)}`}>{listing.event.title}</Link></h3>
          <div className="space-y-3 text-sm tv-muted"><p className="flex items-start gap-2"><CalendarDays size={17} className="mt-0.5 shrink-0" aria-hidden="true" /><span className="tabular-nums">{vietnamDate(listing.showing.startTime)}<span className="mt-1 block text-xs">{listing.showing.name}</span></span></p><p className="flex items-start gap-2"><MapPin size={17} className="mt-0.5 shrink-0" aria-hidden="true" /><span>{[listing.showing.venueName, listing.showing.city].filter(Boolean).join(', ')}</span></p></div>
          <div className="mt-auto border-t border-dashed border-white/20 pt-4"><p className="text-xs tv-muted">Giá bán lại</p><p className="mt-1 text-2xl font-bold tabular-nums text-[#d2adff]">{money(listing.price)}</p><p className="mt-2 text-xs tabular-nums tv-muted">Giá mua gốc: {money(listing.originalPrice)}</p></div><Link className="tv-button tv-primary w-full" href={`/pass/${encodeURIComponent(listing.listingId)}`}>Xem vé bán lại <ArrowRight size={17} aria-hidden="true" /></Link>
        </article>)}</div>}
        {(query.data.total > 20 || page > 1) && <Pagination page={page} total={query.data.total} busy={query.isFetching} onChange={next => router.push(`/pass?${new URLSearchParams({ ...filters, page: String(next) })}`)} />}
      </>}
    </section>
  </div>;
}
export function ListingDetail({ id }: { id: string }) {
  const router = useRouter();
  const cache = useQueryClient();
  const status = useAuthStore(state => state.status);
  const userId = useAuthStore(state => state.user?.user_id);
  const revision = useAuthStore(state => state.revision);
  const now = useClock();
  const { run, restoring } = useAuthenticatedAction();
  const [cancel, setCancel] = useState(false);
  const query = useQuery({ queryKey: ['commerce', userId, 'listing', id], queryFn: () => getCommerce<Listing>(`resale/listings/${encodeURIComponent(id)}`, undefined, status === 'unauthenticated'), enabled: status === 'authenticated' || status === 'unauthenticated', retry: 1,
    refetchInterval: query => ['AVAILABLE', 'RESERVED'].includes(query.state.data?.status ?? '') || query.state.data?.settlement?.payout?.status === 'PENDING' ? 5000 : false,
  });
  async function buy() {
    router.push(`/checkout/resale/${encodeURIComponent(id)}`);
  }
  async function cancelListing() {
    try { await postCommerce(`resale/listings/${encodeURIComponent(id)}/cancel`); }
    finally {
      await cache.invalidateQueries({ queryKey: ['commerce'] });
      await cache.invalidateQueries({ queryKey: ['public', 'resale-listings'] });
    }
  }
  if (status === 'error') return <p role="alert" className="tv-notice">Không thể xác thực phiên hiện tại. Vui lòng tải lại trang để thử khôi phục phiên; không chuyển sang chế độ khách.</p>;
  if (query.isPending) return <div role="status" className="space-y-5"><span className="sr-only">Đang tải tin đăng…</span><div className="h-10 w-1/3 rounded-xl bg-white/10" /><div className="grid gap-6 lg:grid-cols-2"><div className="min-h-80 rounded-2xl bg-white/10" /><div className="min-h-80 rounded-2xl bg-white/10" /></div></div>;
  const errorCode = query.isError ? formatHttpError(query.error).statusCode : null;
  if (errorCode === 404) return <Empty text="Tin đăng không còn mở bán. Nếu bạn đã tạo đơn, hãy kiểm tra Giao dịch bán lại." href="/account/resale?tab=buy" action="Xem đơn tôi mua lại" />;
  if (!query.data || (errorCode !== null && ![0, 408, 429].includes(errorCode) && errorCode < 500)) return <Failure error={query.error} retry={() => void query.refetch()} />;
  const listing = query.data;
  const mine = !!listing.ticketId;
  const purchase = listing.purchase;
  const held = purchase?.status === 'PENDING_PAYMENT' && Date.parse(purchase.expiresAt) > now;
  return <div className="space-y-6 break-words">
    <Link className="inline-flex min-h-11 items-center gap-2 text-sm tv-muted" href="/pass"><ArrowLeft size={17} aria-hidden="true" />Trở về chợ vé</Link>
    <header><p className="mb-2 text-xs font-semibold text-[#d2adff]">TICKETVERSE / MUA VÉ BÁN LẠI</p><h1 className="text-balance text-2xl font-bold sm:text-3xl">{listing.event.title}</h1></header>
    {query.isError && <Failure error={query.error} retry={() => void query.refetch()} />}
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="order-2 min-w-0 space-y-6 lg:order-none">
        <EventPoster key={listing.event.posterUrl} url={listing.event.posterUrl ?? null} title={listing.event.title} />
        <article className="tv-panel space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-semibold"><Ticket size={18} className="text-[#d2adff]" aria-hidden="true" />Chi tiết vé bán lại</h2><Status value={listing.status} /></div>
          <div className="flex items-start gap-3 border-y border-dashed border-white/20 py-5"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#9b6df51a] text-[#d2adff]"><Ticket size={24} aria-hidden="true" /></span><div className="min-w-0"><p className="break-words font-semibold text-[#d2adff]">{listing.ticketType.name}</p><p className="mt-1 text-sm tv-muted">1 vé · {listing.showing.name}</p></div></div>
          <dl className="space-y-5 text-sm"><div><dt className="mb-2 flex items-center gap-3 tv-muted"><CalendarDays size={20} className="shrink-0 text-[#d2adff]" aria-hidden="true" />Thời gian</dt><dd className="pl-8 tabular-nums">{vietnamDate(listing.showing.startTime)} (giờ Việt Nam)</dd></div><div><dt className="mb-2 flex items-center gap-3 tv-muted"><MapPin size={20} className="shrink-0 text-[#d2adff]" aria-hidden="true" />Địa điểm</dt><dd className="break-words pl-8 leading-6"><strong>{listing.showing.venueName}</strong><span className="block tv-muted">{[listing.showing.address, listing.showing.city].filter(Boolean).join(', ')}</span></dd></div><div className="border-t border-white/10 pt-4"><dt className="mb-1 tv-muted">Ban tổ chức</dt><dd className="break-words font-semibold">{listing.organizer.name}</dd></div></dl>
          <Link className="tv-button" href={`/events/${encodeURIComponent(listing.event.eventId)}`}>Xem sự kiện gốc <ArrowRight size={17} aria-hidden="true" /></Link>
          {listing.ticketType.description && <section className="border-t border-white/10 pt-5"><h2 className="font-semibold">Thông tin hạng vé</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 tv-muted">{listing.ticketType.description}</p></section>}
        </article>
        <section className="tv-panel"><h2 className="flex items-center gap-3 text-balance text-lg font-semibold"><QrCode size={22} className="shrink-0 text-[#d2adff]" aria-hidden="true" />Vé được chuyển nhượng như thế nào?</h2><p className="mt-4 text-pretty text-sm leading-7 tv-muted">Bạn có thể kiểm tra vé và điền liên hệ mà chưa giữ vé. Chỉ khi bấm thanh toán VNPay, hệ thống mới kiểm tra và giữ vé tối đa 5 phút. Sau khi thanh toán được xác nhận, vé thuộc tài khoản của bạn với mã QR mới; mã QR cũ bị vô hiệu hóa.</p></section>
      </div>
      <aside className="tv-panel order-1 min-w-0 space-y-5 lg:sticky lg:top-28 lg:order-none" aria-label="Thông tin mua vé bán lại">
        <div className="space-y-2 border-b border-dashed border-white/20 pb-5"><h2 className="flex items-center gap-2 font-semibold"><Ticket size={20} className="shrink-0 text-[#d2adff]" aria-hidden="true" />{listing.ticketType.name} · 1 vé</h2><p className="text-sm tv-muted">{listing.showing.name} · {vietnamDate(listing.showing.startTime)}</p><p className="text-sm tv-muted">{[listing.showing.venueName, listing.showing.city].filter(Boolean).join(', ')}</p></div>
        <div><p className="text-sm tv-muted">{mine ? 'Giá bán lại · 1 vé' : 'Tổng thanh toán · 1 vé'}</p><p className="mt-2 break-words text-3xl font-bold tabular-nums text-[#d2adff]">{money(listing.price)}</p><p className="mt-2 text-sm tabular-nums tv-muted">Giá mua gốc: {money(listing.originalPrice)}</p></div>
        {mine && (listing.settlement ? <div className="space-y-2 border-t border-white/10 pt-4 text-sm"><p>Phí nền tảng (5%): {money(listing.settlement.feeAmount)}</p><p className="font-semibold text-[#d2adff]">Thực nhận: {money(listing.settlement.netAmount)}</p><p className="tv-muted">{listing.settlement.bankName} · {listing.settlement.maskedAccountNumber} · {listing.settlement.accountHolder}</p><p role="status">Chi trả: {listing.settlement.payout ? listing.settlement.payout.status === 'SUCCEEDED' ? 'Đã xử lý chi trả' : listing.settlement.payout.status === 'FAILED' ? 'Chi trả cần kiểm tra' : 'Chờ chi trả' : 'Chưa phát sinh'}</p></div> : <p className="tv-notice">{listing.status === 'AVAILABLE' ? 'Tin đăng chưa có tài khoản nhận tiền. Hãy hủy và đăng lại để tiếp tục mở bán.' : 'Tin đăng cũ không áp dụng chi trả tự động.'}</p>)}
        <div className="border-t border-dashed border-white/20 pt-5">
          {mine ? <div className="space-y-4"><p className="tv-notice">Đây là tin đăng của bạn. Bạn không thể tự mua vé đang bán.</p>{['AVAILABLE', 'RESERVED'].includes(listing.status) && <button className="tv-button w-full" onClick={() => setCancel(true)}>Hủy tin đăng</button>}<p className="text-xs leading-6 tv-muted">Không thể hủy khi có lượt giữ còn hạn. Tin đã bán ghi nhận chuyển nhượng vé, không xác nhận bạn đã nhận tiền từ người mua.</p></div> : purchase?.status === 'PAID' || held ? <div className="space-y-4"><p className="tv-notice" role="status">{held ? `Vé đang được giữ cho bạn đến ${vietnamDate(purchase!.expiresAt)}. Tiếp tục đơn hiện có, không cần tạo lại.` : 'Bạn đã thanh toán đơn mua lại vé này. Mở đơn để xem kết quả và vé đã nhận.'}</p><Link className="tv-button tv-primary w-full" href={`/checkout/pass/${encodeURIComponent(purchase!.resaleOrderId)}`}>{held ? 'Tiếp tục thanh toán' : 'Xem đơn đã mua'}<ArrowRight size={17} aria-hidden="true" /></Link></div> : <div className="space-y-4">
            {listing.status === 'RESERVED' && <p role="status" className="tv-notice">{listing.reservedUntil && Date.parse(listing.reservedUntil) > now ? `Vé đang được người khác giữ đến ${vietnamDate(listing.reservedUntil)}. Trang tự cập nhật mỗi 5 giây.` : 'Đang kiểm tra vé đã mở bán lại…'}</p>}
            {!query.isError && <button className="tv-button tv-primary w-full" disabled={restoring || !['AVAILABLE', 'RESERVED'].includes(listing.status) || useAuthStore.getState().revision !== revision} onClick={() => run(buy)}>{['AVAILABLE', 'RESERVED'].includes(listing.status) ? 'Kiểm tra & mua vé' : 'Vé không còn mở bán'}<ArrowRight size={17} aria-hidden="true" /></button>}
            <p className="text-sm leading-6 tv-muted">Bước tiếp theo chưa giữ vé. Vé chỉ được giữ tối đa 5 phút khi bạn bấm thanh toán VNPay.</p>
          </div>}
        </div>
        {!mine && <p className="text-xs leading-6 tv-muted">Phí nền tảng do người bán chịu, không cộng thêm vào giá bạn thanh toán.</p>}
        <p className="tv-notice flex items-start gap-2"><ShieldCheck size={19} className="mt-1 shrink-0 text-[#d2adff]" aria-hidden="true" /><span>Bạn sẽ được chuyển đến VNPay để thanh toán. Không nhập thông tin thẻ hoặc OTP ngân hàng trên TicketVerse.</span></p>
        <Link className="tv-button w-full" href={mine ? '/account/resale' : '/account/resale?tab=buy'}>Giao dịch bán lại của tôi</Link>
      </aside>
    </div>
    {cancel && <ConfirmDialog light={false} title="Hủy tin đăng?" description="Tin đã hủy sẽ không tự mở lại. Vé vẫn thuộc sở hữu của bạn nếu chưa chuyển nhượng." confirmLabel="Hủy tin đăng" onClose={() => setCancel(false)} onConfirm={cancelListing} />}
  </div>;
}
