import type { Metadata } from 'next';
import { ModerationEventsQueue } from '../_components/ModerationEventsQueue';

export const metadata: Metadata = {
  title: 'Hàng đợi kiểm duyệt sự kiện | Moderator',
};

export default function ModeratorEventsPage() {
  return <ModerationEventsQueue />;
}
