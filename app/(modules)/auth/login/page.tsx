import type { Metadata } from 'next';
import { LoginForm } from '../components/LoginForm';

export const metadata: Metadata = {
  title: 'Đăng nhập | Hệ thống Quản lý',
  description: 'Đăng nhập vào hệ thống kết nối Backend Port 7000',
};

export default function LoginPage() {
  return <LoginForm />;
}
