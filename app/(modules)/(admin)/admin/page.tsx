import type { Metadata } from 'next';
import { AdminGate } from './_components/AdminGate';
import { AdminDashboard } from './_components/AdminDashboard';

export const metadata: Metadata = {
  title: 'Quản trị hệ thống | TicketVerse',
};

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminDashboard />
    </AdminGate>
  );
}
