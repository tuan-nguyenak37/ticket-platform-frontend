import type { Metadata } from 'next';
import { AdminOverview } from './_components/AdminOverview';

export const metadata: Metadata = {
  title: 'Quản trị hệ thống | TicketVerse',
};

export default function AdminPage() {
  return <AdminOverview />;
}
