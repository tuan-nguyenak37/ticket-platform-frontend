import { CustomerPage } from '@/components/commerce/shared';
import { VnpayCheckout } from '@/components/commerce/VnpayCheckout';

export default async function Page({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  return <CustomerPage title="Kiểm tra vé bán lại"><VnpayCheckout key={listingId} id={listingId} resale listingPreview /></CustomerPage>;
}
