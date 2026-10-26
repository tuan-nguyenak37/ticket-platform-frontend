import { SiteShell } from '@/components/layout/SiteShell';
import { Marketplace } from '@/components/commerce/Marketplace';
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters: Record<string, string> = {};
  for (const name of ['q', 'eventId', 'dateFrom', 'dateTo', 'minPrice', 'maxPrice']) {
    const value = params[name];
    if (typeof value === 'string' && value.trim()) filters[name] = value.trim();
  }
  const page = typeof params.page === 'string' && /^[1-9]\d{0,9}$/.test(params.page) && Number(params.page) <= 2147483647 ? Number(params.page) : 1;
  return <SiteShell><div className="commerce mx-auto w-full max-w-7xl px-4 py-6 md:px-8"><Marketplace key={JSON.stringify({ page, filters })} page={page} filters={filters} /></div></SiteShell>;
}
