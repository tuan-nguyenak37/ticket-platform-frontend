import 'server-only';
import { cookies } from 'next/headers';
import type { AuthSnapshot } from './auth.store';
import type { AuthData, ApiResponse } from './types/authInterface';

export const REFRESH_COOKIE = 'ticketverse_refresh';
export const backendUrl = () => process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000/api';

export async function getServerSession(): Promise<AuthSnapshot> {
  const session = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!session || session.length > 4096 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(session)) return { user: null, status: 'unauthenticated' };
  try {
    const response = await fetch(`${backendUrl().replace(/\/$/, '')}/auth/browser/session`, {
      headers: { Cookie: `${REFRESH_COOKIE}=${session}` },
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
    });
    if (response.status === 401) return { user: null, status: 'unauthenticated' };
    if (response.status === 409) return { user: null, status: 'restoring' };
    if (!response.ok) throw new Error('Session unavailable');
    const body = await response.json() as ApiResponse<AuthData>;
    if (!body.success || !body.data?.user?.user_id || body.data.user.status !== 'ACTIVE') throw new Error('Invalid session');
    return { user: body.data.user, status: 'authenticated' };
  } catch {
    return { user: null, status: 'error' };
  }
}
