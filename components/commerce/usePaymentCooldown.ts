'use client';
import { useEffect, useState } from 'react';
import { AppApiError } from '@/lib/http/http-errors';
export function usePaymentCooldown() {
  const [until, setUntil] = useState(0); const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!until) return;
    const timer = setInterval(() => setRemaining(Math.max(0, Math.ceil((until - Date.now()) / 1000))), 1000);
    return () => clearInterval(timer);
  }, [until]);
  function handle(error: unknown) {
    if (error instanceof AppApiError && error.statusCode === 429) {
      const seconds = error.retryAfterSeconds ?? 60; setRemaining(seconds); setUntil(Date.now() + seconds * 1000);
    }
  }
  return { remaining, handle };
}
