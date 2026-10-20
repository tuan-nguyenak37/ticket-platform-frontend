'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/auth.store';
import { useAuthenticatedAction } from '@/lib/auth/useAuthenticatedAction';
import { getCommerce, listCommerce, postCommerce, money, vietnamDate, type Listing, type ResaleOrder } from '@/lib/api/commerce';
import { Failure, Pagination } from '@/components/ui/commerce';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Empty, Status } from './shared';

export function Marketplace() {
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ['public', 'resale-listings', page], queryFn: () => listCommerce<Listing>('resale/listings', page, true), retry: 1 });
  return <div className="space-y-6"><section className="tv-panel bg-gradient-to-br from-violet-500/15 to-transparent"><p className="text-xs font-semibold tracking-[.2em] text-[#d2adff]">MỘT TẤM VÉ · MỘT CƠ HỘI MỚI</p><h2 className="mt-3 text-2xl font-bold sm:text-4xl">Lỡ một kế hoạch, không lỡ cuộc vui.</h2><p className="mt-4 max-w-2xl leading-7 tv-muted">Tìm vé được chủ sở hữu bán lại. Sau khi xác nhận đơn hợp lệ, vé được chuyển sang tài khoản bạn với QR mới. Hệ thống chưa kết nối cổng thu tiền.</p></section>{query.isPending ? <p role="status">Đang tìm vé bán lại…</p> : query.isError ? <Failure error={query.error} retry={() => void query.refetch()} /> : <>{!query.data.items.length && <Empty text="Chưa có vé bán lại phù hợp trong trang này." />}<div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{query.data.items.map(listing => <article className="tv-panel flex flex-col gap-4" key={listing.listingId}><Status value={listing.status} /><h2 className="break-words text-xl font-semibold">{listing.event.title}</h2><p className="text-sm tv-muted">{listing.showing.name} · {listing.ticketType.name}</p><p className="text-sm tv-muted">{vietnamDate(listing.showing.startTime)}<br />{listing.showing.venueName}, {listing.showing.city}</p><div className="mt-auto border-t border-dashed border-white/15 pt-4"><p className="text-2xl font-semibold text-[#d2adff]">{money(listing.price)}</p><p className="mt-1 text-xs tv-muted">Giá gốc: {money(listing.originalPrice)}</p></div><Link className="tv-button tv-primary" href={`/pass/${encodeURIComponent(listing.listingId)}`}>Xem vé bán lại</Link></article>)}</div><Pagination page={page} total={query.data.total} busy={query.isFetching} onChange={setPage} /></>}</div>;
}
export function ListingDetail({ id }: { id: string }) {
  const router = useRouter();
  const cache = useQueryClient();
  const status = useAuthStore(state => state.status);
  const userId = useAuthStore(state => state.user?.user_id);
  const { run, restoring } = useAuthenticatedAction();
  const [busy, setBusy] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const lock = useRef(false);
  const query = useQuery({ queryKey: ['commerce', userId, 'listing', id], queryFn: () => getCommerce<Listing>(`resale/listings/${encodeURIComponent(id)}`, undefined, status === 'unauthenticated'), enabled: status === 'authenticated' || status === 'unauthenticated', retry: 1 });
  async function buy() {
    const buyerId = useAuthStore.getState().user?.user_id;
    if (!buyerId) return;
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    let completed = false;
    try {
      const order = await postCommerce<ResaleOrder>(`resale/listings/${encodeURIComponent(id)}/orders`);
      if (useAuthStore.getState().user?.user_id !== buyerId) return;
      void cache.invalidateQueries({ queryKey: ['public', 'resale-listings'] });
      void cache.invalidateQueries({ queryKey: ['commerce'] });
      completed = true;
      router.push(`/checkout/pass/${encodeURIComponent(order.resaleOrderId)}`);
    } catch (failure) { setError(failure); await query.refetch(); }
    finally { if (!completed) { lock.current = false; setBusy(false); } }
  }
  async function cancelListing() {
    try { await postCommerce(`resale/listings/${encodeURIComponent(id)}/cancel`); }
    finally {
      await cache.invalidateQueries({ queryKey: ['commerce'] });
      await cache.invalidateQueries({ queryKey: ['public', 'resale-listings'] });
    }
  }
  if (status === 'error') return <p role="alert" className="tv-notice">Không thể xác thực phiên hiện tại. Vui lòng tải lại trang để thử khôi phục phiên; không chuyển sang chế độ khách.</p>;
  if (query.isPending) return <p role="status">Đang tải tin đăng…</p>;
  if (query.isError) return <Failure error={query.error} retry={() => void query.refetch()} />;
  const listing = query.data;
  const mine = !!listing.ticketId;
  return <div className="grid items-start gap-6 lg:grid-cols-[1.3fr_1fr]"><article className="tv-panel space-y-5"><Status value={listing.status} /><h2 className="text-3xl font-bold">{listing.event.title}</h2><p className="text-lg text-[#d2adff]">{listing.ticketType.name} · 1 vé</p><p>{listing.showing.name}</p><p className="tv-muted">{vietnamDate(listing.showing.startTime)} (giờ Việt Nam)</p><p className="tv-muted">{[listing.showing.venueName, listing.showing.address, listing.showing.city].filter(Boolean).join(', ')}</p><p className="text-sm tv-muted">Ban tổ chức: {listing.organizer.name}</p><Link className="tv-button" href="/pass">Trở về chợ vé</Link></article><section className="tv-panel space-y-5"><p className="text-sm tv-muted">GIÁ BÁN LẠI</p><p className="text-4xl font-bold">{money(listing.price)}</p><p className="text-sm tv-muted">Giá mua gốc: {money(listing.originalPrice)}</p>{mine ? <><p className="tv-notice">Đây là tin đăng của bạn. Bạn không thể tự mua vé đang bán.</p>{['AVAILABLE', 'RESERVED'].includes(listing.status) && <button className="tv-button" onClick={() => setCancel(true)}>Hủy tin đăng</button>}<p className="text-xs tv-muted">Không thể hủy khi có lượt giữ còn hạn. Tin đã bán ghi nhận chuyển nhượng vé, không xác nhận bạn đã nhận tiền từ người mua.</p></> : <><p className="tv-notice">Bấm mua để hoàn tất giao dịch và nhận vé với QR mới. Hệ thống kiểm tra vé còn bán trước khi xác nhận.</p><button className="tv-button tv-primary w-full" disabled={busy || restoring || (listing.status !== 'AVAILABLE' && !error)} onClick={() => run(buy)}>{busy ? 'Đang mua vé…' : error ? 'Thử mua lại' : 'Mua vé ngay'}</button><Link className="tv-button" href="/account/resale">Lịch sử mua vé</Link></>}{error != null && <Failure error={error} />}</section>{cancel && <ConfirmDialog light={false} title="Hủy tin đăng?" description="Tin đã hủy sẽ không tự mở lại. Vé vẫn thuộc sở hữu của bạn nếu chưa chuyển nhượng." confirmLabel="Hủy tin đăng" onClose={() => setCancel(false)} onConfirm={cancelListing} />}</div>;
}
