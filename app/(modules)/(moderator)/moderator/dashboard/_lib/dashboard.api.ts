import { pendingEvents } from '../../events/_lib/events.mock';
import { todayEvents, alerts, activities } from './dashboard.mock';
export const dashboardMock = { pendingEvents, todayEvents, alerts, activities };
// Điểm nối API sau này; hiện không gửi request tới backend.
export async function getModeratorDashboard() { return dashboardMock; }
