'use client';
import { useAuthStore } from '@/lib/store/auth.store';
import { hasModeratorPermission } from '../_lib/moderator-permission';
// Chưa gắn vào layout: giao diện hiện là bản xem trước bằng dữ liệu mẫu.
export function useModeratorPermission() {
  const role = useAuthStore(state => state.user?.role);
  const status = useAuthStore(state => state.status);
  return { role, isLoading: status === 'restoring', canAccess: status === 'authenticated' && hasModeratorPermission(role) };
}
