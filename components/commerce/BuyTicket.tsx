'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
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
  const lock = useRef(false);
  const pending = useRef<{ storageKey: string; key: string } | null>(null);
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
    if (!user) return;
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    let completed = false;
    try {
      const storageKey = `ticketverse-order:${user.user_id}:${ticket.ticketTypeId}:${quantity}`;
      if (pending.current?.storageKey !== storageKey) {
        let key: string | null = null;
        try { key = sessionStorage.getItem(storageKey); } catch {}
        pending.current = { storageKey, key: key || crypto.randomUUID() };
        try { sessionStorage.setItem(storageKey, pending.current.key); } catch {}
      }
      const order = await postCommerce<Order>('orders', { ticketTypeId: ticket.ticketTypeId, quantity }, pending.current.key);
      try { sessionStorage.removeItem(storageKey); } catch {}
      pending.current = null;
      if (useAuthStore.getState().user?.user_id !== user.user_id) return;
      void cache.invalidateQueries({ queryKey: ['public', 'ticket-types'] });
      void cache.invalidateQueries({ queryKey: ['commerce'] });
      completed = true;
      router.push(`/checkout/orders/${encodeURIComponent(order.orderId)}`);
    } catch (failure) {
      if (formatHttpError(failure).statusCode === 409 && pending.current) {
        try { sessionStorage.removeItem(pending.current.storageKey); } catch {}
        pending.current = null;
      }
      setError(failure);
    }
    finally { if (!completed) { lock.current = false; setBusy(false); } }
  }
  return <div className="space-y-3 border-t border-white/10 pt-4">
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <div>
        <h4 className="text-base font-semibold">{ticket.name}</h4>
        {ticket.description && <p className="mt-1 text-xs tv-muted">{ticket.description}</p>}
      </div>
      <p className="text-lg font-semibold text-[#d2adff]">{money(ticket.price)}</p>
    </div>
    <div className="flex flex-wrap items-center gap-3 text-xs tv-muted">
      <span>Tồn khả dụng: <strong className={ticket.availableQuantity > 0 ? 'text-white' : 'text-rose-300'}>{ticket.availableQuantity}</strong> vé</span>
      <span>·</span>
      <span>Tối đa {limit} vé/đơn</span>
      {notStarted && ticket.saleStartAt && <span>· Mở bán: {vietnamDate(ticket.saleStartAt)}</span>}
      {open && ticket.saleEndAt && <span>· Đóng bán: {vietnamDate(ticket.saleEndAt)}</span>}
    </div>
    <form className="flex flex-wrap items-center gap-4 pt-1" onSubmit={event => { event.preventDefault(); run(buy); }}>
      <div className="flex items-center gap-2">
        <span className="text-xs tv-muted">Số lượng:</span>
        <div className="flex items-center rounded-xl border border-white/15 bg-white/5">
          <button
            type="button"
            className="px-3 py-1.5 text-base font-semibold transition hover:bg-white/10 disabled:opacity-30"
            disabled={busy || !open || quantity <= 1}
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            aria-label="Giảm 1 vé"
          >
            −
          </button>
          <span className="min-w-8 text-center text-sm font-semibold tabular-nums">{quantity}</span>
          <button
            type="button"
            className="px-3 py-1.5 text-base font-semibold transition hover:bg-white/10 disabled:opacity-30"
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
        className="tv-button tv-primary !min-h-[42px] px-5"
        disabled={busy || restoring || !open || !Number.isInteger(quantity) || quantity < 1 || quantity > limit}
      >
        {busy ? 'Đang mua vé…' : label}
      </button>
    </form>
    {error != null && <Failure error={error} />}
  </div>;
}
