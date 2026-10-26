'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/lib/auth/auth.store';
import { useAuthenticatedAction } from '@/lib/auth/useAuthenticatedAction';
import { formatHttpError } from '@/lib/api/http-errors';
import { postCommerce, money, vietnamDate, type Order } from '@/lib/api/commerce';
import { Failure } from '@/components/ui/commerce';
import { useClock } from './shared';
import type { PublicTicketType } from '@/app/_lib/public-events';

export function BuyTicket({ ticket, startTime }: { ticket: PublicTicketType; startTime: string }) {
  const router = useRouter();
  const cache = useQueryClient();
  const { run, restoring } = useAuthenticatedAction();
  const now = useClock();
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [discountCode, setDiscountCode] = useState('');
  const userId = useAuthStore(state => state.user?.user_id);
  const previousUser = useRef(userId);
  const pending = useRef<{ storageKey: string; key: string } | null>(null);
  useEffect(() => {
    if (previousUser.current && previousUser.current !== userId) { setDiscountCode(''); setError(null); pending.current = null; }
    previousUser.current = userId;
  }, [userId]);
  const lock = useRef(false);
  const limit = Math.min(ticket.maxPerOrder, ticket.availableQuantity, 20);
  const configured = !!ticket.saleStartAt && !!ticket.saleEndAt;
  const isSoldOut = ticket.availableQuantity <= 0;
  const isPastShow = now >= Date.parse(startTime);
  const notStarted = !configured || now < Date.parse(ticket.saleStartAt!);
  const isClosed = !notStarted && (now >= Date.parse(ticket.saleEndAt!) || isPastShow);
  const open = configured && !notStarted && !isClosed && !isSoldOut;
  const label = isPastShow ? 'Suất diễn đã bắt đầu' : notStarted ? 'Chưa mở bán' : isSoldOut ? 'Đã hết vé' : isClosed ? 'Đã đóng bán' : 'Mua vé';
  const subtotal = Number.isSafeInteger(Number(ticket.price)) ? BigInt(ticket.price) * BigInt(Math.max(1, quantity)) : null;
  async function buy() {
    const user = useAuthStore.getState().user;
    const revision = useAuthStore.getState().revision;
    if (!user) return;
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    let completed = false;
    try {
      const body = { ticketTypeId: ticket.ticketTypeId, quantity, ...(discountCode.trim() ? { discountCode: discountCode.trim().toUpperCase() } : {}) };
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(body)));
      if (useAuthStore.getState().revision !== revision) return;
      const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2,'0')).join('');
      const storageKey = `ticketverse-order:${user.user_id}:${ticket.ticketTypeId}:${fingerprint}`;
      if (pending.current?.storageKey !== storageKey) {
        let key: string | null = null;
        try { key = sessionStorage.getItem(storageKey); } catch {}
        pending.current = { storageKey, key: key || crypto.randomUUID() };
        try { sessionStorage.setItem(storageKey, pending.current.key); } catch {}
      }
      const order = await postCommerce<Order>('orders', body, pending.current.key);
      try { sessionStorage.removeItem(storageKey); } catch {}
      pending.current = null;
      if (useAuthStore.getState().revision !== revision) return;
      void cache.invalidateQueries({ queryKey: ['public', 'ticket-types'] });
      void cache.invalidateQueries({ queryKey: ['commerce'] });
      completed = true;
      router.push(`/checkout/orders/${encodeURIComponent(order.orderId)}`);
    } catch (failure) {
      if (formatHttpError(failure).statusCode === 409 && pending.current) {
        try { sessionStorage.removeItem(pending.current.storageKey); } catch {}
        pending.current = null;
      }
      if (useAuthStore.getState().revision === revision) setError(failure);
    }
    finally { if (!completed) { lock.current = false; setBusy(false); } }
  }
  return <details className="tv-ticket-choice">
    <summary className="flex flex-wrap items-center justify-between gap-3">
      <span className="min-w-0 flex-1"><strong className="block text-pretty text-base">{ticket.name}</strong><span className="mt-1 block text-xs tv-muted">{open ? 'Chọn số lượng vé' : label}</span></span>
      <span className="text-base font-semibold tabular-nums text-[#d2adff]">{money(ticket.price)}</span><ChevronDown size={18} className="tv-disclosure-chevron shrink-0" aria-hidden="true" />
    </summary>
    <div className="space-y-4 border-t border-white/10 p-4 sm:p-5">
    {ticket.description && <p className="text-pretty text-sm leading-6 tv-muted">{ticket.description}</p>}
    <div className="flex flex-wrap items-center gap-3 text-xs tv-muted">
      <span>Tồn khả dụng: <strong className={ticket.availableQuantity > 0 ? 'text-white' : 'text-rose-300'}>{ticket.availableQuantity}</strong> vé</span>
      <span>·</span>
      <span>Tối đa {limit} vé/đơn</span>
      {notStarted && ticket.saleStartAt && <span>· Mở bán: {vietnamDate(ticket.saleStartAt)}</span>}
      {open && ticket.saleEndAt && <span>· Đóng bán: {vietnamDate(ticket.saleEndAt)}</span>}
    </div>
    <form className="flex flex-wrap items-center gap-4 pt-1" onSubmit={event => { event.preventDefault(); run(buy); }}>
      <fieldset className="w-full space-y-3" disabled={busy || !open}>
        <label className="block text-sm">Mã giảm giá (tùy chọn)<input className="tv-input" value={discountCode} onChange={event => setDiscountCode(event.target.value)} maxLength={32} minLength={3} pattern="(?:[A-Za-z0-9_]|-){3,32}" autoComplete="off" placeholder="Nhập mã từ ban tổ chức" /></label><p className="text-xs tv-muted">Mã được kiểm tra và tính tiền trên máy chủ khi tạo đơn. Xem tổng sau giảm tại bước thanh toán.</p>
      </fieldset>
      <div className="flex items-center gap-2">
        <span className="text-xs tv-muted">Số lượng:</span>
        <div className="flex items-center rounded-xl border border-white/15 bg-white/5">
          <button
            type="button"
            className="min-h-11 min-w-11 rounded-xl text-base font-semibold hover:bg-white/10 disabled:opacity-30"
            disabled={busy || !open || quantity <= 1}
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            aria-label="Giảm 1 vé"
          >
            −
          </button>
          <span className="min-w-8 text-center text-sm font-semibold tabular-nums">{quantity}</span>
          <button
            type="button"
            className="min-h-11 min-w-11 rounded-xl text-base font-semibold hover:bg-white/10 disabled:opacity-30"
            disabled={busy || !open || quantity >= limit}
            onClick={() => setQuantity(q => Math.min(limit, q + 1))}
            aria-label="Tăng 1 vé"
          >
            +
          </button>
        </div>
      </div>
      {subtotal !== null && open && (
        <span className="text-xs tv-muted">Tạm tính: <strong className="text-sm text-white">{money(subtotal.toString())}</strong></span>
      )}
      <button
        className="tv-button tv-primary ml-auto px-5"
        disabled={busy || restoring || !open || !Number.isInteger(quantity) || quantity < 1 || quantity > limit}
      >
        {busy ? 'Đang mua vé…' : label}
      </button>
    </form>
    {error != null && <Failure error={error} />}
    </div>
  </details>;
}
