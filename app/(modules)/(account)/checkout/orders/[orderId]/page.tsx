import { CustomerPage } from '@/components/commerce/shared';
import { Checkout } from '@/components/commerce/Checkout';
export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <CustomerPage title="Thông tin mua vé"><Checkout key={orderId} id={orderId} /></CustomerPage>;
}
