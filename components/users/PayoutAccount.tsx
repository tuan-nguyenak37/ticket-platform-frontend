'use client';
import { useRef, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPayoutAccount, savePayoutAccount } from '@/lib/commerce/payment';
import type { PayoutAccountInput } from '@/lib/commerce/payment-types';
import { Failure } from '@/components/commerce/shared';
import { usePaymentCooldown } from '@/components/commerce/usePaymentCooldown';
import { useAuthStore } from '@/lib/store/auth.store';
import { dateTime } from '@/lib/commerce/rules';

const bankLabels = { DEMO_VCB: 'Vietcombank', DEMO_TCB: 'Techcombank', DEMO_MB: 'MB' };

export function PayoutAccount() {
  const actor = useAuthStore(state => state.user?.user_id);
  const [editing, setEditing] = useState(false);
  const client = useQueryClient(); const cooldown = usePaymentCooldown(); const lock = useRef(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(null); const [saved, setSaved] = useState(false);
  const query = useQuery({ queryKey: ['payout-account', actor], queryFn: ({ signal }) => getPayoutAccount(signal), retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current || cooldown.remaining) return;
    const data = new FormData(event.currentTarget);
    const body: PayoutAccountInput = { bankCode: String(data.get('bankCode')) as PayoutAccountInput['bankCode'], accountName: String(data.get('accountName')).trim(), accountNumber: String(data.get('accountNumber')) };
    if (body.accountName.length < 2 || body.accountName.length > 100) { setError(new Error('Tên tài khoản cần từ 2 đến 100 ký tự.')); return; }
    if (!Object.hasOwn(bankLabels, body.bankCode) || !/^9900[0-9]{6,12}$/.test(body.accountNumber)) { setError(new Error('Chọn ngân hàng hợp lệ và số tài khoản bắt đầu bằng 9900, gồm 10–16 chữ số.')); return; }
    lock.current = true; setBusy(true); setError(null); setSaved(false);
    try { const result = await savePayoutAccount(body); client.setQueryData(['payout-account', actor], result); setSaved(true); setEditing(false); await client.invalidateQueries({ queryKey: ['commerce', 'revenue'] }); }
    catch (failure) { setError(failure); cooldown.handle(failure); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section id="payout-account" tabIndex={-1} className="tv-panel scroll-mt-24 space-y-4">
    <div><h2 className="font-bold">Tài khoản nhận tiền</h2><p className="mt-2 text-sm leading-6 opacity-70">Bạn có thể đăng vé trước và bổ sung tài khoản sau. Các đơn đủ điều kiện sẽ được hệ thống tự xử lý chi trả.</p></div>
    {query.isPending && <p role="status">Đang tải tài khoản…</p>}
    {query.isError && <Failure error={query.error} retry={() => void query.refetch()} />}
    {error != null && <Failure error={error} />}
    {saved && <p role="status" className="rounded-xl bg-emerald-500/10 p-4">Đã lưu tài khoản. Hệ thống sẽ tự xử lý các đơn đủ điều kiện</p>}
    {cooldown.remaining > 0 && <p role="status">Thử lại sau {cooldown.remaining} giây.</p>}
    {query.isSuccess && !editing && <div className="space-y-3">
      {query.data ? <><p className="font-medium">{bankLabels[query.data.bankCode]} · {query.data.accountName}</p><p aria-label={`Số tài khoản kết thúc bằng ${query.data.accountNumber.slice(-4)}`}>•••• •••• {query.data.accountNumber.slice(-4)}</p><p className="text-xs opacity-60">Cập nhật {dateTime(query.data.updatedAt)}</p></> : <p className="text-sm">Bạn chưa thiết lập tài khoản nhận tiền.</p>}
      <button className="tv-button" onClick={() => { setEditing(true); setSaved(false); setError(null); }}>{query.data ? 'Cập nhật tài khoản' : 'Thêm tài khoản nhận tiền'}</button>
    </div>}
    {query.isSuccess && editing && <form key={query.data?.updatedAt ?? 'new'} onSubmit={submit}><fieldset disabled={busy || cooldown.remaining > 0} className="space-y-3">
      <label className="block">Ngân hàng<select name="bankCode" defaultValue={query.data?.bankCode ?? 'DEMO_VCB'} className="tv-input">{Object.entries(bankLabels).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
      <label className="block">Tên tài khoản<input name="accountName" required minLength={2} maxLength={100} defaultValue={query.data?.accountName ?? ''} className="tv-input" autoComplete="off" /></label>
      <label className="block">Số tài khoản<input name="accountNumber" required pattern="9900[0-9]{6,12}" minLength={10} maxLength={16} inputMode="numeric" defaultValue={query.data?.accountNumber ?? ''} className="tv-input" placeholder="990012345678" autoComplete="off" /></label>
      <p className="text-xs leading-5 opacity-70">Hiện hỗ trợ tài khoản mô phỏng bắt đầu bằng 9900, gồm 10–16 chữ số. Thay đổi tài khoản không ảnh hưởng các khoản đã chi trả.</p>
      <div className="flex flex-wrap gap-3"><button className="tv-button tv-primary">{busy ? 'Đang lưu…' : 'Lưu tài khoản nhận tiền'}</button><button type="button" className="tv-button" onClick={() => { setEditing(false); setError(null); }}>Hủy chỉnh sửa</button></div>
    </fieldset></form>}
  </section>;
}
