'use client';
import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/auth.store';
import { changePassword, getProfile } from '@/lib/users/api';
import { Failure } from '@/components/commerce/shared';
import { UserInfo } from './UserInfo';
import { UserForm } from './UserForms';

export function Profile() {
  const client = useQueryClient(); const authenticated = useAuthStore(state => state.status === 'authenticated');
  const query = useQuery({ queryKey: ['profile'], queryFn: ({ signal }) => getProfile(signal), enabled: authenticated, retry: false });
  const lock = useRef(false); const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(null); const [changed, setChanged] = useState(false);
  async function password(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current) return;
    const form = event.currentTarget; const data = new FormData(form); const current = String(data.get('currentPassword')); const next = String(data.get('newPassword'));
    setError(null);
    if (next !== data.get('confirmation') || current === next) { setError(new Error('Mật khẩu mới phải khác mật khẩu cũ và khớp với xác nhận.')); return; }
    lock.current = true; setBusy(true);
    try { await changePassword(current, next); form.reset(); setChanged(true); useAuthStore.getState().clearSession(); client.clear(); }
    catch (failure) { setError(failure); }
    finally { lock.current = false; setBusy(false); }
  }
  if (changed) return <p role="status" className="tv-panel">Đã đổi mật khẩu và thu hồi phiên cũ. <Link href="/" className="underline">Về trang chủ để đăng nhập lại</Link>.</p>;
  if (!authenticated) return <p className="tv-panel">Vui lòng đăng nhập để xem hồ sơ.</p>;
  return <div className="space-y-5">{query.isPending && <p role="status">Đang tải hồ sơ…</p>}{query.isError && <Failure error={query.error} retry={() => void query.refetch()} />}{query.data && !query.isError && <><UserInfo user={query.data} /><UserForm key={query.data.updatedAt} kind="name" self user={query.data} onSaved={user => { useAuthStore.getState().updateUser({ fullName: user.fullName }); client.setQueryData(['profile'], user); }} /></>}
    <form className="tv-panel space-y-4" onSubmit={password}><h2 className="font-bold">Đổi mật khẩu</h2><p className="text-sm opacity-70">Đổi thành công sẽ kết thúc các phiên cũ. Bạn cần đăng nhập lại.</p>{error != null && <Failure error={error} />}<fieldset disabled={busy} className="space-y-3"><label className="block">Mật khẩu hiện tại<input name="currentPassword" type="password" required autoComplete="current-password" className="tv-input" /></label><label className="block">Mật khẩu mới (6–32 ký tự)<input name="newPassword" type="password" required minLength={6} maxLength={32} autoComplete="new-password" className="tv-input" /></label><label className="block">Nhập lại mật khẩu mới<input name="confirmation" type="password" required minLength={6} maxLength={32} autoComplete="new-password" className="tv-input" /></label><button className="tv-button tv-primary">{busy ? 'Đang đổi mật khẩu…' : 'Đổi mật khẩu'}</button></fieldset></form>
  </div>;
}
