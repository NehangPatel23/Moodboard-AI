'use client';

import { useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import { setActiveBoardUser } from '@/lib/board-store';
import {
  getServerAuthSnapshot,
  hydrateAuthStore,
  readAuthState,
  subscribeAuth,
} from '@/lib/auth-store';

export function BoardStoreBootstrap() {
  const auth = useSyncExternalStore(subscribeAuth, readAuthState, getServerAuthSnapshot);
  const userId = auth.user?.id ?? null;

  useEffect(() => {
    hydrateAuthStore();
  }, []);

  useEffect(() => {
    if (auth.status === 'authenticated' && userId) {
      setActiveBoardUser(userId);
    }
  }, [auth.status, userId]);

  return null;
}
