import { actOnOrder, getOrder } from './api';

export async function payWithDemoCard(orderId: string) {
  // Reconcile a lost response before sending another payment result.
  let order = await getOrder(orderId, false);
  if (order.status !== 'pending_payment') return order;
  if (!order.payment) order = await actOnOrder(orderId, { path: 'payment' }, false);
  if (order.status !== 'pending_payment' || order.payment?.status !== 'pending') return order;
  return actOnOrder(orderId, { path: 'payment/mock-result', body: { result: 'success' } }, false);
}
