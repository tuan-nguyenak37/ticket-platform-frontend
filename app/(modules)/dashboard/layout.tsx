import type { ReactNode } from 'react';
import { RequireAuth } from '@/lib/auth/RequireAuth';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
