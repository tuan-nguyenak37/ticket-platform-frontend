'use client';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, LoaderCircle, LockKeyhole, UserRound } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/auth.store';
import { getCommerce, postCommerce, money, vietnamDate, type Order, type ResaleOrder } from '@/lib/api/commerce';
import { Failure } from '@/components/ui/commerce';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Status, useClock } from './shared';
import { TicketFiles } from './TicketFiles';
import { PaymentMethods, type PaymentMethod } from './PaymentMethods';
import { PaymentDetails } from './PaymentDetails';
import { PaymentReceipt } from './PaymentReceipt';
import { transactionLabels, type Recipient, type CheckoutHistory } from './checkout.types';
import './checkout.css';
import { VnpayCheckout } from './VnpayCheckout';

export function Checkout(props: { id: string; resale?: boolean }) {
  const revision = useAuthStore(state => state.revision);
  return <VnpayCheckout key={`${revision}:${props.id}:${props.resale}`} {...props} />;
}

export function LegacyCheckoutFlow({ id, resale = false }: { id: string; resale?: boolean }) {
  const user = useAuthStore(state => state.user);
  const revision = useAuthStore(state => state.revision);
  const cache = useQueryClient();
  const now = useClock();
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<PaymentMethod>('CARD');
  const [recipient, setRecipient] = useState<Recipient>({ name: user?.full_name ?? '', email: user?.email ?? '', phone: user?.phone_number ?? '' });
  const [otp, setOtp] = useState('');
  const [cancel, setCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const lock = useRef(false);
  const path = `${resale ? 'resale/' : ''}orders/${encodeURIComponent(id)}`;
  const checkoutPath = `checkout/${resale ? 'resale' : 'orders'}/${encodeURIComponent(id)}`;
  const query = useQuery({ queryKey: ['commerce', user?.user_id, 'checkout', resale, id], queryFn: () => getCommerce<Order | ResaleOrder>(path), enabled: !!user, retry: 1, refetchInterval: current => !busy && current.state.data?.status === 'PENDING_PAYMENT' ? 15_000 : false });
  const history = useQuery({ queryKey: ['commerce', user?.user_id, 'checkout-sessions', resale, id], queryFn: () => getCommerce<CheckoutHistory>(`${checkoutPath}/sessions`), enabled: !!user && query.isSuccess, retry: 1 });
  const current = history.data?.current;
  const verifying = current?.status === 'AWAITING_AUTH' || current?.status === 'VERIFIED';

  async function act(action: () => Promise<unknown>, after?: () => void) {
    if (lock.current || useAuthStore.getState().revision !== revision) return;
    lock.current = true; setBusy(true); setError(null);
    try {
      await action();
      if (useAuthStore.getState().revision !== revision) return;
      after?.();
    } catch (failure) { if (useAuthStore.getState().revision === revision) setError(failure); }
    finally {
      if (useAuthStore.getState().revision === revision) {
        await Promise.all([query.refetch(), history.refetch(), cache.invalidateQueries({ queryKey: ['public'] })]);
        setBusy(false);
      }
      lock.current = false;
    }
  }
  async function submitDetails(instrument: Record<string, string>) {
    await act(() => postCommerce(`${checkoutPath}/sessions`, { recipient, method, instrument }), () => setOtp(''));
  }
  function submitContact(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(null); setStep(2); }
  if (query.isPending) return <p role="status">Đang tải thông tin thanh toán…</p>;
  if (!query.data) return <Failure error={query.error} retry={() => void query.refetch()} />;
  const order = query.data;
  const original = 'orderId' in order;
  const paid = order.status === 'PAID';
  const pending = order.status === 'PENDING_PAYMENT';
  const expired = now >= Date.parse(order.expiresAt);
  const total = original ? order.totalAmount : order.price;
  const remaining = Math.max(0, Math.ceil((Date.parse(order.expiresAt) - now) / 1000));
  const countdown = `${Math.floor(remaining / 60).toString().padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}`;
  const activeStep = paid ? 4 : verifying ? 3 : step;

  return <div className="checkout">
    <header className="checkout-heading"><div><p className="checkout-eyebrow">TICKETVERSE / ĐẶT VÉ</p><h1>{paid ? 'Đặt vé thành công' : 'Hoàn tất đặt vé'}</h1></div><Link href={resale ? '/account/resale' : '/account/orders'} className="tv-button">Đơn hàng của tôi</Link></header>
    <ol className="checkout-steps" aria-label="Tiến trình thanh toán">{['Thông tin người nhận', 'Thanh toán', 'Xác thực', 'Nhận vé'].map((label, index) => <li key={label} aria-current={activeStep === index + 1 ? 'step' : undefined}><span>{index + 1}</span>{label}</li>)}</ol>
    <p className="checkout-security">Thanh toán mô phỏng phục vụ đồ án. Không nhập thông tin thẻ thật hoặc OTP ngân hàng. Mã xác thực được gửi đến email người nhận vé.</p>
    <div className="checkout-layout">
      <section className="tv-panel space-y-6" aria-busy={busy}>
        {error != null && <Failure error={error} />}
        {query.error && <Failure error={query.error} retry={() => void query.refetch()} />}
        {busy ? <div className="flex min-h-72 flex-col items-center justify-center gap-5 text-center" role="status"><LoaderCircle className="animate-spin text-violet-300" size={40} aria-hidden="true" /><h2 className="text-xl font-semibold">Đang xử lý yêu cầu</h2><p className="tv-muted text-sm">Vui lòng chờ kết quả xác nhận, không cần bấm lại.</p></div> : paid ? <>
          <div className="space-y-3 text-center" role="status"><CheckCircle2 className="mx-auto text-emerald-300" size={48} aria-hidden="true" /><h2 className="text-2xl font-semibold">Thanh toán thành công</h2><p className="tv-muted text-sm">Vé được lưu trong tài khoản của bạn. Mở vé để xem thông tin tham dự và mã QR.</p></div>
          <Link className="tv-button tv-primary w-full" href="/account/tickets">Xem vé của tôi<ArrowRight size={18} aria-hidden="true" /></Link>
          {original && <TicketFiles id={id} order />}
          <PaymentReceipt path={checkoutPath} />
        </> : !pending || expired ? <div className="space-y-4"><h2 className="text-xl font-semibold">{expired ? 'Đơn hàng đã hết hạn' : 'Đơn hàng đã kết thúc'}</h2><p className="tv-muted">Đơn chưa được thanh toán. Vui lòng chọn vé và đặt đơn mới.</p><Link className="tv-button tv-primary" href={resale ? '/pass' : '/events'}>Chọn mua vé</Link></div> : history.isPending ? <p role="status">Đang kiểm tra giao dịch…</p> : history.error ? <Failure error={history.error} retry={() => void history.refetch()} /> : verifying && current ? <>
          <div className="checkout-section-title"><span><LockKeyhole size={22} aria-hidden="true" /></span><div><h3>Xác thực thanh toán</h3><p>{current.instrument.label} · •••• {current.instrument.last4}</p></div></div>
          <div className="checkout-contact"><p>{current.recipient.name}</p><p className="tv-muted">{current.recipient.email} · {current.recipient.phone}</p><p className="mt-3 font-semibold">Số tiền xác nhận: {money(current.amount)}</p></div>
          {current.status === 'VERIFIED' ? <><p className="tv-muted">Thông tin đã được xác thực. Tiếp tục để nhận kết quả giao dịch.</p><button className="tv-button tv-primary w-full" onClick={() => void act(() => postCommerce(`checkout/sessions/${current.sessionId}/confirm`, { otp: '000000' }))}>Kiểm tra kết quả thanh toán</button></> : Date.parse(current.expiresAt) <= now ? <><p role="status">Phiên xác thực đã hết hạn.</p><button className="tv-button" onClick={() => void history.refetch()}>Quay lại thanh toán</button></> : <form className="space-y-5" onSubmit={event => { event.preventDefault(); void act(() => postCommerce(`checkout/sessions/${current.sessionId}/confirm`, { otp }), () => setOtp('')); }}>
            <p className="tv-muted" role="status">Mã OTP đã được gửi đến <strong>{current.recipient.email}</strong>. Vui lòng kiểm tra hộp thư đến hoặc thư rác.</p>
            <p className="checkout-security">Đây là xác thực checkout mô phỏng qua email, không phải OTP ngân hàng và không trừ tiền thật.</p>
            <label className="checkout-label">Mã xác thực email<input className="tv-input checkout-otp" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={change => setOtp(change.target.value.replace(/\D/g, ''))} placeholder="••••••" /></label>
            <p className="checkout-security">Nhập mã 6 chữ số để xác nhận. Còn {current.attemptsRemaining} lần thử. Mã có hiệu lực đến {vietnamDate(current.expiresAt)}.</p>
            <button className="tv-button tv-primary w-full" type="submit">Xác nhận thanh toán {money(current.amount)}</button>
            <button className="tv-button w-full" type="button" onClick={() => void act(() => postCommerce(`checkout/sessions/${current.sessionId}/cancel`), () => { setStep(2); setOtp(''); })}>Đổi phương thức thanh toán</button>
          </form>}
        </> : <>
          {current && ['FAILED', 'CANCELLED', 'EXPIRED'].includes(current.status) && <p className="tv-notice" role="status">Giao dịch trước: {transactionLabels[current.status]}. Bạn có thể thực hiện lại khi đơn còn thời hạn.</p>}
          {step === 1 ? <form onSubmit={submitContact} className="space-y-5"><div className="checkout-section-title"><span><UserRound size={22} aria-hidden="true" /></span><div><h3>Thông tin người nhận vé</h3><p>Kiểm tra thông tin liên hệ và thông tin trên biên nhận.</p></div></div><label className="checkout-label">Họ và tên<input className="tv-input" autoComplete="name" minLength={2} maxLength={150} required value={recipient.name} onChange={change => setRecipient({ ...recipient, name: change.target.value })} /></label><div className="checkout-fields"><label className="checkout-label">Email<input className="tv-input" type="email" autoComplete="email" maxLength={254} required value={recipient.email} onChange={change => setRecipient({ ...recipient, email: change.target.value })} /></label><label className="checkout-label">Số điện thoại<input className="tv-input" type="tel" autoComplete="tel" pattern="(0[0-9]{9}|\+84[0-9]{9})" maxLength={20} required value={recipient.phone} onChange={change => setRecipient({ ...recipient, phone: change.target.value })} /></label></div><button className="tv-button tv-primary w-full">Tiếp tục<ArrowRight size={17} aria-hidden="true" /></button></form> : <>
            <div className="checkout-contact"><div className="flex justify-between gap-4"><strong>{recipient.name}</strong><button className="underline text-violet-300" onClick={() => setStep(1)}>Chỉnh sửa</button></div><p className="tv-muted">{recipient.email} · {recipient.phone}</p></div>
            <PaymentMethods value={method} onChange={value => { setMethod(value); setError(null); }} />
            <PaymentDetails key={method} method={method} amount={total} busy={busy} submit={submitDetails} back={() => setStep(1)} />
          </>}
        </>}
      </section>
      <aside className="tv-panel checkout-summary space-y-5"><div className="flex justify-between gap-3"><h2 className="font-semibold">Đơn hàng của bạn</h2><Status value={order.status} /></div><h3 className="text-lg font-semibold">{original ? order.ticketTypeName : 'Vé nhận chuyển nhượng'}</h3><p className="tv-muted text-sm">{original ? `${order.quantity} vé × ${money(order.unitPrice)}` : '1 vé bán lại'}</p><div className="checkout-total"><span>Tổng thanh toán</span><strong>{money(total)}</strong></div><p className="text-xs tv-muted break-all">Mã đơn: {id}</p>{pending && !expired && <div className="checkout-countdown"><span>Thời gian giữ vé còn lại</span><strong aria-label={`Còn ${Math.floor(remaining / 60)} phút ${remaining % 60} giây`}>{countdown}</strong></div>}{pending && !expired && <button className="tv-button w-full" disabled={busy || current?.status === 'VERIFIED'} onClick={() => setCancel(true)}>Hủy đơn hàng</button>}{order.cancelReason && <p className="text-xs tv-muted">{order.cancelReason}</p>}</aside>
    </div>
    {!!history.data?.history.length && <details className="checkout-history tv-panel"><summary>Lịch sử giao dịch ({history.data.history.length})</summary>{history.data.history.map(item => <article key={item.sessionId}><span>{vietnamDate(item.createdAt)} · {item.instrument.label}</span><span>{transactionLabels[item.status]} · {money(item.amount)}</span></article>)}</details>}
    {cancel && <ConfirmDialog light={false} title="Hủy đơn hàng?" description="Vé đang giữ sẽ được trả lại. Bạn có thể đặt đơn mới sau đó." confirmLabel="Hủy đơn" onClose={() => setCancel(false)} onConfirm={async () => { await postCommerce(`${path}/cancel`); await query.refetch(); await history.refetch(); setCancel(false); }} />}
  </div>;
}
