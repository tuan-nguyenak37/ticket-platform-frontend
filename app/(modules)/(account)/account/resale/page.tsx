import { CustomerPage } from '@/components/commerce/shared';
import { ResaleAccount } from '@/components/commerce/AccountLists';
export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams;
  const initialTab = params.tab === 'buy' ? 'buy' : 'sell';
  return <CustomerPage title="Giao dịch bán lại"><ResaleAccount key={initialTab} initialTab={initialTab} /></CustomerPage>;
}
