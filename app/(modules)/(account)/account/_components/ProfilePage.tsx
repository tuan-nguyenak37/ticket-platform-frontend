'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/auth.store';
import { apiClient, logoutSession } from '@/lib/auth/session';
import { unwrap } from '@/lib/api/response';
import { formatHttpError } from '@/lib/api/http-errors';
import type { ApiResponse } from '@/lib/auth/types/authInterface';
import type { User } from '@/lib/auth/types/userInterface';

export function ProfilePage() {
  const user = useAuthStore(state => state.user);
  const revision = useAuthStore(state => state.revision);
  const query = useQuery({
    queryKey: ['profile', user?.user_id, revision],
    queryFn: async () => unwrap((await apiClient.get<ApiResponse<User>>('/users/me')).data),
    retry: false,
  });
  return <main className="commerce mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
    <Link href="/" className="tv-muted text-sm hover:underline">← Về trang chủ</Link>
    <header className="mb-8 mt-7"><p className="tv-muted text-xs font-semibold uppercase tracking-[.2em]">Tài khoản của bạn</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Hồ sơ cá nhân</h1><p className="tv-muted mt-3">Thông tin chính xác, trải nghiệm đặt vé liền mạch.</p></header>
    {query.isPending ? <div role="status" className="tv-panel animate-pulse py-16">Đang tải hồ sơ của bạn…</div> : query.isError ? <div role="alert" className="tv-panel space-y-4"><p>{formatHttpError(query.error).message}</p><button className="tv-button" onClick={() => void query.refetch()}>Tải lại hồ sơ</button></div> : <ProfileEditor key={`${user?.user_id}:${revision}`} profile={query.data} />}
  </main>;
}

function ProfileEditor({ profile }: { profile: User }) {
  const cache = useQueryClient();
  const revision = useAuthStore(state => state.revision);
  const [saved, setSaved] = useState(profile);
  const [name, setName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone_number ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const dirty = name.trim() !== saved.full_name || (phone.trim() || null) !== saved.phone_number;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !dirty) return;
    setMessage(''); setError('');
    if (!name.trim() || name.trim().length > 150) { setError('Họ và tên cần có từ 1 đến 150 ký tự.'); return; }
    if (phone.trim() && !/^\+?[0-9]{7,20}$/.test(phone.trim())) { setError('Số điện thoại cần có 7–20 chữ số, có thể bắt đầu bằng +.'); return; }
    setBusy(true);
    try {
      const updated = unwrap((await apiClient.patch<ApiResponse<User>>('/users/me', { full_name: name.trim(), phone_number: phone.trim() || null })).data);
      if (useAuthStore.getState().revision !== revision) return;
      setSaved(updated); setName(updated.full_name); setPhone(updated.phone_number ?? '');
      useAuthStore.getState().updateUser(updated);
      cache.setQueryData(['profile', updated.user_id, revision], updated);
      setMessage('Đã lưu thông tin cá nhân.');
    } catch (failure) { setError(formatHttpError(failure).message); }
    finally { setBusy(false); }
  }
  return <div className="grid items-start gap-6 lg:grid-cols-[280px_1fr]">
    <aside className="tv-panel space-y-6 lg:sticky lg:top-6">
      <div className="flex items-center gap-4 lg:flex-col lg:items-start">
        <div aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/25 to-fuchsia-400/10 text-2xl font-bold">{saved.full_name.trim().slice(0, 1).toUpperCase()}</div>
        <div className="min-w-0"><p className="break-words text-lg font-semibold">{saved.full_name}</p><p className="tv-muted mt-1 break-all text-sm">{saved.email}</p></div>
      </div>
      <nav aria-label="Cài đặt tài khoản" className="flex flex-wrap gap-2 lg:flex-col"><a href="#personal" className="tv-button justify-start">Thông tin cá nhân</a><a href="#security" className="tv-button justify-start">Bảo mật</a></nav>
      <p className="tv-muted text-xs leading-6">Email được dùng cho tài khoản và nhận vé. Bạn chưa thể thay đổi email tại đây.</p>
    </aside>
    <div className="min-w-0 space-y-6">
      <section id="personal" aria-labelledby="personal-title" className="tv-panel scroll-mt-6">
        <h2 id="personal-title" className="text-xl font-semibold">Thông tin cá nhân</h2><p className="tv-muted mt-2 text-sm">Cập nhật cách chúng tôi liên hệ với bạn.</p>
        <form onSubmit={save} className="mt-6 space-y-5">
          <fieldset disabled={busy} className="space-y-5">
            <div><label htmlFor="profile-name">Họ và tên <span aria-hidden="true">*</span></label><input id="profile-name" className="tv-input" autoComplete="name" required maxLength={150} value={name} onChange={event => { setName(event.target.value); setMessage(''); }} /></div>
            <div><label htmlFor="profile-email">Địa chỉ email</label><input id="profile-email" className="tv-input opacity-70" type="email" readOnly value={saved.email} aria-describedby="email-help" /><p id="email-help" className="tv-muted mt-2 text-xs">Email đăng nhập · Không thể chỉnh sửa</p></div>
            <div><label htmlFor="profile-phone">Số điện thoại <span className="tv-muted">(không bắt buộc)</span></label><input id="profile-phone" className="tv-input" type="tel" autoComplete="tel" maxLength={21} value={phone} onChange={event => { setPhone(event.target.value); setMessage(''); }} aria-describedby="phone-help" /><p id="phone-help" className="tv-muted mt-2 text-xs">7–20 chữ số, có thể bắt đầu bằng +. Để trống để xóa số đã lưu.</p></div>
          </fieldset>
          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
          <p role="status" className="text-sm text-emerald-300">{message}</p>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-5"><span className="tv-muted mr-auto text-xs">{dirty ? 'Bạn có thay đổi chưa lưu' : 'Thông tin đã được đồng bộ'}</span><button type="button" className="tv-button" disabled={busy || !dirty} onClick={() => { setName(saved.full_name); setPhone(saved.phone_number ?? ''); setError(''); setMessage(''); }}>Hoàn tác</button><button type="submit" className="tv-button tv-primary" disabled={busy || !dirty}>{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</button></div>
        </form>
      </section>
      <PasswordForm disabled={busy} />
    </div>
  </div>;
}

