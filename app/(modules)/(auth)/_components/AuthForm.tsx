'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/auth/auth.store';
import { Dialog } from '@/components/ui/Dialog';
import { loginSession, registerSession, restoreSession } from '@/lib/auth/session';
import { formatHttpError } from '@/lib/api/http-errors';

export function AuthForm({ initialMode, nextPath = '/account', registered = false, onClose }: {
  initialMode: 'login' | 'register'; nextPath?: string; registered?: boolean; onClose?: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const show = setMode;
  const status = useAuthStore(state => state.status);
  const identifier = useId();
  const close = () => { if (onClose) onClose(); else router.replace(nextPath); };
  const [cooldown, setCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    if (!onClose && status === 'authenticated') router.replace(nextPath);
  }, [nextPath, onClose, router, status]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(registered ? 'Đăng ký thành công. Vui lòng đăng nhập để tiếp tục.' : '');
  const registering = mode === 'register';

  function switchMode() {
    if (pending.current) return;
    setPassword('');
    setConfirmation('');
    setShowPassword(false);
    setError('');
    setNotice('');
    const nextMode = registering ? 'login' : 'register';
    if (onClose) show(nextMode);
    else router.push('/' + nextMode + '?next=' + encodeURIComponent(nextPath));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || cooldown > 0) return;
    setError('');
    setNotice('');
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim();
    if (registering && (!normalizedName || normalizedName.length > 150)) {
      setError('Họ và tên phải có từ 1 đến 150 ký tự.');
      return;
    }
    if (registering && (password.length < 6 || password.length > 32)) {
      setError('Mật khẩu phải có từ 6 đến 32 ký tự.');
      return;
    }
    if (registering && password !== confirmation) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      if (registering) {
        await registerSession({ email: normalizedEmail, password, fullName: normalizedName });
        if (!onClose) {
          router.replace('/login?registered=1&next=' + encodeURIComponent(nextPath));
        }
        setEmail(normalizedEmail);
        setPassword('');
        setConfirmation('');
        show('login');
        setNotice('Đăng ký thành công. Vui lòng đăng nhập để tiếp tục.');
      } else {
        await loginSession({ email: normalizedEmail, password });
        close();
      }
    } catch (failure) {
      const problem = formatHttpError(failure);
      setError(problem.message);
      if (problem.statusCode === 429) setCooldown(problem.retryAfterSeconds ?? 60);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  const content = <form onSubmit={submit} className="tv-auth-form" aria-busy={busy}>
      <p className="tv-auth-intro">{registering ? 'Một tài khoản, mọi trải nghiệm bạn yêu thích.' : 'Đăng nhập để đặt vé và quản lý trải nghiệm của bạn.'}</p>
      {status === 'restoring' && <p role="status" className="text-sm tv-muted">Đang khôi phục phiên đăng nhập…</p>}
      {status === 'error' && <div role="alert" className="text-sm text-amber-200">Chưa thể khôi phục phiên. Bạn có thể đăng nhập lại hoặc <button type="button" className="underline" onClick={() => void restoreSession()}>thử kết nối lại</button>.</div>}
      {notice && <p role="status" className="tv-auth-message text-emerald-300">{notice}</p>}
      {error && <p role="alert" className="tv-auth-message text-rose-300">{error}</p>}
      <fieldset disabled={busy || status === 'restoring'} className="tv-auth-fields">
        {registering && <label className="tv-auth-field" htmlFor={identifier + "-full-name"}>Họ và tên
          <input id={identifier + "-full-name"} name="fullName" className="tv-input" autoComplete="name" placeholder="Tên của bạn" required maxLength={150} value={fullName} onChange={event => setFullName(event.target.value)} />
        </label>}
        <label className="tv-auth-field" htmlFor={identifier + "-email"}>Email
          <input id={identifier + "-email"} name="email" className="tv-input" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="ban@example.com" required value={email} onChange={event => setEmail(event.target.value)} />
        </label>
        <div className="tv-auth-field"><label htmlFor={identifier + "-password"}>Mật khẩu</label>
          <div className="tv-auth-password"><input id={identifier + "-password"} name="password" className="tv-input" type={showPassword ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} aria-describedby={registering ? identifier + '-password-hint' : undefined} required minLength={registering ? 6 : undefined} maxLength={registering ? 32 : undefined} value={password} onChange={event => setPassword(event.target.value)} />
            <button type="button" className="tv-auth-reveal" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-controls={identifier + '-password' + (registering ? ' ' + identifier + '-confirmation' : '')} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
          </div>
          {registering && <p id={identifier + '-password-hint'} className="tv-auth-hint">Sử dụng từ 6 đến 32 ký tự.</p>}
        </div>
        {registering && <label className="tv-auth-field" htmlFor={identifier + "-confirmation"}>Xác nhận mật khẩu
          <input id={identifier + "-confirmation"} name="confirmation" className="tv-input" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Nhập lại mật khẩu" required minLength={6} maxLength={32} value={confirmation} onChange={event => setConfirmation(event.target.value)} />
        </label>}
        {cooldown > 0 && <p role="status" className="text-sm text-amber-200">Vui lòng thử lại sau {cooldown} giây.</p>}
        <button className="tv-button tv-primary tv-auth-submit" type="submit" disabled={cooldown > 0}>{busy ? 'Đang xử lý…' : registering ? 'Tạo tài khoản' : 'Đăng nhập'}{!busy && <ArrowRight size={18} aria-hidden="true" />}</button>
        <p className="tv-auth-switch">{registering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'} <button type="button" onClick={switchMode}>{registering ? 'Đăng nhập' : 'Đăng ký ngay'}</button></p>
      </fieldset>
    </form>;
  return onClose ? <Dialog title={registering ? 'Tạo tài khoản' : 'Đăng nhập'} className="tv-auth-dialog" onClose={close} busy={busy}>{content}</Dialog> : content;
}
