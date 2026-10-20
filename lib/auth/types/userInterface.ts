export interface User {
  user_id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  avatar_url: string | null;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}
