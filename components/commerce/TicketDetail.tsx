'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/auth.store';
import { getCommerce, postCommerce, vietnamDate, money, type TicketMetadata, type Listing } from '@/lib/api/commerce';
import { Failure } from '@/components/ui/commerce';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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
  const [confirmation, setConfirmation] = useState<{ price: string; bankName: string; accountHolder: string; accountNumber: string } | null>(null);
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const feeAmount = BigInt(price || '0') * BigInt(5) / BigInt(100);
  const netAmount = BigInt(price || '0') - feeAmount;
  const confirmedFee = confirmation ? BigInt(confirmation.price) * BigInt(5) / BigInt(100) : BigInt(0);
  const lock = useRef(false);
  const query = useQuery({ queryKey: ['commerce', userId, 'ticket', id], queryFn: () => getCommerce<TicketMetadata>(`tickets/${encodeURIComponent(id)}`), retry: 1 });
  const qr = useQuery({ queryKey: ['commerce', userId, 'qr', id], queryFn: () => getCommerce<{ qrDataUrl: string }>(`tickets/${encodeURIComponent(id)}/qr`), enabled: qrVisible && query.data?.status === 'ACTIVE', retry: false, gcTime: 0, staleTime: 0 });
  function requestSale() {
    if (busy) return;
    setError(null);
    if (!/^[1-9]\d*$/.test(price) || BigInt(price) > BigInt('9223372036854775807')) {
      setError(new Error('Nhập giá VND nguyên dương trong phạm vi hỗ trợ.'));
      return;
    }
    if (![bankName, accountHolder].every(value => value.trim().length >= 2 && value.trim().length <= 100 && !/[\x00-\x1f\x7f]/.test(value)) || !/^[0-9]{6,30}$/.test(accountNumber)) {
      setError(new Error('Nhập ngân hàng, tên chủ tài khoản (2–100 ký tự) và số tài khoản gồm 6–30 chữ số.'));
      return;
    }
    setConfirmation({ price, bankName: bankName.trim(), accountHolder: accountHolder.trim(), accountNumber });
  }
  async function sell() {
    if (lock.current || confirmation === null) return;
    lock.current = true; setBusy(true); setError(null);
    try {
      const listing = await postCommerce<Listing>('resale/listings', { ticketId: id, ...confirmation });
      await cache.invalidateQueries({ queryKey: ['commerce', userId, 'my-listings'] });
      router.push(`/pass/${encodeURIComponent(listing.listingId)}`);
    }
    finally { lock.current = false; setBusy(false); }
  }
  if (query.isPending) return <p role="status">Đang tải thông tin vé…</p>;
  if (query.isError) return <Failure error={query.error} retry={() => void query.refetch()} />;
  const ticket = query.data;
  return <div className="grid items-start gap-6 lg:grid-cols-[1.3fr_1fr]"><article className="tv-panel space-y-5"><div className="flex items-center justify-between gap-3"><span className="text-sm tracking-widest tv-muted">PASS VÉ · E-TICKET</span><Status value={ticket.status} /></div><h2 className="break-words text-3xl font-bold">{ticket.event.title}</h2><p className="text-xl text-[#d2adff]">{ticket.ticketType.name} · #{ticket.ticketNumber}</p><dl className="space-y-3 border-y border-dashed border-white/20 py-5"><div><dt className="text-xs tv-muted">SUẤT DIỄN</dt><dd>{ticket.showing.name}</dd></div><div><dt className="text-xs tv-muted">THỜI GIAN VIỆT NAM</dt><dd>{vietnamDate(ticket.showing.startTime)}</dd></div><div><dt className="text-xs tv-muted">ĐỊA ĐIỂM</dt><dd>{[ticket.showing.venueName, ticket.showing.address, ticket.showing.city].filter(Boolean).join(', ')}</dd></div><div><dt className="text-xs tv-muted">BAN TỔ CHỨC</dt><dd>{ticket.organizer.name}</dd></div></dl>{ticket.checkedInAt && <p className="tv-notice">Vé đã check-in lúc {vietnamDate(ticket.checkedInAt)}. Không thể bán lại hoặc vào cửa lần hai.</p>}<p className="break-all text-xs tv-muted">Mã vé: {ticket.ticketId}</p>
      {ticket.status === 'ACTIVE' ? <><button className="tv-button" onClick={() => setQrVisible(!qrVisible)}>{qrVisible ? 'Ẩn mã QR' : 'Hiện mã QR'}</button>{qrVisible && <div className="space-y-3">{qr.isPending ? <p role="status">Đang lấy QR hiện hành…</p> : qr.isError ? <Failure error={qr.error} retry={() => void qr.refetch()} /> : <img src={qr.data.qrDataUrl} alt="Mã QR riêng của vé" width={240} height={240} className="max-w-full rounded-xl bg-white p-3" />}<p className="text-xs tv-muted">Không chia sẻ ảnh QR. Sau chuyển nhượng, mã cũ không còn là credential hiện hành.</p></div>}<TicketFiles id={id} /></> : <p className="tv-notice">Vé đã hủy chỉ xem được thông tin; không thể xuất QR, PDF hoặc bán lại.</p>}
    </article>{ticket.status === 'ACTIVE' && !ticket.checkedInAt && <section className="tv-panel space-y-4"><h2 className="text-xl font-semibold">Không thể tham dự?</h2><p className="text-sm leading-6 tv-muted">Đăng bán lại vé trên Pass Vé. Giá không được vượt giá mua gốc; vé miễn phí không thể đăng bán. Hệ thống sẽ kiểm tra quyền bán lại và thời gian suất diễn.</p><form className="space-y-4" autoComplete="off" onSubmit={event => { event.preventDefault(); requestSale(); }}><label className="block">Giá bán lại (VND)<input className="tv-input" type="text" inputMode="numeric" pattern="[1-9][0-9]{0,2}([.][0-9]{3})*" maxLength={25} required value={price ? new Intl.NumberFormat('vi-VN').format(BigInt(price)) : ''} onChange={event => {
      const amount = event.target.value.trim().replace(/\./g, '');
      if (/^\d{0,19}$/.test(amount)) setPrice(amount.replace(/^0+(?=\d)/, ''));
    }} disabled={busy} placeholder="Ví dụ: 250.000" /></label>
      <fieldset disabled={busy} className="space-y-4"><legend className="mb-3 font-semibold">Tài khoản nhận tiền</legend>
        <label className="block">Ngân hàng<input className="tv-input" name="bankName" autoComplete="off" required minLength={2} maxLength={100} value={bankName} onChange={event => setBankName(event.target.value)} placeholder="Ví dụ: Vietcombank" /></label>
        <label className="block">Số tài khoản<input className="tv-input" name="accountNumber" autoComplete="off" type="text" inputMode="numeric" required pattern="[0-9]{6,30}" minLength={6} maxLength={30} value={accountNumber} onChange={event => { if (/^[0-9]{0,30}$/.test(event.target.value)) setAccountNumber(event.target.value); }} placeholder="Nhập số tài khoản ngân hàng" /></label>
        <label className="block">Tên chủ tài khoản<input className="tv-input" name="accountHolder" autoComplete="off" required minLength={2} maxLength={100} value={accountHolder} onChange={event => setAccountHolder(event.target.value)} placeholder="Tên chủ tài khoản tại ngân hàng" /></label>
        <p className="text-xs leading-6 tv-muted">Có thể nhận tiền vào tài khoản khác tài khoản đã thanh toán. Kiểm tra kỹ thông tin; không nhập số thẻ, CVV, PIN hoặc OTP.</p>
      </fieldset>
      <dl className="space-y-2 rounded-xl bg-white/5 p-4 text-sm" aria-live="polite"><div className="flex justify-between gap-3"><dt>Phí nền tảng (5%)</dt><dd className="tabular-nums">{money(feeAmount.toString())}</dd></div><div className="flex justify-between gap-3 font-semibold text-[#d2adff]"><dt>Thực nhận khi bán thành công</dt><dd className="tabular-nums">{money(netAmount.toString())}</dd></div></dl>
      <button type="submit" disabled={busy} className="tv-button tv-primary">{busy ? 'Đang đăng bán…' : 'Đăng bán vé này'}</button></form><p className="text-xs tv-muted">Bạn vẫn giữ quyền sở hữu đến khi chuyển nhượng thành công. Chi trả được xử lý tự động sau khi thanh toán được xác nhận.</p>{error != null && <Failure error={error} />}{confirmation !== null && <ConfirmDialog title="Xác nhận đăng bán lại vé" description={`Đăng bán vé ${ticket.ticketType.name} · #${ticket.ticketNumber} của sự kiện ${ticket.event.title}, suất ${ticket.showing.name}. Giá bán: ${money(confirmation.price)}. Phí nền tảng (5%): ${money(confirmedFee.toString())}. Thực nhận: ${money((BigInt(confirmation.price) - confirmedFee).toString())}. Tài khoản nhận tiền: ${confirmation.bankName} · •••• ${confirmation.accountNumber.slice(-4)} · ${confirmation.accountHolder}. Vé chỉ chuyển chủ sau khi thanh toán thành công.`} confirmLabel="Xác nhận đăng bán" light={false} onClose={() => setConfirmation(null)} onConfirm={sell} />}</section>}</div>;
}
