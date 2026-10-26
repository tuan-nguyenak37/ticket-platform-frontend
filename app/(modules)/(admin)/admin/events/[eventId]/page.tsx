import { ModerationEventDetailView } from '@/app/(modules)/(moderator)/moderator/_components/ModerationEventDetailView';

export default async function AdminEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <div className="commerce-light rounded-2xl bg-slate-50 p-4 text-slate-900 md:p-6"><ModerationEventDetailView eventId={eventId} basePath="/admin" /></div>;
}
