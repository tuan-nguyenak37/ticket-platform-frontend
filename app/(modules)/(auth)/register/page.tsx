import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthForm } from '../_components/AuthForm';
import { safeAuthRedirect } from '../_lib/redirect';

export const metadata: Metadata = { title: 'Đăng ký | TicketVerse' };

export default async function RegisterPage({ searchParams }: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <main className="commerce mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
    <Link href="/" className="mb-6 text-xl font-bold text-fuchsia-300">TicketVerse</Link>
    <section className="tv-panel"><h1 className="mb-5 text-2xl font-bold">Đăng ký tài khoản</h1>
      <AuthForm initialMode="register" nextPath={safeAuthRedirect(next)} />
    </section>
  </main>;
}
