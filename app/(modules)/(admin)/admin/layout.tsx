import type { ReactNode } from 'react';
import { AdminGate } from './_components/AdminGate';
import { AdminShell } from './_components/AdminShell';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminGate><AdminShell>{children}</AdminShell></AdminGate>;
}
