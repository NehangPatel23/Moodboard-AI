'use client';

import { useSyncExternalStore } from 'react';
import {
  getServerAuthSnapshot,
  readAuthState,
  subscribeAuth,
} from '@/lib/auth-store';

/**
 * Returns an auth-aware href for a protected destination. When the user is not
 * (yet) authenticated, it points to the sign-in flow with a redirect back to
 * the intended destination. While the session is still resolving (`loading`),
 * it also routes through sign-in, which immediately bounces an authenticated
 * user onward once hydration completes.
 */
export function useGatedHref(destination: string): string {
  const auth = useSyncExternalStore(subscribeAuth, readAuthState, getServerAuthSnapshot);

  if (auth.status === 'authenticated') {
    return destination;
  }

  return `/sign-in?redirect=${encodeURIComponent(destination)}`;
}
