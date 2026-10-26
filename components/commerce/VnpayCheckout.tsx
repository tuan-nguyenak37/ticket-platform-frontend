'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle2, CreditCard, ShieldCheck, Ticket, UserRound } from 'lucide-react';
import { useAuthStore } from '@/lib/auth/auth.store';
import { getCommerce, postCommerce, money, vietnamDate, type Order, type ResaleOrder, type Listing } from '@/lib/api/commerce';
import { Failure } from '@/components/ui/commerce';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatHttpError } from '@/lib/api/http-errors';
import { TicketFiles } from './TicketFiles';
import { Status, useClock } from './shared';
import type { Recipient } from './checkout.types';
import './checkout.css';

type Transaction = {
  txnRef: string; status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REVIEW';
  amount: string; expiresAt: string; failureCode: string | null; paymentId: string | null;
  recipient: Recipient;
};

export function VnpayCheckout({ id, resale = false, listingPreview = false }: { id: string; resale?: boolean; listingPreview?: boolean }) {
  const user = useAuthStore(state => state.user);
  const userId = user?.user_id;
  const revision = useAuthStore(state => state.revision);
  const now = useClock();
  const cache = useQueryClient();
  const returned = useSearchParams().get('vnpay') === 'returned';
  const lock = useRef(false);
  const syncLock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [recipient, setRecipient] = useState<Recipient>({ name: user?.full_name ?? '', email: user?.email ?? '', phone: user?.phone_number ?? '' });
  const path = listingPreview ? `resale/listings/${encodeURIComponent(id)}` : `${resale ? 'resale/' : ''}orders/${encodeURIComponent(id)}`;
  const paymentPath = listingPreview ? `payments/vnpay/resale/listings/${encodeURIComponent(id)}` : `payments/vnpay/${resale ? 'resale' : 'orders'}/${encodeURIComponent(id)}`;
  const order = useQuery({
    queryKey: ['commerce', user?.user_id, listingPreview ? 'resale-preview' : 'vnpay-order', resale, id],
    queryFn: () => getCommerce<Order | ResaleOrder | Listing>(path), enabled: !!user, retry: 1,
    refetchInterval: query => query.state.data?.status === 'PENDING_PAYMENT' || (listingPreview && ['AVAILABLE', 'RESERVED'].includes(query.state.data?.status ?? '')) ? 5000 : false,
  });
  const payment = useQuery({
    queryKey: ['commerce', user?.user_id, 'vnpay-payment', resale, id],
    queryFn: () => getCommerce<{ current: Transaction | null }>(paymentPath),
    enabled: !listingPreview && !!user && order.isSuccess, retry: 1,
    refetchInterval: query => query.state.data?.current?.status === 'PENDING' ? 5000 : false,
  });

  const checkPayment = useCallback(async () => {
    if (syncLock.current || useAuthStore.getState().revision !== revision) return;
    syncLock.current = true; setChecking(true); setError(null);
    try {
      const result = await postCommerce<{ outcome: string }>(`${paymentPath}/sync`);
      if (useAuthStore.getState().revision !== revision) return;
      await Promise.all([
        cache.invalidateQueries({ queryKey: ['commerce', userId] }),
        cache.invalidateQueries({ queryKey: ['public'] }),
      ]);
      if (useAuthStore.getState().revision === revision && result.outcome === 'ERROR') throw new Error('Chưa thể xác minh kết quả với VNPay. Hệ thống sẽ kiểm tra lại sau 5 phút; không thanh toán thêm.');
    } catch (failure) {
      if (useAuthStore.getState().revision === revision) setError(failure);
    } finally {
      syncLock.current = false;
      if (useAuthStore.getState().revision === revision) setChecking(false);
    }
  }, [cache, paymentPath, revision, userId]);

  const pendingPayment = !listingPreview && payment.data?.current?.status === 'PENDING' && order.data?.status !== 'PAID';
  useEffect(() => {
    if (!returned || !pendingPayment) return;
    const initial = window.setTimeout(() => void checkPayment(), 0);
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void checkPayment(); }, 5 * 60_000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [returned, pendingPayment, checkPayment]);

  const paidOrder = order.data?.status === 'PAID';
  useEffect(() => {
    if (!paidOrder) return;
    void cache.invalidateQueries({ queryKey: ['commerce', user?.user_id] });
    void cache.invalidateQueries({ queryKey: ['public'] });
  }, [paidOrder, cache, user?.user_id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || checking || !canPay || order.isError || (!listingPreview && payment.isError) || useAuthStore.getState().revision !== revision) return;
    lock.current = true; setBusy(true); setError(null);
    try {
      const result = await postCommerce<{ paymentUrl: string | null; free?: boolean; resaleOrderId?: string }>(paymentPath, { recipient });
      if (useAuthStore.getState().revision !== revision) return;
      if (result.free) {
        await Promise.all([order.refetch(), payment.refetch(), cache.invalidateQueries({ queryKey: ['public'] })]);
        return;
      }
      const url = new URL(result.paymentUrl ?? '');
      if (url.origin !== 'https://sandbox.vnpayment.vn' || url.pathname !== '/paymentv2/vpcpay.html' || url.username || url.password) throw new Error('Địa chỉ thanh toán không hợp lệ.');
      window.location.assign(url.toString());
    } catch (failure) {
      if (useAuthStore.getState().revision === revision) {
        setError(failure);
        if (listingPreview) await order.refetch();
      }
    } finally {
      lock.current = false;
      if (useAuthStore.getState().revision === revision) setBusy(false);
    }
  }

  if (order.isPending) return <div role="status" className="checkout"><span className="sr-only">Đang tải đơn hàng…</span><div className="mb-6 h-10 w-2/3 rounded-xl bg-white/10" /><div className="checkout-layout"><div className="min-h-96 rounded-2xl bg-white/10" /><div className="min-h-64 rounded-2xl bg-white/10" /></div></div>;
  const orderErrorCode = order.isError ? formatHttpError(order.error).statusCode : null;
  if (listingPreview && orderErrorCode === 404) return <section className="tv-panel space-y-4" role="status"><h1 className="text-2xl font-semibold">Vé không còn mở bán</h1><p>Tin đăng đã đóng hoặc vé đã được người khác mua. Nếu bạn đã thanh toán, kiểm tra đơn hiện có trước khi mua thêm.</p><div className="flex flex-wrap gap-3"><Link className="tv-button tv-primary" href="/pass">Tìm vé khác</Link><Link className="tv-button" href="/account/resale?tab=buy">Xem đơn của tôi</Link></div></section>;
  if (!order.data || (orderErrorCode !== null && ![0, 408, 429].includes(orderErrorCode) && orderErrorCode < 500)) return <Failure error={order.error} retry={() => void order.refetch()} />;
  const details = order.data;
  const resaleDetails = resale && ('resaleOrderId' in details || 'listingId' in details) ? details : null;
  const preview = listingPreview && 'originalPrice' in details ? details : null;
  const previewPurchase = preview?.purchase;
  const amount = 'totalAmount' in details ? details.totalAmount : details.price;
  const paid = details.status === 'PAID';
  const current = listingPreview ? undefined : payment.data?.current;
  const remaining = 'expiresAt' in details ? Math.max(0, Math.ceil((Date.parse(details.expiresAt) - now) / 1000)) : 0;
  const canPay = listingPreview ? !!preview && preview.status === 'AVAILABLE' && !preview.ticketId && !previewPurchase : details.status === 'PENDING_PAYMENT' && remaining > 0 && current?.status !== 'REVIEW' && current?.status !== 'SUCCEEDED';
  const canWait = !!preview && ['AVAILABLE', 'RESERVED'].includes(preview.status) && !preview.ticketId && !previewPurchase;
  const waitingRemaining = preview?.reservedUntil ? Math.max(0, Math.ceil((Date.parse(preview.reservedUntil) - now) / 1000)) : 0;
  const awaiting = current?.status === 'PENDING' || current?.status === 'SUCCEEDED';
  const displayedRecipient = awaiting ? current.recipient : recipient;
  const activeStep = paid ? 3 : awaiting ? 2 : 1;
  const canCancel = resale && !listingPreview && canPay && !busy && !checking && !order.isError && payment.isSuccess && (!current || current.status === 'FAILED');

  async function cancelReservation() {
    if (!canCancel || lock.current || useAuthStore.getState().revision !== revision) return;
    lock.current = true; setBusy(true);
    try {
      await postCommerce(`${path}/cancel`);
      if (useAuthStore.getState().revision !== revision) return;
      await Promise.all([
        cache.invalidateQueries({ queryKey: ['commerce', userId] }),
        cache.invalidateQueries({ queryKey: ['public', 'resale-listings'] }),
      ]);
    } finally {
      lock.current = false;
      if (useAuthStore.getState().revision === revision) setBusy(false);
    }
  }

  return <div className="checkout checkout-vnpay">
    <header className="checkout-heading"><div><Link href={listingPreview ? `/pass/${encodeURIComponent(id)}` : resale ? '/account/resale?tab=buy' : '/account/orders'} className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm tv-muted"><ArrowLeft size={16} aria-hidden="true" />{listingPreview ? 'Quay lại vé bán lại' : 'Đơn hàng của tôi'}</Link><p className="checkout-eyebrow">TICKETVERSE / {resale ? 'MUA VÉ BÁN LẠI' : 'ĐẶT VÉ'}</p><h1 className="text-balance">{listingPreview ? 'Kiểm tra vé bán lại' : resale ? paid ? 'Mua lại vé thành công' : 'Hoàn tất mua vé bán lại' : paid ? 'Đặt vé thành công' : 'Hoàn tất đặt vé'}</h1></div><span className="tv-badge tv-badge-neutral"><ShieldCheck size={15} className="mr-2" aria-hidden="true" />VNPay</span></header>
    <ol className="checkout-steps checkout-steps-vnpay" aria-label="Tiến trình thanh toán">{['Thông tin người nhận', 'Thanh toán VNPay', 'Nhận vé'].map((label, index) => <li key={label} className={activeStep > index + 1 ? 'checkout-step-complete' : undefined} aria-current={activeStep === index + 1 ? 'step' : undefined}><span>{activeStep > index + 1 ? <CheckCircle2 size={17} aria-hidden="true" /> : index + 1}</span>{label}</li>)}</ol>
    <p className="checkout-payment-notice"><ShieldCheck size={20} className="shrink-0" aria-hidden="true" /><span><strong>Thanh toán qua cổng VNPay.</strong><br />Bạn sẽ được chuyển đến VNPay để chọn phương thức thanh toán và xác thực giao dịch. Không nhập thông tin thẻ hoặc OTP ngân hàng trên TicketVerse.</span></p>
    <div className="checkout-layout">
      <section className="space-y-5" aria-label="Thông tin thanh toán" aria-busy={busy}>
        {error != null && <Failure error={error} />}
        {order.error && <Failure error={order.error} retry={() => void order.refetch()} />}
        {!listingPreview && payment.error && <Failure error={payment.error} retry={() => void payment.refetch()} />}
        {preview && !preview.ticketId && !previewPurchase && <p className="tv-notice" role="status">{preview.status === 'RESERVED' ? preview.reservedUntil && Date.parse(preview.reservedUntil) > now ? `Vé đang được người khác giữ đến ${vietnamDate(preview.reservedUntil)}. Bạn vẫn có thể điền liên hệ; nút thanh toán sẽ khả dụng khi vé mở lại. Trang tự cập nhật mỗi 5 giây.` : 'Đang kiểm tra vé đã mở bán lại…' : 'Chưa giữ vé ở bước này. Chỉ khi bạn bấm thanh toán VNPay, hệ thống mới kiểm tra và giữ vé tối đa 5 phút, không quá giờ bắt đầu suất diễn.'}</p>}
        {paid ? <div className="tv-panel space-y-5" role="status" aria-live="polite"><CheckCircle2 className="text-emerald-300" size={44} aria-hidden="true" /><h2 className="text-xl font-semibold">Thanh toán thành công</h2><p>{resale ? 'Giao dịch mua lại đã hoàn tất. Mã QR cũ đã bị vô hiệu hóa. Nếu vé vẫn thuộc bạn, mở chi tiết vé để xem mã QR mới.' : 'Đơn hàng đã thanh toán. Vé đã được lưu trong tài khoản. Mở mục Vé của tôi để xem thông tin và mã vé.'}</p><Link className="tv-button tv-primary" href={resaleDetails?.ticketId ? `/account/tickets/${encodeURIComponent(resaleDetails.ticketId)}` : '/account/tickets'}>{resaleDetails?.ticketId ? 'Mở vé / mã QR mới' : 'Xem vé của tôi'}</Link>{!resale ? <TicketFiles id={id} order /> : resaleDetails?.ticketId && <TicketFiles id={resaleDetails.ticketId} />}</div> : current?.status === 'REVIEW' ? <div role="status" className="tv-panel space-y-3"><h2 className="text-xl font-semibold">Giao dịch cần đối soát</h2><p>Giao dịch cần được kiểm tra trước khi hoàn tất đơn. Không thanh toán lại. Vui lòng liên hệ hỗ trợ với mã giao dịch {current.txnRef}.</p></div> : <>
          {awaiting && <div className="checkout-contact space-y-3" role="status" aria-live="polite"><strong>{checking ? 'Đang kiểm tra kết quả thanh toán…' : 'Đang chờ xác nhận từ VNPay'}</strong><p>Hệ thống tự cập nhật kết quả thanh toán, bạn không cần tải lại trang. Nếu đã hoàn tất tại VNPay, không thanh toán thêm.</p><button type="button" className="tv-button" disabled={checking} onClick={() => void checkPayment()}>{checking ? 'Đang kiểm tra…' : 'Kiểm tra kết quả thanh toán'}</button></div>}
          {current?.status === 'FAILED' && <p role="status" className="tv-notice">VNPay chưa thanh toán thành công (mã {current.failureCode}). Bạn có thể thử lại khi đơn còn thời hạn.</p>}
          {previewPurchase ? <div className="tv-panel space-y-3" role="status"><h2 className="text-xl font-semibold">Bạn đã có đơn mua vé này</h2><p>Tiếp tục kiểm tra đơn hiện có. Không tạo thêm thanh toán khi chưa biết kết quả giao dịch trước.</p><Link className="tv-button tv-primary" href={`/checkout/pass/${encodeURIComponent(previewPurchase.resaleOrderId)}`}>Mở đơn hiện có</Link></div> : !(canPay || canWait) ? <div className="tv-panel space-y-3"><h2 className="text-xl font-semibold">{preview?.ticketId ? 'Bạn không thể tự mua vé đang bán' : 'Đơn không còn khả dụng để thanh toán'}</h2><p>Nếu đã thanh toán tại VNPay, không thanh toán thêm; chờ hệ thống xác nhận hoặc liên hệ hỗ trợ.</p><Link className="tv-button" href={resale ? '/pass' : '/events'}>{resale ? 'Tìm vé bán lại khác' : 'Xem sự kiện'}</Link></div> : <form onSubmit={event => void submit(event)} className="space-y-5">
            <div className="tv-panel space-y-5">
            <div className="checkout-section-title"><span><UserRound aria-hidden="true" /></span><div><h2>Thông tin người nhận vé</h2><p>Kiểm tra thông tin liên hệ trước khi thanh toán.</p></div></div>
            <fieldset disabled={busy || awaiting} className="space-y-5">
              <label className="checkout-label">Họ và tên<input className="tv-input" autoComplete="name" required minLength={2} maxLength={150} value={displayedRecipient.name} onChange={event => setRecipient({ ...recipient, name: event.target.value })} /></label>
              <div className="checkout-fields"><label className="checkout-label">Email liên hệ<input className="tv-input" type="email" autoComplete="email" required maxLength={254} value={displayedRecipient.email} onChange={event => setRecipient({ ...recipient, email: event.target.value })} /></label><label className="checkout-label">Số điện thoại<input className="tv-input" type="tel" autoComplete="tel" required pattern="(0[0-9]{9}|\+84[0-9]{9})" maxLength={20} value={displayedRecipient.phone} onChange={event => setRecipient({ ...recipient, phone: event.target.value })} /></label></div>
            </fieldset>
            <p className="checkout-security">Vé thuộc tài khoản đang đăng nhập. Nếu bật gửi email vé, hệ thống gửi đến email của tài khoản; email liên hệ được lưu cùng giao dịch.</p>
            </div>
            <div className="tv-panel space-y-5"><div className="checkout-section-title"><span><CreditCard aria-hidden="true" /></span><div><h2>Phương thức thanh toán</h2><p>Chọn ngân hàng và xác thực trên trang VNPay, không phải TicketVerse.</p></div></div><div className="checkout-vnpay-method"><span className="checkout-vnpay-brand">VN<span>PAY</span></span><div><strong>Cổng thanh toán VNPay</strong><p className="mt-1 text-xs tv-muted">Chọn phương thức và xác thực giao dịch trên VNPay</p></div><CheckCircle2 size={20} className="ml-auto shrink-0 text-[#d2adff]" aria-hidden="true" /></div>
            <button className="tv-button tv-primary w-full" disabled={busy || checking || !canPay || order.isError || (!listingPreview && (payment.isPending || payment.isError)) || (returned && awaiting) || (awaiting && Date.parse(current.expiresAt) <= now)}>{busy ? 'Đang tạo yêu cầu…' : preview?.status === 'RESERVED' ? 'Vé đang được giữ, vui lòng chờ' : amount === '0' ? 'Hoàn tất nhận vé miễn phí' : returned && awaiting ? 'Đang chờ kết quả thanh toán' : awaiting ? 'Tiếp tục giao dịch VNPay đang chờ' : `Thanh toán qua VNPay · ${money(amount)}`}<ArrowRight size={17} aria-hidden="true" /></button>
            </div>
          </form>}
        </>}
      </section>
      <aside className="tv-panel checkout-summary space-y-5" aria-label="Tóm tắt đơn hàng">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{resale ? 'Vé bạn mua lại' : 'Thông tin đặt vé'}</h2><Status value={details.status} /></div>
        {resaleDetails?.event && <h3 className="text-xl font-semibold leading-7">{resaleDetails.event.title}</h3>}
        {resaleDetails?.showing && <div className="space-y-2 text-sm leading-6 tv-muted"><p>{resaleDetails.showing.name}</p><p className="tabular-nums">{vietnamDate(resaleDetails.showing.startTime)} · giờ Việt Nam</p><p>{[resaleDetails.showing.venueName, resaleDetails.showing.address, resaleDetails.showing.city].filter(Boolean).join(', ')}</p></div>}
        <div className="checkout-ticket-line"><span><Ticket size={24} aria-hidden="true" /></span><div><p className="mb-1 text-xs tv-muted">{resale ? '1 VÉ BÁN LẠI' : 'HẠNG VÉ ĐÃ CHỌN'}</p><h3 className="break-words font-semibold">{'ticketTypeName' in details ? details.ticketTypeName : resaleDetails?.ticketType?.name ?? 'Vé nhận chuyển nhượng'}</h3></div></div>
        {resaleDetails?.ticketType?.description && <p className="whitespace-pre-line text-sm leading-6 tv-muted">{resaleDetails.ticketType.description}</p>}
        {'quantity' in details && <div className="flex justify-between gap-3 text-sm tv-muted"><span>Số lượng × đơn giá</span><span className="text-right tabular-nums">{details.quantity} × {money(details.unitPrice)}</span></div>}
        {'discountAmount' in details && details.discountAmount && details.discountAmount !== '0' && <div className="flex justify-between gap-3 text-sm text-[#d2adff]"><span>Ưu đãi {details.discountCode}</span><span className="tabular-nums">−{money(details.discountAmount)}</span></div>}
        <div className="checkout-total"><span>Tổng thanh toán</span><strong className="tabular-nums">{money(amount)}</strong></div>
        {resale && <p className="checkout-security">Giá cho 1 vé. Phí nền tảng do người bán chịu; bạn không trả thêm phí này.</p>}
        {canPay && !listingPreview && <div className="checkout-countdown" role="timer" aria-label="Thời gian giữ vé còn lại"><span>Thời gian giữ vé</span><strong>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</strong></div>}
        {preview?.status === 'RESERVED' && !previewPurchase && <div className="checkout-countdown" role="timer" aria-label="Thời gian chờ lượt giữ hiện tại"><span>{waitingRemaining ? 'Lượt giữ hiện tại còn' : 'Đang kiểm tra trạng thái vé…'}</span>{waitingRemaining > 0 && <strong>{Math.floor(waitingRemaining / 60)}:{String(waitingRemaining % 60).padStart(2, '0')}</strong>}</div>}
        <div className="space-y-2 border-t border-white/10 pt-4"><p className="checkout-security break-all">{listingPreview ? 'Mã tin đăng' : 'Mã đơn'}: {id}</p>{current && <p className="checkout-security break-all">Mã giao dịch: {current.txnRef}</p>}<p className="checkout-security">Vé chỉ được cấp khi hệ thống xác nhận thanh toán thành công.</p></div>
        {canCancel && <button type="button" className="tv-button w-full" onClick={() => setCancel(true)}>Hủy giữ vé</button>}
      </aside>
    </div>
    {cancel && <ConfirmDialog light={false} title="Hủy giữ vé?" description="Vé sẽ được mở lại cho người khác mua. Đơn đã hủy không thể tiếp tục thanh toán." confirmLabel="Hủy giữ vé" onClose={() => setCancel(false)} onConfirm={cancelReservation} />}
  </div>;
}
