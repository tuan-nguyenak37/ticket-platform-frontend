'use client';

import { useState, type FormEvent } from 'react';
import { useAuthStore } from '@/lib/auth/auth.store';
import { apiClient } from '@/lib/auth/session';
import { unwrap } from '@/lib/api/response';
import type { ApiResponse } from '@/lib/auth/types/authInterface';
import type { User } from '@/lib/auth/types/userInterface';
import { Failure } from '@/components/ui/commerce';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function UserStatusPanel() {
  const revision = useAuthStore(state => state.revision);
  return <StatusForm key={revision} />;
}

function StatusForm() {
  const actor = useAuthStore(state => state.user);
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState<User['status']>('SUSPENDED');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [result, setResult] = useState<User | null>(null);
  const [pending, setPending] = useState<{ userId: string; status: User['status']; reason: string } | null>(null);

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null); setError(null);
    const id = userId.trim();
    if (!/^[a-zA-Z0-9_-]{1,40}$/.test(id)) { setError(new Error('Mã người dùng phải có 1–40 ký tự chữ, số, dấu gạch dưới hoặc gạch ngang.')); return; }
    if (id === actor?.user_id) { setError(new Error('Không được thay đổi trạng thái của chính mình.')); return; }
    if (!reason.trim()) { setError(new Error('Vui lòng nhập lý do.')); return; }
    setPending({ userId: id, status, reason: reason.trim() });
  }

  async function confirm() {
    if (!pending) return;
    const response = await apiClient.patch<ApiResponse<User>>(`/users/${encodeURIComponent(pending.userId)}/status`, { status: pending.status, reason: pending.reason });
    setResult(unwrap(response.data));
    setReason('');
  }

  return <div className="max-w-3xl space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-widest text-violet-700">An toàn tài khoản</p><h1 className="mt-2 text-3xl font-bold">Trạng thái người dùng</h1><p className="mt-3 text-sm leading-6 tv-muted">Đình chỉ hoặc mở lại tài khoản USER bằng mã người dùng đã được xác định.</p></header>
    <div className="tv-notice">Moderator không được xem danh sách hoặc tra cứu hồ sơ qua API quản trị. Màn hình này chỉ gửi yêu cầu thay đổi trạng thái theo ID; không có thao tác tra cứu ngầm hay tự nâng quyền.</div>
    <form onSubmit={prepare} className="tv-panel space-y-5">
      <label className="block">Mã người dùng<input required maxLength={40} pattern="[a-zA-Z0-9_-]{1,40}" className="tv-input" value={userId} onChange={event => setUserId(event.target.value)} autoComplete="off" /></label>
      <label className="block">Trạng thái đích<select className="tv-input" value={status} onChange={event => setStatus(event.target.value as User['status'])}><option value="SUSPENDED">Đình chỉ</option><option value="ACTIVE">Hoạt động</option></select></label>
      <label className="block">Lý do (bắt buộc)<textarea required maxLength={1000} rows={4} className="tv-input" value={reason} onChange={event => setReason(event.target.value)} /><span className="mt-1 block text-right text-xs tv-muted">{reason.length}/1000</span></label>
      <p className="text-sm tv-muted">Không áp dụng cho ADMIN, MODERATOR hoặc chính mình. Đình chỉ sẽ thu hồi phiên đăng nhập; mở lại không khôi phục phiên cũ. Đình chỉ người dùng không phải đình chỉ Ban tổ chức.</p>
      {error != null && <Failure error={error} />}
      <button className="tv-button tv-primary" type="submit">Xem lại và xác nhận</button>
    </form>
    {result && <section role="status" className="tv-panel space-y-2 border-emerald-300"><h2 className="font-semibold">Máy chủ đã xác nhận trạng thái</h2><p className="break-all">{result.user_id}</p><p>{result.full_name} · {result.status === 'ACTIVE' ? 'Hoạt động' : 'Đã đình chỉ'}</p></section>}
    {pending && <ConfirmDialog title={pending.status === 'SUSPENDED' ? 'Đình chỉ tài khoản?' : 'Mở lại tài khoản?'} description={`Mã tài khoản: ${pending.userId}. Trạng thái yêu cầu: ${pending.status}. Lý do: ${pending.reason}. Hãy kiểm tra đúng đối tượng trước khi xác nhận.`} confirmLabel="Xác nhận thay đổi" onClose={() => setPending(null)} onConfirm={confirm} />}
  </div>;
}
