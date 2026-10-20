import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthForm } from '../_components/AuthForm';
import { safeAuthRedirect } from '../_lib/redirect';

export const metadata: Metadata = { title: 'Đăng nhập | TicketVerse' };

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ next?: string; registered?: string; passwordChanged?: string }>;
}) {
  const { next, registered, passwordChanged } = await searchParams;
  return <main className="commerce mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
    <Link href="/" className="mb-6 text-xl font-bold text-fuchsia-300">TicketVerse</Link>
    <section className="tv-panel"><h1 className="mb-5 text-2xl font-bold">Đăng nhập</h1>
      {passwordChanged === '1' && <p role="status" className="mb-4 text-sm text-emerald-300">Đổi mật khẩu thành công. Vui lòng đăng nhập lại.</p>}
      <AuthForm initialMode="login" nextPath={safeAuthRedirect(next)} registered={registered === '1'} />
    </section>
  </main>;
}
