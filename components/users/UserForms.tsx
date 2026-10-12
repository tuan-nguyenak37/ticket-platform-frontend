'use client';
import { useRef, useState, type FormEvent } from 'react';
import type { ManagedUser, AccountStatus } from '@/lib/users/api';
import { saveName, setUserStatus, createUser } from '@/lib/users/api';
import { Failure } from '@/components/commerce/shared';
import { useQueryClient } from '@tanstack/react-query';
import { AppApiError } from '@/lib/http/http-errors';

export function UserForm({ kind, user, self = false, onSaved }: { kind: 'name' | 'create' | 'status'; user?: ManagedUser; self?: boolean; onSaved: (user: ManagedUser) => void | Promise<void> }) {
  const client = useQueryClient();
  const lock = useRef(false); const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(null); const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current) return;
    const form = event.currentTarget; const data = new FormData(form); const text = (name: string) => String(data.get(name) ?? '');
    lock.current = true; setBusy(true); setError(null); setMessage('');
    try {
      if (kind === 'name' && !text('fullName').trim()) throw new Error('Họ tên không được chỉ có khoảng trắng.');
      if (kind === 'status' && !text('reason').trim()) throw new Error('Vui lòng nhập lý do xử lý.');
      const result = kind === 'name' ? await saveName(text('fullName'), self ? undefined : user?.user_id) : kind === 'create' ? await createUser({ email: text('email').trim(), password: text('password'), ...(text('fullName').trim() ? { fullName: text('fullName').trim() } : {}) }) : await setUserStatus(user?.user_id ?? text('userId').trim(), text('status') as AccountStatus, text('reason'));
      if (kind === 'create') form.reset();
      setMessage('Đã lưu thông tin từ backend.'); await onSaved(result);
    } catch (failure) {
      setError(failure);
      if (failure instanceof AppApiError && failure.statusCode === 409) {
        await Promise.all([client.invalidateQueries({ queryKey: ['users'] }), client.invalidateQueries({ queryKey: ['profile'] })]);
      }
    }
    finally { lock.current = false; setBusy(false); }
  }
  return <form onSubmit={submit} className="tv-panel space-y-4"><h2 className="font-bold">{kind === 'name' ? 'Cập nhật họ tên' : kind === 'create' ? 'Tạo tài khoản người dùng' : 'Kiểm soát tài khoản'}</h2>{error != null && <Failure error={error} />}{message && <p role="status">{message}</p>}<fieldset disabled={busy} className="space-y-3">
    {kind !== 'status' && <label className="block">Họ tên<input name="fullName" defaultValue={user?.fullName ?? ''} required={kind === 'name'} maxLength={100} className="tv-input" autoComplete="name" /></label>}
    {kind === 'create' && <><label className="block">Email<input name="email" type="email" required className="tv-input" autoComplete="off" /></label><label className="block">Mật khẩu ban đầu<input name="password" type="password" required minLength={6} maxLength={32} autoComplete="new-password" className="tv-input" /></label><p className="text-sm opacity-70">Tài khoản mới có vai trò USER.</p></>}
    {kind === 'status' && <>{!user && <label className="block">Mã tài khoản USER<input name="userId" required pattern="[a-zA-Z0-9_-]{1,40}" maxLength={40} className="tv-input" /></label>}<label className="block">Trạng thái<select name="status" defaultValue={user?.status === 'active' ? 'suspended' : 'active'} className="tv-input"><option value="suspended">Tạm khóa</option><option value="banned">Cấm tài khoản</option><option value="active">Mở khóa</option></select></label><label className="block">Lý do *<textarea name="reason" required maxLength={1000} rows={3} className="tv-input" /></label><p className="text-sm opacity-70">Đổi trạng thái thu hồi phiên đăng nhập cũ. Không tự hoàn tiền hoặc hủy vé. Gửi lại cùng trạng thái không cập nhật lý do.</p></>}
    <button className="tv-button tv-primary">{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
  </fieldset></form>;
}
