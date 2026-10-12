import { CommercePage } from '@/components/commerce/shared';
import { MyTicketDetail } from '@/components/commerce/MyTicketDetail';
export default async function Page({ params }: { params: Promise<{ ticketId: string }> }) { const { ticketId } = await params; return <CommercePage title="Chi tiết vé tôi đăng"><MyTicketDetail key={ticketId} id={ticketId} /></CommercePage>; }
