import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthForm } from '../_components/AuthForm';
import { safeAuthRedirect } from '../_lib/redirect';

export const metadata: Metadata = { title: 'Đăng nhập | TicketVerse' };

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ next?: string; registered?: string; passwordChanged?: string }>;
}) {
  const { next, registered, passwordChanged } = await searchParams;
  return <main className="commerce tv-auth-page">
    <Link href="/" className="tv-auth-brand">TicketVerse<span>Khám phá. Kết nối. Trải nghiệm.</span></Link>
    <section className="tv-panel tv-auth-card"><h1 className="tv-auth-title">Đăng nhập</h1>
      {passwordChanged === '1' && <p role="status" className="mb-4 text-sm text-emerald-300">Đổi mật khẩu thành công. Vui lòng đăng nhập lại.</p>}
      <AuthForm initialMode="login" nextPath={safeAuthRedirect(next)} registered={registered === '1'} />
    </section>
  </main>;
}
