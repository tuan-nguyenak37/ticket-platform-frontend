import { AppApiError } from './http-errors';
import type { ApiResponse } from '@/lib/auth/types/authInterface';
export function unwrap<T>(body: ApiResponse<T>): T {
  if (!body.success) throw new AppApiError(body.message, body.statusCode);
  return body.data;
}
