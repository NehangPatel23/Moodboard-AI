'use client';

import { useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  getServerAuthSnapshot,
  hydrateAuthStore,
  readAuthState,
  subscribeAuth,
} from '@/lib/auth-store';

function AuthLoadingState() {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" aria-hidden="true" />
      <p className="text-sm text-[var(--text-muted)]">Checking your session…</p>
    </div>
  );
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useSyncExternalStore(subscribeAuth, readAuthState, getServerAuthSnapshot);

  useEffect(() => {
    hydrateAuthStore();
  }, []);

  useEffect(() => {
    if (auth.status === 'unauthenticated') {
      const redirect = encodeURIComponent(pathname || '/app');
      router.replace(`/sign-in?redirect=${redirect}`);
    }
  }, [auth.status, pathname, router]);

  if (auth.status === 'authenticated') {
    return <>{children}</>;
  }

  return <AuthLoadingState />;
}
