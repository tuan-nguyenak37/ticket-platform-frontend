import type { Metadata } from 'next';
import { ModerationEventDetailView } from '../../_components/ModerationEventDetailView';

export const metadata: Metadata = {
  title: 'Chi tiết sự kiện kiểm duyệt | Moderator',
};

export default async function ModeratorEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <ModerationEventDetailView eventId={eventId} />;
}