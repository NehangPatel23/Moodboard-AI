'use client';

import { useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import { resetBoardStore, setActiveBoardUser } from '@/lib/board-store';
import { getServerAuthSnapshot, readAuthState, subscribeAuth } from '@/lib/auth-store';
import { runLocalStorageMigrationIfNeeded } from '@/lib/local-migration';

export function BoardStoreBootstrap() {
  const auth = useSyncExternalStore(subscribeAuth, readAuthState, getServerAuthSnapshot);
  const userId = auth.user?.id ?? null;

  useEffect(() => {
    if (auth.status === 'authenticated' && userId) {
      void (async () => {
        await runLocalStorageMigrationIfNeeded();
        await setActiveBoardUser(userId);
      })();
      return;
    }

    if (auth.status === 'unauthenticated') {
      resetBoardStore();
    }
  }, [auth.status, userId]);

  return null;
}
