'use client';
import { useQuery } from '@tanstack/react-query';
import { dashboardMock, getModeratorDashboard } from '../_lib/dashboard.api';
export function useModeratorDashboard() {
  return useQuery({ queryKey: ['moderator', 'dashboard'], queryFn: getModeratorDashboard, initialData: dashboardMock });
}
