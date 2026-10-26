import { EventOperations } from '../../../../_components/EventOperations';

export default async function Page({ params }: { params: Promise<{ organizerId: string; eventId: string }> }) {
  const { organizerId, eventId } = await params;
  return <EventOperations organizerId={organizerId} eventId={eventId} />;
}
