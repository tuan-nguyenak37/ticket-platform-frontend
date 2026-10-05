import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ModeratorShell } from './_components/ModeratorShell';

export const metadata: Metadata = { title: 'Moderator | TicketVerse' };
export default function ModeratorLayout({ children }: { children: ReactNode }) {
  return <ModeratorShell>{children}</ModeratorShell>;
}
