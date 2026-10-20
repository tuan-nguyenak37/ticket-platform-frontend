import { CustomerPage } from '@/components/commerce/shared';
import { TicketDetail } from '@/components/commerce/TicketDetail';
export default async function Page({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  return <CustomerPage title="Chi tiết vé"><TicketDetail key={ticketId} id={ticketId} /></CustomerPage>;
}
