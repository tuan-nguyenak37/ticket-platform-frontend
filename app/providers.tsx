'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from '@/lib/query/QueryProvider';
import { SessionProvider } from '@/lib/auth/SessionProvider';

import { AuthDialogs } from '@/app/(modules)/(auth)/_components/AuthDialogs';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <SessionProvider>{children}<AuthDialogs /></SessionProvider>
    </QueryProvider>
  );
}

