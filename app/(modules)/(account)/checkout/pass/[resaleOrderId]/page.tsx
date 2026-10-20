import { CustomerPage } from '@/components/commerce/shared';
import { Checkout } from '@/components/commerce/Checkout';
export default async function Page({ params }: { params: Promise<{ resaleOrderId: string }> }) {
  const { resaleOrderId } = await params;
  return <CustomerPage title="Thông tin mua vé"><Checkout key={resaleOrderId} id={resaleOrderId} resale /></CustomerPage>;
}
