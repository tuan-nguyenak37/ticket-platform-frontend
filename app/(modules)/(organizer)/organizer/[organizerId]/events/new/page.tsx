import { OrganizerEditor } from '../../../_components/OrganizerEditor';
export default async function Page({ params }: { params: Promise<{ organizerId: string }> }) { const { organizerId } = await params; return <OrganizerEditor organizerId={organizerId} />; }
