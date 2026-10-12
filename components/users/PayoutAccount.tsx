'use client';
import { useRef, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPayoutAccount, savePayoutAccount } from '@/lib/commerce/payment';
import type { PayoutAccountInput } from '@/lib/commerce/payment-types';
import { Failure } from '@/components/commerce/shared';
import { usePaymentCooldown } from '@/components/commerce/usePaymentCooldown';
import { dateTime } from '@/lib/commerce/rules';

export function PayoutAccount() {
  const client = useQueryClient(); const cooldown = usePaymentCooldown(); const lock = useRef(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(null); const [saved, setSaved] = useState(false);
  const query = useQuery({ queryKey: ['payout-account'], queryFn: ({ signal }) => getPayoutAccount(signal), retry: false });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current || cooldown.remaining) return;
    const data = new FormData(event.currentTarget);
    const body: PayoutAccountInput = { bankCode: String(data.get('bankCode')) as PayoutAccountInput['bankCode'], accountName: String(data.get('accountName')).trim(), accountNumber: String(data.get('accountNumber')) };
    if (body.accountName.length < 2) { setError(new Error('Tên tài khoản cần từ 2 đến 100 ký tự.')); return; }
    lock.current = true; setBusy(true); setError(null); setSaved(false);
    try { const result = await savePayoutAccount(body); client.setQueryData(['payout-account'], result); setSaved(true); }
    catch (failure) { setError(failure); cooldown.handle(failure); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section className="tv-panel space-y-4"><div><h2 className="font-bold">Tài khoản nhận tiền</h2><p className="mt-2 text-sm opacity-70">Tài khoản ngân hàng thử nghiệm dành cho tiền bán vé.</p></div>{query.isPending && <p role="status">Đang tải tài khoản…</p>}{query.isError && <Failure error={query.error} retry={() => void query.refetch()} />}{error != null && <Failure error={error} />}{saved && <p role="status">Đã lưu tài khoản nhận tiền.</p>}{cooldown.remaining > 0 && <p role="status">Thử lại sau {cooldown.remaining} giây.</p>}
    {query.isSuccess && <form key={query.data?.updatedAt ?? 'new'} onSubmit={submit}><fieldset disabled={busy || cooldown.remaining > 0 || process.env.NEXT_PUBLIC_PAYMENT_MOCK_ENABLED !== 'true'} className="space-y-3">{!query.data && <p className="text-sm">Bạn chưa thiết lập tài khoản nhận tiền.</p>}<label className="block">Ngân hàng<select name="bankCode" defaultValue={query.data?.bankCode ?? 'DEMO_VCB'} className="tv-input"><option value="DEMO_VCB">Vietcombank · Demo</option><option value="DEMO_TCB">Techcombank · Demo</option><option value="DEMO_MB">MB · Demo</option></select></label><label className="block">Tên tài khoản<input name="accountName" required minLength={2} maxLength={100} defaultValue={query.data?.accountName ?? ''} className="tv-input" /></label><label className="block">Số tài khoản thử nghiệm<input name="accountNumber" required pattern="9900[0-9]{6,12}" minLength={10} maxLength={16} inputMode="numeric" defaultValue={query.data?.accountNumber ?? ''} className="tv-input" placeholder="990012345678" /></label><p className="text-xs opacity-70">Số tài khoản bắt đầu bằng 9900, gồm 10–16 chữ số. Không dùng tài khoản thật. Thay đổi này không sửa thông tin của các khoản đã chi trả.</p><button className="tv-button tv-primary">{busy ? 'Đang lưu…' : 'Lưu tài khoản nhận tiền'}</button></fieldset></form>}{query.data && <p className="text-xs opacity-60">Cập nhật {dateTime(query.data.updatedAt)}</p>}{process.env.NEXT_PUBLIC_PAYMENT_MOCK_ENABLED !== 'true' && <p>Thiết lập tài khoản thử nghiệm hiện chưa khả dụng.</p>}
  </section>;
}
