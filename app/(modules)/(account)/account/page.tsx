import { RequireAuth } from '@/lib/auth/RequireAuth';
import { ProfilePage } from './_components/ProfilePage';

export default function AccountPage() {
  return <RequireAuth><ProfilePage /></RequireAuth>;
}
