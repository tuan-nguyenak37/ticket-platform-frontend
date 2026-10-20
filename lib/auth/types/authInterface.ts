import type { User } from '@/lib/auth/types/userInterface';

export interface AuthData {
  accessToken: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

export type AuthResponse = ApiResponse<AuthData>;
