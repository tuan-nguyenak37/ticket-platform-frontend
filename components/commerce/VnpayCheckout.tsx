'use client';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/lib/auth/auth.store';
import { getCommerce, postCommerce, money, type Order, type ResaleOrder } from '@/lib/api/commerce';
import { Failure } from '@/components/ui/commerce';
import { TicketFiles } from './TicketFiles';
import { Status, useClock } from './shared';
import type { Recipient } from './checkout.types';
import './checkout.css';

type Transaction = {
  txnRef: string; status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REVIEW';
  amount: string; expiresAt: string; failureCode: string | null; paymentId: string | null;
  recipient: Recipient;
};

export function VnpayCheckout({ id, resale = false }: { id: string; resale?: boolean }) {
  const user = useAuthStore(state => state.user);
  const revision = useAuthStore(state => state.revision);
  const now = useClock();
  const cache = useQueryClient();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [recipient, setRecipient] = useState<Recipient>({ name: user?.full_name ?? '', email: user?.email ?? '', phone: user?.phone_number ?? '' });
  const path = `${resale ? 'resale/' : ''}orders/${encodeURIComponent(id)}`;
  const paymentPath = `payments/vnpay/${resale ? 'resale' : 'orders'}/${encodeURIComponent(id)}`;
  const order = useQuery({
    queryKey: ['commerce', user?.user_id, 'vnpay-order', resale, id],
    queryFn: () => getCommerce<Order | ResaleOrder>(path), enabled: !!user, retry: 1,
    refetchInterval: query => query.state.data?.status === 'PENDING_PAYMENT' ? 5000 : false,
  });
  const payment = useQuery({
    queryKey: ['commerce', user?.user_id, 'vnpay-payment', resale, id],
    queryFn: () => getCommerce<{ current: Transaction | null }>(paymentPath),
    enabled: !!user && order.isSuccess, retry: 1,
    refetchInterval: query => query.state.data?.current?.status === 'PENDING' ? 5000 : false,
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || useAuthStore.getState().revision !== revision) return;
    lock.current = true; setBusy(true); setError(null);
    try {
      const result = await postCommerce<{ paymentUrl: string | null; free?: boolean }>(paymentPath, { recipient });
      if (useAuthStore.getState().revision !== revision) return;
      if (result.free) {
        await Promise.all([order.refetch(), payment.refetch(), cache.invalidateQueries({ queryKey: ['public'] })]);
        return;
      }
      const url = new URL(result.paymentUrl ?? '');
      if (url.origin !== 'https://sandbox.vnpayment.vn' || url.pathname !== '/paymentv2/vpcpay.html' || url.username || url.password) throw new Error('Địa chỉ thanh toán không hợp lệ.');
      window.location.assign(url.toString());
    } catch (failure) {
      if (useAuthStore.getState().revision === revision) setError(failure);
    } finally {
      lock.current = false;
      if (useAuthStore.getState().revision === revision) setBusy(false);
    }
  }

  if (order.isPending) return <p role="status">Đang tải đơn hàng…</p>;
  if (order.isError) return <Failure error={order.error} retry={() => void order.refetch()} />;
  const details = order.data;
  const amount = 'totalAmount' in details ? details.totalAmount : details.price;
  const paid = details.status === 'PAID';
  const current = payment.data?.current;
  const remaining = Math.max(0, Math.ceil((Date.parse(details.expiresAt) - now) / 1000));
  const canPay = details.status === 'PENDING_PAYMENT' && remaining > 0 && current?.status !== 'REVIEW' && current?.status !== 'SUCCEEDED';
  const awaiting = current?.status === 'PENDING';
  const displayedRecipient = awaiting ? current.recipient : recipient;
  const activeStep = paid ? 3 : awaiting ? 2 : 1;

  return <div className="checkout">
    <header className="checkout-heading"><div><p className="checkout-eyebrow">TICKETVERSE / VNPAY SANDBOX</p><h1>{paid ? 'Đặt vé thành công' : 'Hoàn tất đặt vé'}</h1></div><Link className="tv-button" href={resale ? '/account/resale' : '/account/orders'}>Đơn hàng của tôi</Link></header>
    <ol className="checkout-steps checkout-steps-vnpay" aria-label="Tiến trình thanh toán">{['Thông tin người nhận', 'Thanh toán VNPay', 'Nhận vé'].map((label, index) => <li key={label} aria-current={activeStep === index + 1 ? 'step' : undefined}><span>{index + 1}</span>{label}</li>)}</ol>
    <p className="checkout-security">Môi trường thử nghiệm VNPay Sandbox, không thu tiền thật. Chỉ dùng tài khoản/thẻ thử nghiệm do VNPay cung cấp. Không nhập thẻ hoặc OTP ngân hàng trên TicketVerse.</p>
    <div className="checkout-layout">
      <section className="tv-panel space-y-6" aria-busy={busy}>
        {error != null && <Failure error={error} />}
        {payment.error && <Failure error={payment.error} retry={() => void payment.refetch()} />}
        {current?.status === 'REVIEW' ? <div role="status" className="space-y-3"><h2 className="text-xl font-semibold">Giao dịch cần đối soát</h2><p>VNPay đã báo thanh toán thành công nhưng hệ thống chưa thể hoàn tất đơn. Không thanh toán lại. Vui lòng liên hệ hỗ trợ với mã giao dịch {current.txnRef}.</p></div> : paid ? <div className="space-y-5"><CheckCircle2 className="text-emerald-300" size={44} aria-hidden="true" /><h2 className="text-xl font-semibold">Đơn hàng đã thanh toán</h2><p>Vé được lưu trong tài khoản. Trạng thái này lấy từ backend, không dựa vào thông tin trên URL chuyển hướng.</p><Link className="tv-button tv-primary" href="/account/tickets">Xem vé của tôi</Link>{!resale && <TicketFiles id={id} order />}</div> : <>
          {awaiting && <div className="checkout-contact" role="status"><strong>Đang chờ xác nhận từ VNPay</strong><p>Hệ thống tự kiểm tra mỗi 5 giây. Nếu đã hoàn tất tại VNPay, hãy chờ IPN; quay lại trang này chưa đồng nghĩa với thanh toán thành công.</p></div>}
          {current?.status === 'FAILED' && <p role="status" className="tv-notice">VNPay chưa thanh toán thành công (mã {current.failureCode}). Bạn có thể thử lại khi đơn còn thời hạn.</p>}
          {!canPay ? <div className="space-y-3"><h2 className="text-xl font-semibold">Đơn không còn khả dụng để thanh toán</h2><p>Nếu đã thanh toán tại VNPay, không thanh toán thêm; chờ hệ thống xác nhận hoặc liên hệ hỗ trợ.</p><Link className="tv-button" href={resale ? '/pass' : '/events'}>Xem sự kiện</Link></div> : <form onSubmit={event => void submit(event)} className="space-y-5">
            <div className="checkout-section-title"><span><ShieldCheck aria-hidden="true" /></span><div><h3>Thông tin người nhận vé</h3><p>Bạn sẽ chọn phương thức và xác thực thanh toán trên trang VNPay.</p></div></div>
            <fieldset disabled={busy || awaiting} className="space-y-5">
              <label className="checkout-label">Họ và tên<input className="tv-input" autoComplete="name" required minLength={2} maxLength={150} value={displayedRecipient.name} onChange={event => setRecipient({ ...recipient, name: event.target.value })} /></label>
              <div className="checkout-fields"><label className="checkout-label">Email liên hệ<input className="tv-input" type="email" autoComplete="email" required maxLength={254} value={displayedRecipient.email} onChange={event => setRecipient({ ...recipient, email: event.target.value })} /></label><label className="checkout-label">Số điện thoại<input className="tv-input" type="tel" autoComplete="tel" required pattern="(0[0-9]{9}|\+84[0-9]{9})" maxLength={20} value={displayedRecipient.phone} onChange={event => setRecipient({ ...recipient, phone: event.target.value })} /></label></div>
            </fieldset>
            <p className="checkout-security">Vé thuộc tài khoản đang đăng nhập. Nếu bật gửi email vé, hệ thống gửi đến email của tài khoản; email liên hệ được lưu cùng giao dịch.</p>
            <button className="tv-button tv-primary w-full" disabled={busy || payment.isPending || payment.isError || (awaiting && Date.parse(current.expiresAt) <= now)}>{busy ? 'Đang tạo yêu cầu…' : amount === '0' ? 'Hoàn tất nhận vé miễn phí' : awaiting ? 'Tiếp tục giao dịch VNPay đang chờ' : `Thanh toán qua VNPay · ${money(amount)}`}<ArrowRight size={17} aria-hidden="true" /></button>
          </form>}
        </>}
      </section>
      <aside className="tv-panel checkout-summary space-y-5"><div className="flex justify-between gap-3"><h2 className="font-semibold">Đơn hàng của bạn</h2><Status value={details.status} /></div><h3>{'ticketTypeName' in details ? details.ticketTypeName : 'Vé nhận chuyển nhượng'}</h3>{'quantity' in details && <p className="tv-muted">{details.quantity} vé × {money(details.unitPrice)}</p>}<div className="checkout-total"><span>Tổng thanh toán</span><strong>{money(amount)}</strong></div><p className="checkout-security break-all">Mã đơn: {id}</p>{current && <p className="checkout-security break-all">Mã giao dịch: {current.txnRef}</p>}{canPay && <div className="checkout-countdown"><span>Thời gian giữ vé</span><strong>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</strong></div>}</aside>
    </div>
  </div>;
}
