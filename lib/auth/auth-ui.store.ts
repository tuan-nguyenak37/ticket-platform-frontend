'use client';
import { create } from 'zustand';
export const useAuthUi = create<{ open: boolean; mode: 'login' | 'register'; show: (mode?: 'login' | 'register') => void; close: () => void }>(set => ({
  open: false, mode: 'login', show: (mode = 'login') => set({ open: true, mode }), close: () => set({ open: false }),
}));
