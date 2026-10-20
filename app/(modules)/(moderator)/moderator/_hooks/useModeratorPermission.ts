'use client';
import { useAuthStore } from '@/lib/auth/auth.store';
import { hasModeratorPermission } from '@/app/(modules)/(moderator)/moderator/_lib/moderator-permission';
// Backend remains authoritative for each protected operation.
export function useModeratorPermission() {
  const role = useAuthStore(state => state.user?.role);
  const status = useAuthStore(state => state.status);
  return { role, isLoading: status === 'restoring', canAccess: status === 'authenticated' && hasModeratorPermission(role) };
}

