import { SiteShell } from '@/components/layout/SiteShell';
import { CategoryNav, EventGrid } from '@/app/_components/EventDiscovery';

export default async function EventsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q.trim().slice(0, 255) : '';
  const categoryId = typeof params.categoryId === 'string' && /^[a-zA-Z0-9_-]{1,40}$/.test(params.categoryId) ? params.categoryId : '';
  const requestedPage = Number(params.page);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  return <SiteShell><div className="mx-auto min-h-[60vh] max-w-7xl px-4 md:px-8"><CategoryNav selected={categoryId} query={query} /><EventGrid query={query} categoryId={categoryId} page={page} /></div></SiteShell>;
}
