import { SiteShell } from '@/components/layout/SiteShell';
import { ListingDetail } from '@/components/commerce/Marketplace';
export default async function Page({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  return <SiteShell><div className="commerce mx-auto w-full max-w-7xl px-4 py-6 md:px-8"><ListingDetail key={listingId} id={listingId} /></div></SiteShell>;
}
