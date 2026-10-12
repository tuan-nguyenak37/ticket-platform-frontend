import type { ReactNode } from 'react';
import { ManagerGate } from '@/components/commerce/shared';
export default function Layout({ children }: { children: ReactNode }) { return <ManagerGate>{children}</ManagerGate>; }
