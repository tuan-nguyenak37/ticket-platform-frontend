import { ManagerGate } from '@/components/commerce/shared';
import { ManagedPayments } from '@/components/commerce/ManagedPayments';
export default function Page() {
  return <ManagerGate><div className="commerce commerce-light space-y-6"><h1 className="text-2xl font-bold">Giao dịch thanh toán</h1><ManagedPayments /></div></ManagerGate>;
}
