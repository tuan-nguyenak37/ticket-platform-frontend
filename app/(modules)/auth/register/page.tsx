import type { Metadata } from 'next';
import { RegisterForm } from '../components/RegisterForm';

export const metadata: Metadata = {
  title: 'Đăng ký tài khoản | Hệ thống Quản lý',
  description: 'Tạo tài khoản mới kết nối Backend Port 7000',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
