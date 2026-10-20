import { OrganizerWorkspace } from '../../_components/OrganizerWorkspace';
export default async function Page({ params }: { params: Promise<{ organizerId: string }> }) { const { organizerId } = await params; return <OrganizerWorkspace organizerId={organizerId} settings />; }
