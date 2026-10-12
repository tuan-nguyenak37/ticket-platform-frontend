import { ManagerGate } from '@/components/commerce/shared';
import { UserManagement } from '@/components/users/UserManagement';
export default function Page() {
  return <ManagerGate><div className="commerce commerce-light space-y-6"><h1 className="text-2xl font-bold">Quản lý người dùng</h1><UserManagement /></div></ManagerGate>;
}
