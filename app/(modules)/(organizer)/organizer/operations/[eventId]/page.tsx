import { EventOperations } from '../../_components/EventOperations';

export default async function Page({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <EventOperations eventId={eventId} />;
}
