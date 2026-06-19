'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { apiFetch } from '@/lib/api-client';
import { reloadBoards } from '@/lib/board-store';
import type { PendingBoardInvite } from '@/types/board';

type PendingInvitesSnapshot = {
  invites: PendingBoardInvite[];
  loading: boolean;
  count: number;
};

const SERVER_SNAPSHOT: PendingInvitesSnapshot = {
  invites: [],
  loading: false,
  count: 0,
};

let invites: PendingBoardInvite[] = [];
let loading = false;
let cachedSnapshot: PendingInvitesSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function syncCachedSnapshot() {
  cachedSnapshot = { invites, loading, count: invites.length };
}

function emit() {
  syncCachedSnapshot();
  listeners.forEach((listener) => listener());
}

function getSnapshot(): PendingInvitesSnapshot {
  return cachedSnapshot;
}

function getServerSnapshot(): PendingInvitesSnapshot {
  return SERVER_SNAPSHOT;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let refreshPromise: Promise<void> | null = null;
let pendingInviteToastShown = false;

export function resetPendingInvites() {
  invites = [];
  loading = false;
  pendingInviteToastShown = false;
  syncCachedSnapshot();
  emit();
}

async function maybeShowPendingInviteToast() {
  if (pendingInviteToastShown || invites.length === 0) {
    return;
  }

  pendingInviteToastShown = true;
  const { showToast } = await import('@/components/shared/toast-store');
  const label = invites.length === 1 ? '1 board invitation' : `${invites.length} board invitations`;
  showToast(`You have ${label} — accept access to join.`, 'default');
}

export async function refreshPendingInvites() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    loading = true;
    emit();

    try {
      const data = await apiFetch<{ invites: PendingBoardInvite[] }>('/api/invites/pending');
      invites = data.invites;
    } catch (error) {
      invites = [];
      if (process.env.NODE_ENV === 'development') {
        console.error('[pending-invites]', error);
      }
      const { showToast } = await import('@/components/shared/toast-store');
      showToast(
        error instanceof Error ? error.message : 'Could not load board invitations',
        'destructive',
      );
    } finally {
      loading = false;
      emit();
      await maybeShowPendingInviteToast();
    }
  })();

  try {
    await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function acceptPendingInvite(token: string): Promise<{ boardId: string; role: string }> {
  const data = await apiFetch<{ boardId: string; role: string }>(`/api/invites/${token}`, {
    method: 'POST',
  });
  await reloadBoards();
  await refreshPendingInvites();
  return data;
}

export async function declinePendingInvite(token: string) {
  await apiFetch(`/api/invites/${token}/decline`, { method: 'POST' });
  await refreshPendingInvites();
}

export function usePendingInvites() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    void refreshPendingInvites();
  }, []);

  const acceptInvite = useCallback(async (token: string) => acceptPendingInvite(token), []);
  const declineInvite = useCallback(async (token: string) => declinePendingInvite(token), []);
  const refetch = useCallback(async () => refreshPendingInvites(), []);

  return {
    ...snapshot,
    acceptInvite,
    declineInvite,
    refetch,
  };
}
