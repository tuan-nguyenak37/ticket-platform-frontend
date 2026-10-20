import { CustomerPage } from '@/components/commerce/shared';
import { ListingDetail } from '@/components/commerce/Marketplace';
export default async function Page({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  return <CustomerPage title="Vé bán lại" publicView><ListingDetail key={listingId} id={listingId} /></CustomerPage>;
}
