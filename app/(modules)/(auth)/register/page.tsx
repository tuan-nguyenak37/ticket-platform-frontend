import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthForm } from '../_components/AuthForm';
import { safeAuthRedirect } from '../_lib/redirect';

export const metadata: Metadata = { title: 'Đăng ký | TicketVerse' };

export default async function RegisterPage({ searchParams }: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <main className="commerce tv-auth-page">
    <Link href="/" className="tv-auth-brand">TicketVerse<span>Khám phá. Kết nối. Trải nghiệm.</span></Link>
    <section className="tv-panel tv-auth-card"><h1 className="tv-auth-title">Tạo tài khoản</h1>
      <AuthForm initialMode="register" nextPath={safeAuthRedirect(next)} />
    </section>
  </main>;
}
