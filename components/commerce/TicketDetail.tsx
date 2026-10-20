'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/auth.store';
import { getCommerce, postCommerce, vietnamDate, type TicketMetadata, type Listing } from '@/lib/api/commerce';
import { Failure } from '@/components/ui/commerce';
import { TicketFiles } from './TicketFiles';
import { Status } from './shared';

export function TicketDetail({ id }: { id: string }) {
  const router = useRouter();
  const cache = useQueryClient();
  const userId = useAuthStore(state => state.user?.user_id);
  const [qrVisible, setQrVisible] = useState(false);
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const lock = useRef(false);
  const query = useQuery({ queryKey: ['commerce', userId, 'ticket', id], queryFn: () => getCommerce<TicketMetadata>(`tickets/${encodeURIComponent(id)}`), retry: 1 });
  const qr = useQuery({ queryKey: ['commerce', userId, 'qr', id], queryFn: () => getCommerce<{ qrDataUrl: string }>(`tickets/${encodeURIComponent(id)}/qr`), enabled: qrVisible && query.data?.status === 'ACTIVE', retry: false, gcTime: 0, staleTime: 0 });
  async function sell() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    try {
      if (!/^[1-9]\d*$/.test(price) || BigInt(price) > BigInt('9223372036854775807')) throw new Error('Nhập giá VND nguyên dương trong phạm vi hỗ trợ.');
      const listing = await postCommerce<Listing>('resale/listings', { ticketId: id, price });
      await cache.invalidateQueries({ queryKey: ['commerce', userId, 'my-listings'] });
      router.push(`/pass/${encodeURIComponent(listing.listingId)}`);
    } catch (failure) { setError(failure); }
    finally { lock.current = false; setBusy(false); }
  }
  if (query.isPending) return <p role="status">Đang tải thông tin vé…</p>;
  if (query.isError) return <Failure error={query.error} retry={() => void query.refetch()} />;
  const ticket = query.data;
  return <div className="grid items-start gap-6 lg:grid-cols-[1.3fr_1fr]"><article className="tv-panel space-y-5"><div className="flex items-center justify-between gap-3"><span className="text-sm tracking-widest tv-muted">PASS VÉ · E-TICKET</span><Status value={ticket.status} /></div><h2 className="break-words text-3xl font-bold">{ticket.event.title}</h2><p className="text-xl text-[#d2adff]">{ticket.ticketType.name} · #{ticket.ticketNumber}</p><dl className="space-y-3 border-y border-dashed border-white/20 py-5"><div><dt className="text-xs tv-muted">SUẤT DIỄN</dt><dd>{ticket.showing.name}</dd></div><div><dt className="text-xs tv-muted">THỜI GIAN VIỆT NAM</dt><dd>{vietnamDate(ticket.showing.startTime)}</dd></div><div><dt className="text-xs tv-muted">ĐỊA ĐIỂM</dt><dd>{[ticket.showing.venueName, ticket.showing.address, ticket.showing.city].filter(Boolean).join(', ')}</dd></div><div><dt className="text-xs tv-muted">BAN TỔ CHỨC</dt><dd>{ticket.organizer.name}</dd></div></dl><p className="break-all text-xs tv-muted">Mã vé: {ticket.ticketId}</p>
      {ticket.status === 'ACTIVE' ? <><button className="tv-button" onClick={() => setQrVisible(!qrVisible)}>{qrVisible ? 'Ẩn mã QR' : 'Hiện mã QR'}</button>{qrVisible && <div className="space-y-3">{qr.isPending ? <p role="status">Đang lấy QR hiện hành…</p> : qr.isError ? <Failure error={qr.error} retry={() => void qr.refetch()} /> : <img src={qr.data.qrDataUrl} alt="Mã QR riêng của vé" width={240} height={240} className="max-w-full rounded-xl bg-white p-3" />}<p className="text-xs tv-muted">Không chia sẻ ảnh QR. Sau chuyển nhượng, mã cũ không còn là credential hiện hành.</p></div>}<TicketFiles id={id} /></> : <p className="tv-notice">Vé đã hủy chỉ xem được thông tin; không thể xuất QR, PDF hoặc bán lại.</p>}
    </article>{ticket.status === 'ACTIVE' && <section className="tv-panel space-y-4"><h2 className="text-xl font-semibold">Không thể tham dự?</h2><p className="text-sm leading-6 tv-muted">Đăng bán lại vé trên Pass Vé. Giá không được vượt giá mua gốc; vé miễn phí không thể đăng bán. Hệ thống sẽ kiểm tra quyền bán lại và thời gian suất diễn.</p><form className="space-y-4" onSubmit={event => { event.preventDefault(); void sell(); }}><label className="block">Giá bán lại (VND)<input className="tv-input" inputMode="numeric" pattern="[1-9][0-9]*" maxLength={19} required value={price} onChange={event => setPrice(event.target.value.trim())} disabled={busy} placeholder="Ví dụ: 250000" /></label><button disabled={busy} className="tv-button tv-primary">{busy ? 'Đang đăng bán…' : 'Đăng bán vé này'}</button></form><p className="text-xs tv-muted">Bạn vẫn giữ quyền sở hữu đến khi chuyển nhượng thành công. Chưa có chức năng nhận tiền thật.</p>{error != null && <Failure error={error} />}</section>}</div>;
}
