export interface User {
  user_id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  reputationScore: number;
  successfulSales: number;
  successfulBuys: number;
  disputeCount: number;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}
