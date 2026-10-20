'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from './auth.store';
import { useAuthUi } from './auth-ui.store';

export function useAuthenticatedAction() {
  const status = useAuthStore(state => state.status);
  const open = useAuthUi(state => state.open);
  const pending = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && pending.current) {
      const action = pending.current;
      pending.current = null;
      void action();
    } else if (!open) {
      pending.current = null;
    }
  }, [status, open]);

  function run(action: () => Promise<void>) {
    if (useAuthStore.getState().status === 'restoring') return;
    if (useAuthStore.getState().status === 'authenticated') {
      void action();
      return;
    }
    pending.current = action;
    useAuthUi.getState().show();
  }

  return { run, restoring: status === 'restoring' };
}
