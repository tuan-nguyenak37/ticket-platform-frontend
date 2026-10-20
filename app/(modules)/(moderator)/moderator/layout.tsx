import type { ReactNode } from 'react';
import { ModeratorGate } from './_components/ModeratorGate';

export default function ModeratorLayout({ children }: { children: ReactNode }) {
  return <ModeratorGate>{children}</ModeratorGate>;
}
