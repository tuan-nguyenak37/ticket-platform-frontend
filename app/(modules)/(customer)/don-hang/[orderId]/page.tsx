import { CommercePage } from '@/components/commerce/shared';
import { OrderDetail } from '@/components/commerce/OrderDetail';
export default async function Page({ params }: { params: Promise<{ orderId: string }> }) { const { orderId } = await params; return <CommercePage title="Chi tiết đơn hàng"><OrderDetail key={orderId} id={orderId} /></CommercePage>; }
