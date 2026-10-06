import { PublicEventSearch } from './_components/PublicEventSearch';

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q.trim() : '';
  return <PublicEventSearch query={query} />;
}
