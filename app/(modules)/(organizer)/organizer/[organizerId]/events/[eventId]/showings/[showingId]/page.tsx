import { redirect } from 'next/navigation';
export default async function Page({ params }: { params: Promise<{ organizerId: string; eventId: string; showingId: string }> }) {
  const { organizerId, eventId, showingId } = await params;
  redirect('/organizer/' + encodeURIComponent(organizerId) + '/events/' + encodeURIComponent(eventId) + '?step=2&showingId=' + encodeURIComponent(showingId));
}
