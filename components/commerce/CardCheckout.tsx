'use client';
import { useState, type FormEvent } from 'react';
import { CreditCard, LockKeyhole, ArrowRight, LoaderCircle } from 'lucide-react';
import { money } from '@/lib/commerce/rules';
import type { DemoCard } from '@/lib/commerce/payment-types';
import type { OrderDetail } from '@/lib/commerce/types';

export function CardCheckout({ order, busy, onPay }: { order: OrderDetail; busy: boolean; onPay: (card: DemoCard) => Promise<void> }) {
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !accepted) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const card = { cardNumber: String(data.get('cardNumber')).replace(/[ -]/g, ''), holderName: String(data.get('holderName')).trim(), expiryMonth: Number(data.get('expiryMonth')), expiryYear: Number(data.get('expiryYear')), cvv: String(data.get('cvv')) };
    if (!['4242424242424242', '4000000000000002'].includes(card.cardNumber)) { setError('Hệ thống hiện chỉ nhận thẻ thử nghiệm: 4242 4242 4242 4242 để thanh toán, hoặc 4000 0000 0000 0002 để thử trường hợp bị từ chối. Số thẻ khác chưa được hỗ trợ.'); return; }
    if (card.holderName.length < 2 || card.holderName.length > 100 || !/^\d{3}$/.test(card.cvv) || Date.UTC(card.expiryYear, card.expiryMonth, 1) <= Date.now()) { setError('Kiểm tra tên chủ thẻ, hạn thẻ và mã bảo mật 3 chữ số.'); return; }
    setError('');
    try { await onPay(card); } finally { const cvv = form.elements.namedItem('cvv') as HTMLInputElement | null; if (cvv) cvv.value = ''; }

  }
  return <section aria-label="Thanh toán bằng thẻ" className="overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-slate-900 via-[#181129] to-slate-950 text-white shadow-2xl">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-5 sm:px-8"><div className="flex items-center gap-3"><span className="rounded-xl bg-violet-400/15 p-3 text-violet-300"><CreditCard size={22} /></span><div><h2 className="text-xl font-semibold">Thanh toán</h2><p className="mt-1 text-sm text-slate-400">Hoàn tất đơn hàng của bạn</p></div></div></div>
    <div className="grid lg:grid-cols-[1.2fr_1fr]">
      <form onSubmit={submit} className="space-y-6 p-6 sm:p-8">
        <div className="flex items-center justify-between rounded-xl border border-violet-400/60 bg-violet-500/10 p-4"><span className="flex items-center gap-3 font-medium"><span className="size-4 rounded-full border-4 border-violet-400 bg-white" />Thẻ thanh toán</span><CreditCard size={22} className="text-violet-300" /></div>

        <fieldset disabled={busy} className="space-y-4"><label className="block text-slate-300">Số thẻ<input name="cardNumber" placeholder="xxxx xxxx xxxx xxxx" required maxLength={23} inputMode="numeric" className="tv-input font-mono" autoComplete="off" /></label><label className="block text-slate-300">Tên chủ thẻ<input name="holderName" placeholder="xxxx" required minLength={2} maxLength={100} className="tv-input" autoComplete="off" /></label><div className="grid grid-cols-2 gap-4"><label className="block text-slate-300">Tháng hết hạn<input name="expiryMonth" placeholder="xx" type="number" min={1} max={12} required className="tv-input" autoComplete="off" /></label><label className="block text-slate-300">Mã bảo mật<input name="cvv" placeholder="xxx" type="password" required pattern="[0-9]{3}" maxLength={3} inputMode="numeric" className="tv-input" autoComplete="off" /></label></div>
          <label className="block text-slate-300">Năm hết hạn<input name="expiryYear" type="number" placeholder="xxxx" min={2026} max={2099} required className="tv-input" /></label>
{error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
          <label className="flex items-start gap-3 text-sm leading-6 text-slate-300"><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} required className="mt-1 size-4 accent-violet-500" />Tôi đã kiểm tra thông tin vé và số tiền thanh toán.</label>
          <button type="submit" disabled={busy || !accepted} className="flex w-full items-center justify-center gap-3 rounded-xl bg-violet-600 px-5 py-4 font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50">{busy ? <><LoaderCircle size={19} className="animate-spin" />Đang xử lý thanh toán…</> : <>Thanh toán {money(order.amount)}<ArrowRight size={19} /></>}</button>
        </fieldset>
      </form>
      <aside className="space-y-6 border-t border-white/10 bg-black/15 p-6 sm:p-8 lg:border-l lg:border-t-0"><p className="text-xs font-semibold uppercase tracking-[.2em] text-violet-300">Đơn hàng của bạn</p><div><h3 className="text-2xl font-semibold leading-tight">{order.ticket.eventName}</h3><p className="mt-3 text-slate-400">{order.ticket.ticketTier} · {order.ticket.seatInfo || 'Không chỉ định ghế'}</p></div><dl className="space-y-4 border-y border-dashed border-white/20 py-6 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-400">Số lượng</dt><dd>01 vé</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-400">Giá vé</dt><dd>{money(order.amount)}</dd></div></dl><div><p className="text-sm text-slate-400">Tổng thanh toán</p><p className="mt-2 text-3xl font-semibold tracking-tight">{money(order.amount)}</p></div><p className="break-all text-xs leading-5 text-slate-500">Mã đơn: {order.order_id}</p><div className="flex items-start gap-3 rounded-xl bg-white/5 p-4 text-sm leading-6 text-slate-400"><LockKeyhole size={20} className="mt-1 shrink-0 text-violet-300" /><p>Vé sẽ xuất hiện trong đơn hàng sau khi thanh toán được xác nhận.</p></div></aside>
    </div>
  </section>;
}
