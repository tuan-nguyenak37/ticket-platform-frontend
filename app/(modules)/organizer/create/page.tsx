import { RequireAuth } from '@/lib/auth/RequireAuth';
import { CommercePage } from '@/components/commerce/shared';
import { SellTicket } from '@/components/commerce/SellTicket';
export default function Page() { return <CommercePage title="Đăng vé nhượng lại"><RequireAuth><SellTicket /></RequireAuth></CommercePage>; }
