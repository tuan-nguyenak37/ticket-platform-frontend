'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { transferOrder } from '@/lib/commerce/payment';
import { useAuthStore } from '@/lib/store/auth.store';
import { money } from '@/lib/commerce/rules';
import { Failure } from './shared';
import { usePaymentCooldown } from './usePaymentCooldown';
import { AppApiError } from '@/lib/http/http-errors';

export function TransferForm({ id, kind, amount, disabled }: { id: string; kind: 'refund' | 'payout'; amount: string; disabled: boolean }) {
  const actor = useAuthStore(s => s.user?.user_id); const client = useQueryClient(); const lock = useRef(false); const cooldown = usePaymentCooldown();
  const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(null); const [message, setMessage] = useState('');
  const reasonInput = useRef<HTMLTextAreaElement>(null);
  const storageKey = `ticketverse:transfer:${actor}:${id}:${kind}`;
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved && reasonInput.current) reasonInput.current.value = JSON.parse(saved).reason;
    } catch { /* Submit reports storage failures before making a transfer. */ }
  }, [storageKey]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current || disabled || !actor || cooldown.remaining) return;
    const reason = String(new FormData(event.currentTarget).get('reason') ?? '').trim();
    if (!reason || reason.length > 1000) { setError(new Error('Lý do phải có từ 1 đến 1000 ký tự.')); return; }
    lock.current = true; setBusy(true); setError(null); setMessage('');
    try {
      const raw = sessionStorage.getItem(storageKey);
      const saved: { key: string; reason: string } | null = raw ? JSON.parse(raw) : null;
      if (saved && saved.reason !== reason) throw new Error('Lần gửi trước chưa được xác nhận. Giữ nguyên lý do khi thử lại; tải lại lịch sử để kiểm tra kết quả trước khi thay đổi.');
      const operation = saved ?? { key: crypto.randomUUID(), reason };
      sessionStorage.setItem(storageKey, JSON.stringify(operation));
      const result = await transferOrder(id, kind, operation.reason, operation.key);
      client.setQueryData(['commerce', 'order', true, id], result);
      setMessage(kind === 'refund' ? 'Đã xác nhận hoàn tiền.' : 'Đã xác nhận chi trả.');
    } catch (failure) {
      setError(failure); cooldown.handle(failure);
      if (failure instanceof AppApiError && [400, 403, 404].includes(failure.statusCode)) {
        try { sessionStorage.removeItem(storageKey); } catch { /* Preserve the original error. */ }
      }
    }
    finally {
      await Promise.allSettled([client.invalidateQueries({ queryKey: ['commerce', 'order', true, id] }), client.invalidateQueries({ queryKey: ['commerce', 'orders'] }), client.invalidateQueries({ queryKey: ['commerce', 'payment-history', id] }), client.invalidateQueries({ queryKey: ['commerce', 'managed-payments'] })]);
      lock.current = false; setBusy(false);
    }
  }
  return <form className="tv-panel space-y-4" onSubmit={submit}><h2 className="font-bold">{kind === 'refund' ? 'Hoàn tiền' : 'Chi trả người bán'} · Thử nghiệm</h2><p className="text-2xl font-semibold">{money(amount)}</p>{error != null && <Failure error={error} />}{message && <p role="status">{message}</p>}{cooldown.remaining > 0 && <p>Thử lại sau {cooldown.remaining} giây.</p>}<fieldset disabled={disabled || busy || cooldown.remaining > 0} className="space-y-3"><label className="block">Lý do xử lý<textarea ref={reasonInput} name="reason" required maxLength={1000} rows={3} className="tv-input" /></label><label className="flex items-start gap-2"><input type="checkbox" required className="mt-1" />Tôi đã kiểm tra giao dịch và số tiền cần xử lý.</label><p className="text-sm opacity-70">{kind === 'refund' ? 'Hoàn toàn bộ số tiền người mua đã trả.' : 'Chi trả tiền thực nhận sau phí, vào tài khoản thử nghiệm của người bán. Tài khoản phải hoạt động và có thông tin nhận tiền.'}</p><button className="tv-button tv-primary">{busy ? 'Đang xử lý…' : kind === 'refund' ? 'Xác nhận hoàn tiền' : 'Xác nhận chi trả'}</button></fieldset></form>;
}
