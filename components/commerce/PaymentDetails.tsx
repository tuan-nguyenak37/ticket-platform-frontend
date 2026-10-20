'use client';
import { useState, type FormEvent } from 'react';
import { ArrowRight, CreditCard, Landmark, Wallet } from 'lucide-react';
import { money } from '@/lib/api/commerce';
import type { PaymentMethod } from './PaymentMethods';

export function PaymentDetails({ method, amount, busy, submit, back }: {
  method: PaymentMethod; amount: string; busy: boolean;
  submit: (instrument: Record<string, string>) => Promise<void>; back: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const disabled = busy || submitting;
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    setSubmitting(true);
    try { await submit(values); form.reset(); } finally { setSubmitting(false); }
  }
  const Icon = method === 'CARD' ? CreditCard : method === 'WALLET' ? Wallet : Landmark;
  return <form onSubmit={event => void send(event)} className="space-y-6" autoComplete="off">
    <div className="checkout-section-title"><span><Icon size={22} aria-hidden="true" /></span><div><h3>Thông tin thanh toán</h3><p>Kiểm tra thông tin trước khi chuyển sang xác thực.</p></div></div>
    <fieldset disabled={disabled} className="space-y-5">
      {method === 'CARD' ? <>
        <label className="checkout-label">Số thẻ<input className="tv-input" name="number" inputMode="numeric" pattern="[0-9 ]{16,23}" maxLength={23} placeholder="0000 0000 0000 0000" required /></label>
        <label className="checkout-label">Tên chủ thẻ<input className="tv-input uppercase" name="holder" maxLength={150} minLength={2} placeholder="NGUYEN VAN A" required /></label>
        <div className="checkout-fields"><label className="checkout-label">Ngày hết hạn<input className="tv-input" name="expiry" inputMode="numeric" placeholder="MM/YY" pattern="(0[1-9]|1[0-2])/[0-9]{2}" maxLength={5} required /></label><label className="checkout-label">Mã bảo mật<input className="tv-input" name="cvv" type="password" inputMode="numeric" pattern="[0-9]{3}" maxLength={3} placeholder="CVV" required /></label></div>
      </> : method === 'WALLET' ? <><div className="checkout-payment-brand">Ví TicketVerse</div><label className="checkout-label">Số điện thoại ví<input className="tv-input" type="tel" name="phone" pattern="0[0-9]{9}" maxLength={10} placeholder="Số điện thoại 10 chữ số" required /></label></> : <>
        <label className="checkout-label">Ngân hàng<select className="tv-input" name="bank" required defaultValue=""><option value="" disabled>Chọn ngân hàng</option><option>TicketVerse Bank</option><option>TV Digital Bank</option></select></label>
        <label className="checkout-label">Số tài khoản<input className="tv-input" name="account" inputMode="numeric" pattern="[0-9]{6,20}" minLength={6} maxLength={20} required /></label>
        <label className="checkout-label">Tên chủ tài khoản<input className="tv-input" name="holder" minLength={2} maxLength={150} required /></label>
      </>}
    </fieldset>
    <p className="checkout-security">Thông tin xác thực không được lưu trong biên nhận hoặc lịch sử giao dịch.</p>
    <div className="checkout-actions"><button className="tv-button" type="button" disabled={disabled} onClick={back}>Quay lại</button><button className="tv-button tv-primary" disabled={disabled}>{disabled ? 'Đang kiểm tra…' : `Tiếp tục · ${money(amount)}`}<ArrowRight size={16} aria-hidden="true" /></button></div>
  </form>;
}
