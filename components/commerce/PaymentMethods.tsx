'use client';

import { CreditCard, Landmark, Wallet, Check } from 'lucide-react';

export type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'WALLET';

const methods = [
  { id: 'BANK_TRANSFER', title: 'Chuyển khoản ngân hàng', description: 'Thanh toán từ tài khoản ngân hàng', icon: Landmark },
  { id: 'CARD', title: 'Thẻ thanh toán', description: 'Thẻ nội địa / thẻ quốc tế', icon: CreditCard },
  { id: 'WALLET', title: 'Ví điện tử', description: 'Thanh toán bằng ví của bạn', icon: Wallet },
] as const;

export function PaymentMethods({ value, onChange, disabled = false }: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}) {
  return <fieldset disabled={disabled} className="space-y-3">
    <legend className="mb-4 text-lg font-semibold">Chọn phương thức thanh toán</legend>
    {methods.map(({ id, title, description, icon: Icon }) => <label key={id} className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-colors ${value === id ? 'border-violet-400 bg-violet-400/10' : 'border-white/10 hover:border-white/30'} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}>
      <input className="peer sr-only" type="radio" name="payment-method" value={id} checked={value === id} onChange={() => onChange(id)} />
      <span className="rounded-xl bg-white/5 p-3 peer-focus-visible:ring-2 peer-focus-visible:ring-violet-300"><Icon aria-hidden="true" size={22} /></span>
      <span className="flex-1"><span className="block font-medium">{title}</span><span className="mt-1 block text-xs tv-muted">{description}</span></span>
      <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${value === id ? 'border-violet-300 bg-violet-300 text-slate-950' : 'border-white/30'}`}>{value === id && <Check aria-hidden="true" size={14} />}</span>
    </label>)}
  </fieldset>;
}

export function PaymentPreview({ method }: { method: PaymentMethod }) {
  const content = {
    BANK_TRANSFER: { title: 'Tài khoản ngân hàng kiểm thử', detail: 'Giao dịch được xác nhận bởi bộ xử lý thử nghiệm. Không cần chuyển khoản hoặc quét mã QR.' },
    CARD: { title: 'Thẻ kiểm thử •••• 4242', detail: 'Thẻ kiểm thử được chuẩn bị sẵn. Không nhập số thẻ, mã CVV hoặc OTP thật.' },
    WALLET: { title: 'Ví kiểm thử đã sẵn sàng', detail: 'Không cần liên kết ví cá nhân. Giao dịch này không làm thay đổi số dư thật.' },
  }[method];
  return <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.025] p-4"><p className="text-sm font-medium">{content.title}</p><p className="mt-2 text-xs leading-6 tv-muted">{content.detail}</p></div>;
}
