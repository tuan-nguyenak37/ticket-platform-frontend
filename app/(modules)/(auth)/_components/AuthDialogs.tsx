'use client';

import { useAuthUi } from '@/lib/auth/auth-ui.store';
import { AuthForm } from './AuthForm';

export function AuthDialogs() {
  const { open, mode, close } = useAuthUi();
  return open ? <AuthForm initialMode={mode} onClose={close} /> : null;
}
