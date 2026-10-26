import type { User } from '@/lib/auth/types/userInterface';

export interface AuthData {
  user: User;
}

export interface TokenAuthData extends AuthData {
  accessToken: string;
  accessTokenExpiresAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

export type AuthResponse = ApiResponse<AuthData>;
