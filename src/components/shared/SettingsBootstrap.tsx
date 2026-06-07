'use client';

import { useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import {
  getServerAuthSnapshot,
  hydrateAuthStore,
  readAuthState,
  subscribeAuth,
} from '@/lib/auth-store';
import {
  bootstrapSettingsFromCookie,
  hydrateSettingsForUser,
  resetSettingsStore,
} from '@/lib/settings-store';

/**
 * Keeps theme/settings in sync across landing, auth, and app routes.
 * Mounted once in the root layout so leaving AppShell does not drop theme state.
 */
export function SettingsBootstrap() {
  const auth = useSyncExternalStore(subscribeAuth, readAuthState, getServerAuthSnapshot);
  const userId = auth.user?.id ?? null;

  useEffect(() => {
    hydrateAuthStore();
    bootstrapSettingsFromCookie();
  }, []);

  useEffect(() => {
    if (auth.status === 'authenticated' && userId) {
      void hydrateSettingsForUser(userId);
      return;
    }

    if (auth.status === 'unauthenticated') {
      resetSettingsStore();
    }
  }, [auth.status, userId]);

  return null;
}
