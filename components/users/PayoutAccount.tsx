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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof PayoutAccountInput, string>>>({});
  const [editing, setEditing] = useState(false);
  const client = useQueryClient(); const cooldown = usePaymentCooldown(); const lock = useRef(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(null); const [saved, setSaved] = useState(false);
  const query = useQuery({ queryKey: ['payout-account', actor], queryFn: ({ signal }) => getPayoutAccount(signal), retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current || cooldown.remaining) return;
    const data = new FormData(event.currentTarget);
    const body: PayoutAccountInput = { bankCode: String(data.get('bankCode')) as PayoutAccountInput['bankCode'], accountName: String(data.get('accountName')).trim(), accountNumber: String(data.get('accountNumber')) };
    const issues: Partial<Record<keyof PayoutAccountInput, string>> = {};
    if (body.accountName.length < 2 || body.accountName.length > 100) issues.accountName = 'Tên tài khoản cần từ 2 đến 100 ký tự.';
    if (!Object.hasOwn(bankLabels, body.bankCode)) issues.bankCode = 'Vui lòng chọn ngân hàng trong danh sách.';
    if (!/^9900[0-9]{6,12}$/.test(body.accountNumber)) issues.accountNumber = 'Số tài khoản phải bắt đầu bằng 9900 và gồm 10–16 chữ số. Ví dụ: 990012345678.';
    setFieldErrors(issues); setError(null);
    const firstField = Object.keys(issues)[0];
    if (firstField) { (event.currentTarget.elements.namedItem(firstField) as HTMLElement | null)?.focus(); return; }
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
      <button className="tv-button" onClick={() => { setEditing(true); setFieldErrors({}); setSaved(false); setError(null); }}>{query.data ? 'Cập nhật tài khoản' : 'Thêm tài khoản nhận tiền'}</button>
    </div>}
    {query.isSuccess && editing && <form key={query.data?.updatedAt ?? 'new'} noValidate onSubmit={submit}><fieldset disabled={busy || cooldown.remaining > 0} className="space-y-3">
      <label className="block">Ngân hàng<select name="bankCode" aria-invalid={Boolean(fieldErrors.bankCode)} aria-describedby={fieldErrors.bankCode ? "payout-bankCode-error" : undefined} onChange={() => setFieldErrors(current => ({ ...current, bankCode: undefined }))} defaultValue={query.data?.bankCode ?? 'DEMO_VCB'} className="tv-input">{Object.entries(bankLabels).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
      {fieldErrors.bankCode && <p id="payout-bankCode-error" role="alert" className="text-sm text-rose-300">{fieldErrors.bankCode}</p>}
      <label className="block">Tên tài khoản<input name="accountName" aria-invalid={Boolean(fieldErrors.accountName)} aria-describedby={fieldErrors.accountName ? "payout-accountName-error" : undefined} onChange={() => setFieldErrors(current => ({ ...current, accountName: undefined }))} required minLength={2} maxLength={100} defaultValue={query.data?.accountName ?? ''} className="tv-input" autoComplete="off" /></label>
      {fieldErrors.accountName && <p id="payout-accountName-error" role="alert" className="text-sm text-rose-300">{fieldErrors.accountName}</p>}
      <label className="block">Số tài khoản<input name="accountNumber" aria-invalid={Boolean(fieldErrors.accountNumber)} aria-describedby={fieldErrors.accountNumber ? "payout-accountNumber-error" : undefined} onChange={() => setFieldErrors(current => ({ ...current, accountNumber: undefined }))} required pattern="9900[0-9]{6,12}" minLength={10} maxLength={16} inputMode="numeric" defaultValue={query.data?.accountNumber ?? ''} className="tv-input" placeholder="990012345678" autoComplete="off" /></label>
      {fieldErrors.accountNumber && <p id="payout-accountNumber-error" role="alert" className="text-sm text-rose-300">{fieldErrors.accountNumber}</p>}
      <p className="text-xs leading-5 opacity-70">Hiện hỗ trợ tài khoản mô phỏng bắt đầu bằng 9900, gồm 10–16 chữ số. Thay đổi tài khoản không ảnh hưởng các khoản đã chi trả.</p>
      <div className="flex flex-wrap gap-3"><button className="tv-button tv-primary">{busy ? 'Đang lưu…' : 'Lưu tài khoản nhận tiền'}</button><button type="button" className="tv-button" onClick={() => { setEditing(false); setError(null); }}>Hủy chỉnh sửa</button></div>
    </fieldset></form>}
  </section>;
}
