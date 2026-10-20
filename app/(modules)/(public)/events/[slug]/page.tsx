import Link from 'next/link';
import { SiteShell } from '@/components/layout/SiteShell';
import { EventDetail } from '../_components/EventDetail';

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: eventId } = await params;
  return <SiteShell><div className="mx-auto min-h-[60vh] max-w-7xl px-4 pt-6 md:px-8"><Link className="tv-button" href="/events">Trở lại danh sách sự kiện</Link><EventDetail eventId={eventId} /></div></SiteShell>;
}
