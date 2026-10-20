import type { Metadata } from 'next';
import { ModerationReviewHistoryList } from '../_components/ModerationReviewHistoryList';

export const metadata: Metadata = {
  title: 'Lịch sử kiểm duyệt sự kiện | Moderator',
};

export default function ModeratorHistoryPage() {
  return <ModerationReviewHistoryList />;
}