import { redirect } from 'next/navigation';
export default async function Page({ params }: { params: Promise<{ organizerId: string }> }) { const { organizerId } = await params; redirect(`/organizer/${organizerId}/events`); }
