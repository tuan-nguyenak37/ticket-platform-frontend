import { RequireAuth } from '@/lib/auth/RequireAuth';
import { CheckoutPage } from '@/components/commerce/CheckoutPage';
export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <div className="commerce mx-auto w-full max-w-6xl px-4 py-8 sm:px-6"><RequireAuth><CheckoutPage key={orderId} id={orderId} /></RequireAuth></div>;
}
