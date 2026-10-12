import { TicketReviewPage } from './_components/TicketReviewPage';
export default async function Page({ params }: { params: Promise<{ ticketId: string }> }) { const { ticketId } = await params; return <TicketReviewPage key={ticketId} id={ticketId} />; }
