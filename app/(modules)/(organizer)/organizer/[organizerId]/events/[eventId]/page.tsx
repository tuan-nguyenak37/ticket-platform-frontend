import { OrganizerEditor } from '../../../_components/OrganizerEditor';
export default async function Page({ params }: { params: Promise<{ organizerId: string; eventId: string }> }) { const { organizerId, eventId } = await params; return <OrganizerEditor organizerId={organizerId} eventId={eventId} />; }