function PasswordForm({ disabled }: { disabled: boolean }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || disabled) return;
    setError('');
    if (next !== confirm) { setError('Mật khẩu xác nhận chưa khớp.'); return; }
    if (next === current) { setError('Mật khẩu mới phải khác mật khẩu hiện tại.'); return; }
    setBusy(true);
    try {
      unwrap((await apiClient.patch<ApiResponse<{ message: string }>>('/users/me/password', { currentPassword: current, newPassword: next })).data);
      setCurrent(''); setNext(''); setConfirm('');
      await logoutSession().catch(() => undefined);
      window.location.assign('/login?passwordChanged=1');
    } catch (failure) { setError(formatHttpError(failure).message); }
    finally { setBusy(false); }
  }
  return <section id="security" aria-labelledby="security-title" className="tv-panel scroll-mt-6">
    <h2 id="security-title" className="text-xl font-semibold">Bảo mật tài khoản</h2><p className="tv-muted mt-2 text-sm">Sau khi đổi mật khẩu, bạn cần đăng nhập lại trên các thiết bị.</p>
    <form onSubmit={submit} className="mt-6 space-y-5">
      <fieldset disabled={busy || disabled} className="space-y-5">
        <div><label htmlFor="password-current">Mật khẩu hiện tại</label><input id="password-current" className="tv-input" type={visible ? 'text' : 'password'} autoComplete="current-password" required value={current} onChange={event => setCurrent(event.target.value)} /></div>
        <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="password-new">Mật khẩu mới</label><input id="password-new" className="tv-input" type={visible ? 'text' : 'password'} autoComplete="new-password" required minLength={6} maxLength={32} value={next} onChange={event => setNext(event.target.value)} aria-describedby="password-help" /></div><div><label htmlFor="password-confirm">Xác nhận mật khẩu mới</label><input id="password-confirm" className="tv-input" type={visible ? 'text' : 'password'} autoComplete="new-password" required minLength={6} maxLength={32} value={confirm} onChange={event => setConfirm(event.target.value)} /></div></div>
        <div className="flex flex-wrap items-center justify-between gap-3"><p id="password-help" className="tv-muted text-xs">Dùng từ 6 đến 32 ký tự, khác mật khẩu hiện tại.</p><label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={visible} onChange={event => setVisible(event.target.checked)} />Hiện mật khẩu</label></div>
      </fieldset>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      <div className="flex justify-end border-t border-white/10 pt-5"><button className="tv-button" disabled={busy || disabled} type="submit">{busy ? 'Đang đổi mật khẩu…' : 'Đổi mật khẩu'}</button></div>
    </form>
  </section>;
}
