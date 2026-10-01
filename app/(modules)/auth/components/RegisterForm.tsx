'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRegister } from '../hooks/use-auth';
import { AppApiError } from '@/app/_lib/http-errors';

export function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const { mutate: register, isPending, error } = useRegister();
  const apiError = error as AppApiError | null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError('');

    if (!fullName.trim()) {
      setLocalError('Vui lòng nhập Họ và Tên.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }

    register({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
    });
  };

  const displayError = localError || apiError?.message;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950 px-4 py-20 text-white md:px-8 md:py-32">
      {/* Decorative Glow Orbs */}
      <div className="pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 opacity-25 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 opacity-20 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Modern Gradient Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl shadow-violet-500/30">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-xl shadow-violet-500/25">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-7 w-7"
              >
                <path d="M6.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM3.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM19.75 7.5a.75.75 0 00-1.5 0v2.25H16a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H22a.75.75 0 000-1.5h-2.25V7.5z" />
              </svg>
            </div>
            <h1 className="bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-2xl font-bold tracking-tight text-transparent md:text-3xl">
              Tạo tài khoản mới
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Đăng ký để bắt đầu trải nghiệm hệ thống
            </p>
          </div>

          {displayError && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200 shadow-xl shadow-rose-500/20 backdrop-blur-xl"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="mt-0.5 h-5 w-5 shrink-0 text-rose-400"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1 font-normal leading-relaxed text-white/90">
                {displayError}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-xs font-medium tracking-wide text-white/80"
              >
                Họ và Tên
              </label>
              <input
                id="fullName"
                type="text"
                required
                disabled={isPending}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="mt-2 w-full px-5 py-3.5 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium tracking-wide text-white/80"
              >
                Địa chỉ Email
              </label>
              <input
                id="email"
                type="email"
                required
                disabled={isPending}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="person@example.com"
                className="mt-2 w-full px-5 py-3.5 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium tracking-wide text-white/80"
              >
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                required
                disabled={isPending}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="mt-2 w-full px-5 py-3.5 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-medium tracking-wide text-white/80"
              >
                Xác nhận Mật khẩu
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                disabled={isPending}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="mt-2 w-full px-5 py-3.5 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 w-full px-6 py-3 rounded-2xl font-medium transition-all duration-300 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-xl shadow-violet-500/25 hover:shadow-2xl hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isPending ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}
            </button>
          </form>

          <div className="mt-8 border-t border-white/20 pt-6 text-center text-xs text-white/70">
            Đã có tài khoản?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-fuchsia-400 transition-colors duration-300 hover:text-fuchsia-300"
            >
              Đăng nhập tại đây
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
