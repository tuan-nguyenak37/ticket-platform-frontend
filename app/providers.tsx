'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from '@/lib/query/QueryProvider';
import { SessionProvider } from '@/lib/auth/SessionProvider';
import { AuthStoreProvider, type AuthSnapshot } from '@/lib/auth/auth.store';

import { AuthDialogs } from '@/app/(modules)/(auth)/_components/AuthDialogs';

export function AppProviders({ children, initialSession }: { children: ReactNode; initialSession: AuthSnapshot }) {
  return (
    <AuthStoreProvider initial={initialSession}><QueryProvider>
      <SessionProvider>{children}<AuthDialogs /></SessionProvider>
    </QueryProvider></AuthStoreProvider>
  );
}

