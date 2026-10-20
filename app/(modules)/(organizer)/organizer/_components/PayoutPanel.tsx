'use client';
import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/auth.store';
import { organizerApi, type PayoutAccount } from '../_lib/organizer.api';

export function PayoutPanel({ organizerId, editable = true, onSkip }: { organizerId: string; editable?: boolean; onSkip?: () => void }) {
  const revision = useAuthStore(state => state.revision);
  const userId = useAuthStore(state => state.user?.user_id);
  const client = useQueryClient();
  const key = ['organizer', userId, revision, organizerId, 'payout'];
  const { data, error, isPending, refetch } = useQuery({ queryKey: key, queryFn: ({ signal }) => organizerApi.payout(organizerId, signal) });
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const body: PayoutAccount = { bankName: String(fields.get('bankName') ?? '').trim(), accountHolder: String(fields.get('accountHolder') ?? '').trim(), accountNumber: String(fields.get('accountNumber') ?? '').trim() };
    if (body.bankName.length < 2 || body.accountHolder.length < 2 || !/^[0-9]{6,30}$/.test(body.accountNumber)) { setMessage('Kiểm tra tên ngân hàng, chủ tài khoản và số tài khoản (6–30 chữ số).'); return; }
    setBusy(true); setMessage('');
    try {
      await organizerApi.savePayout(organizerId, body);
      if (useAuthStore.getState().revision !== revision) return;
      await client.invalidateQueries({ queryKey: key });
      setEditing(false); setMessage('Đã lưu thông tin tài khoản nhận tiền.');
    } catch (failure) { if (useAuthStore.getState().revision === revision) setMessage(failure instanceof Error ? failure.message : 'Không thể lưu.'); }
    finally { setBusy(false); }
  }
  return <section className="tv-panel space-y-5"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-fuchsia-300">Ban tổ chức</p><h2 className="mt-2 text-xl font-semibold">Tài khoản nhận tiền</h2><p className="mt-2 tv-muted">Chỉ lưu thông tin — chưa xác minh hoặc thực hiện chi trả. Có thể bỏ qua và bổ sung sau.</p></div>
    {isPending && <p role="status">Đang tải thông tin…</p>}{error && <p role="alert">Không thể tải tài khoản. <button className="underline" onClick={() => void refetch()}>Thử lại</button></p>}
    {!isPending && !error && !editing && <div className="space-y-3">{data ? <p>{data.bankName} · {data.accountHolder} · ••••{data.accountNumber.slice(-4)}</p> : <p className="tv-muted">Chưa thiết lập. Việc gửi duyệt sự kiện không phụ thuộc mục này.</p>}{editable && <button className="tv-button" onClick={() => setEditing(true)}>{data ? 'Chỉnh sửa' : 'Thêm tài khoản'}</button>}</div>}
    {editing && <form onSubmit={save} className="space-y-4" onChange={() => setMessage('')}><p className="tv-notice">Thay đổi này áp dụng cho Ban tổ chức, không chỉ sự kiện hiện tại.</p><label className="block">Tên ngân hàng<input className="tv-input" name="bankName" required minLength={2} maxLength={100} defaultValue={data?.bankName ?? ''} /></label><label className="block">Tên chủ tài khoản<input className="tv-input" name="accountHolder" required minLength={2} maxLength={100} defaultValue={data?.accountHolder ?? ''} /></label><label className="block">Số tài khoản<input className="tv-input" name="accountNumber" required inputMode="numeric" pattern="[0-9]{6,30}" defaultValue={data?.accountNumber ?? ''} autoComplete="off" /></label><div className="flex flex-wrap gap-3"><button disabled={busy} className="tv-button tv-primary">{busy ? 'Đang lưu…' : 'Lưu tài khoản'}</button><button type="button" disabled={busy} className="tv-button" onClick={() => setEditing(false)}>Hủy</button></div></form>}
    {message && <p role="status" className="tv-notice">{message}</p>}{onSkip && <button type="button" className="tv-button" onClick={onSkip}>Bỏ qua, xem lại sự kiện</button>}
  </section>;
}
