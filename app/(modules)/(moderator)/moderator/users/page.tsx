import type { Metadata } from 'next';
import { UserStatusPanel } from '../_components/UserStatusPanel';

export const metadata: Metadata = { title: 'Trạng thái tài khoản | Moderator' };
export default function Page() { return <UserStatusPanel />; }
