'use client';

import { useEffect, useRef, useState } from 'react';
import type { AuthChangeEvent, RealtimeChannel, RealtimePostgresUpdatePayload, Session } from '@supabase/supabase-js';
import type { Board, BoardRole } from '@/types/board';
import { rowToBoard, type BoardRow } from '@/lib/db/board-mappers';
import { getLastLocalSaveAt } from '@/lib/board-store';
import { createClient, ensureSupabaseRealtimeAuth } from '@/lib/supabase/client';
import { usePrivateRealtimePresence } from '@/lib/realtime/config';

import type { CollaboratorCursor } from '@/lib/realtime/collaborator-fields';

export type BoardPresenceStatus = 'editing' | 'viewing';

export type PresenceConnectionState = 'disabled' | 'connecting' | 'connected' | 'error';

export type BoardPresenceUser = {
  userId: string;
  name: string;
  role: BoardRole;
  status: BoardPresenceStatus;
  sectionIndex?: number;
  sectionLabel?: string;
  activeFieldId?: string | null;
  cursor?: CollaboratorCursor | null;
};

type UseBoardRealtimeOptions = {
  boardId: string;
  userId: string | null;
  userName: string;
  boardRole: BoardRole | null;
  localUpdatedAt: string | null;
  isDirty: boolean;
  enabled: boolean;
  activeSectionIndex: number;
  activeSectionLabel: string;
  activeFieldId?: string | null;
  cursor?: CollaboratorCursor | null;
  onRemoteBoard: (board: Board, savedByName: string | null) => void;
};

const PRESENCE_SYNC_MS = 5_000;
const PRESENCE_KEEPALIVE_MS = 12_000;
const PRESENCE_STALE_MS = 20_000;
const PRESENCE_TRACK_DEBOUNCE_MS = 200;
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

function parseBoardRow(payload: Record<string, unknown>): Board | null {
  try {
    return rowToBoard(payload as unknown as BoardRow);
  } catch {
    return null;
  }
}

function isNewerRemoteUpdate(boardId: string, remoteUpdatedAt: string, localUpdatedAt: string | null): boolean {
  if (!localUpdatedAt) return true;

  const remoteMs = new Date(remoteUpdatedAt).getTime();
  const localMs = new Date(localUpdatedAt).getTime();

  if (remoteMs > localMs) return true;

  const lastLocalSave = getLastLocalSaveAt(boardId);
  if (lastLocalSave && remoteUpdatedAt === lastLocalSave) {
    return false;
  }

  return false;
}

function collectPresenceUsers(state: Record<string, BoardPresenceUser[]>): BoardPresenceUser[] {
  const byUser = new Map<string, BoardPresenceUser>();

  Object.values(state).forEach((presences) => {
    presences.forEach((presence) => {
      byUser.set(presence.userId, presence);
    });
  });

  return Array.from(byUser.values());
}

function buildPresencePayload(
  userId: string,
  userName: string,
  boardRole: BoardRole,
  isDirty: boolean,
  activeSectionIndex: number,
  activeSectionLabel: string,
  activeFieldId?: string | null,
  cursor?: CollaboratorCursor | null,
): BoardPresenceUser {
  return {
    userId,
    name: userName,
    role: boardRole,
    status: isDirty ? 'editing' : 'viewing',
    sectionIndex: activeSectionIndex,
    sectionLabel: activeSectionLabel,
    activeFieldId: activeFieldId ?? null,
    cursor: cursor ?? null,
  };
}

export function useBoardRealtime({
  boardId,
  userId,
  userName,
  boardRole,
  localUpdatedAt,
  isDirty,
  enabled,
  activeSectionIndex,
  activeSectionLabel,
  activeFieldId = null,
  cursor = null,
  onRemoteBoard,
}: UseBoardRealtimeOptions) {
  const [onlineUsers, setOnlineUsers] = useState<BoardPresenceUser[]>([]);
  const [presenceReady, setPresenceReady] = useState(false);
  const [channelState, setChannelState] = useState<'connecting' | 'connected' | 'error'>('connecting');

  const onRemoteBoardRef = useRef(onRemoteBoard);
  const localUpdatedAtRef = useRef(localUpdatedAt);
  const isDirtyRef = useRef(isDirty);
  const activeSectionIndexRef = useRef(activeSectionIndex);
  const activeSectionLabelRef = useRef(activeSectionLabel);
  const activeFieldIdRef = useRef(activeFieldId);
  const cursorRef = useRef(cursor);
  const userNameRef = useRef(userName);
  const syncChannelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const presenceSubscribedRef = useRef(false);
  const trackTimerRef = useRef<number | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const lastKeepaliveAtRef = useRef(0);
  const lastTrackedPayloadRef = useRef('');
  const presenceCacheRef = useRef<Map<string, { user: BoardPresenceUser; lastSeen: number }>>(new Map());
  const cancelledRef = useRef(false);
  const schedulePresenceTrackRef = useRef<(force?: boolean) => void>(() => {});
  const privatePresence = usePrivateRealtimePresence();

  useEffect(() => {
    onRemoteBoardRef.current = onRemoteBoard;
    localUpdatedAtRef.current = localUpdatedAt;
    isDirtyRef.current = isDirty;
    activeSectionIndexRef.current = activeSectionIndex;
    activeSectionLabelRef.current = activeSectionLabel;
    activeFieldIdRef.current = activeFieldId;
    cursorRef.current = cursor;
    userNameRef.current = userName;
  }, [activeFieldId, activeSectionIndex, activeSectionLabel, cursor, isDirty, localUpdatedAt, onRemoteBoard, userName]);

  useEffect(() => {
    if (!enabled || !userId || !boardRole) {
      presenceSubscribedRef.current = false;
      return;
    }

    cancelledRef.current = false;
    const supabase = createClient();
    const syncChannelName = `board-sync:${boardId}`;
    const presenceChannelName = `board:${boardId}`;
    const presenceCache = presenceCacheRef.current;

    function applyPresenceSnapshot(users: BoardPresenceUser[]) {
      const now = Date.now();

      for (const user of users) {
        presenceCache.set(user.userId, { user, lastSeen: now });
      }

      const merged: BoardPresenceUser[] = [];
      for (const [cachedUserId, entry] of presenceCache) {
        if (now - entry.lastSeen <= PRESENCE_STALE_MS) {
          merged.push(entry.user);
        } else {
          presenceCache.delete(cachedUserId);
        }
      }

      merged.sort((left, right) => left.name.localeCompare(right.name));
      setOnlineUsers(merged);
    }

    function syncPresenceFromChannel(channel: RealtimeChannel) {
      applyPresenceSnapshot(collectPresenceUsers(channel.presenceState<BoardPresenceUser>()));
    }

    function clearTrackTimer() {
      if (trackTimerRef.current !== null) {
        window.clearTimeout(trackTimerRef.current);
        trackTimerRef.current = null;
      }
    }

    function clearHeartbeat() {
      if (heartbeatTimerRef.current !== null) {
        window.clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    }

    function clearReconnectTimer() {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    }

    function scheduleReconnect() {
      if (cancelledRef.current) return;

      clearReconnectTimer();
      const delay = Math.min(
        RECONNECT_BASE_MS * 2 ** reconnectAttemptRef.current,
        RECONNECT_MAX_MS,
      );
      reconnectAttemptRef.current += 1;

      reconnectTimerRef.current = window.setTimeout(() => {
        if (!cancelledRef.current) {
          void connectPresence();
        }
      }, delay);
    }

    function currentPayload(): BoardPresenceUser | null {
      if (!userId || !boardRole) return null;

      return buildPresencePayload(
        userId,
        userNameRef.current,
        boardRole,
        isDirtyRef.current,
        activeSectionIndexRef.current,
        activeSectionLabelRef.current,
        activeFieldIdRef.current,
        cursorRef.current,
      );
    }

    async function pushPresenceUpdate(channel = presenceChannelRef.current, force = false) {
      if (!channel || !presenceSubscribedRef.current || cancelledRef.current || !userId || !boardRole) {
        return;
      }

      const payload = currentPayload();
      if (!payload) return;

      const serialized = JSON.stringify(payload);
      if (!force && serialized === lastTrackedPayloadRef.current) {
        syncPresenceFromChannel(channel);
        return;
      }

      const trackStatus = await channel.track(payload);

      if (trackStatus !== 'ok') {
        console.error('[board-realtime] presence track failed', {
          trackStatus,
          presenceChannelName,
          privatePresence,
        });
        setChannelState('error');
        scheduleReconnect();
        return;
      }

      lastTrackedPayloadRef.current = serialized;
      setChannelState('connected');
      syncPresenceFromChannel(channel);
    }

    function schedulePresenceTrack(delayMs = PRESENCE_TRACK_DEBOUNCE_MS, force = false) {
      clearTrackTimer();
      trackTimerRef.current = window.setTimeout(() => {
        void pushPresenceUpdate(presenceChannelRef.current, force);
      }, delayMs);
    }

    schedulePresenceTrackRef.current = (force = false) => {
      schedulePresenceTrack(force ? 0 : PRESENCE_TRACK_DEBOUNCE_MS, force);
    };

    function startHeartbeat(channel: RealtimeChannel) {
      clearHeartbeat();
      lastKeepaliveAtRef.current = Date.now();

      heartbeatTimerRef.current = window.setInterval(() => {
        syncPresenceFromChannel(channel);

        const now = Date.now();
        if (now - lastKeepaliveAtRef.current >= PRESENCE_KEEPALIVE_MS) {
          lastKeepaliveAtRef.current = now;
          void pushPresenceUpdate(channel, true);
        }
      }, PRESENCE_SYNC_MS);
    }

    async function connectPresence() {
      await ensureSupabaseRealtimeAuth(supabase);
      if (cancelledRef.current) return;

      clearReconnectTimer();
      setChannelState('connecting');

      const existing = presenceChannelRef.current;
      if (existing) {
        presenceSubscribedRef.current = false;
        void existing.untrack();
        void supabase.removeChannel(existing);
        presenceChannelRef.current = null;
      }

      const presenceChannel = supabase.channel(presenceChannelName, {
        config: {
          private: privatePresence,
          presence: { key: userId! },
        },
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          syncPresenceFromChannel(presenceChannel);
        })
        .on('presence', { event: 'join' }, () => {
          syncPresenceFromChannel(presenceChannel);
        })
        .on('presence', { event: 'leave' }, () => {
          syncPresenceFromChannel(presenceChannel);
        })
        .subscribe(async (status: string, error?: Error) => {
          if (cancelledRef.current) {
            void supabase.removeChannel(presenceChannel);
            return;
          }

          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            presenceSubscribedRef.current = false;
            setPresenceReady(false);
            setChannelState('error');
            console.error('[board-realtime] presence channel error', {
              status,
              error,
              presenceChannelName,
              privatePresence,
            });
            scheduleReconnect();
            return;
          }

          if (status === 'CLOSED') {
            presenceSubscribedRef.current = false;
            setPresenceReady(false);
            clearHeartbeat();
            scheduleReconnect();
            return;
          }

          if (status !== 'SUBSCRIBED') return;

          presenceChannelRef.current = presenceChannel;
          presenceSubscribedRef.current = true;
          reconnectAttemptRef.current = 0;
          setPresenceReady(true);
          lastTrackedPayloadRef.current = '';
          await pushPresenceUpdate(presenceChannel, true);
          if (!cancelledRef.current) {
            startHeartbeat(presenceChannel);
          }
        });
    }

    async function connect() {
      await ensureSupabaseRealtimeAuth(supabase);
      if (cancelledRef.current) return;

      const syncChannel = supabase
        .channel(syncChannelName)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'boards',
            filter: `id=eq.${boardId}`,
          },
          (payload: RealtimePostgresUpdatePayload<Record<string, unknown>>) => {
            const row = payload.new as Record<string, unknown>;
            const board = parseBoardRow(row);
            if (!board) return;

            if (!isNewerRemoteUpdate(boardId, board.updatedAt, localUpdatedAtRef.current)) {
              return;
            }

            onRemoteBoardRef.current(board, (row.last_saved_by_name as string | null) ?? null);
          },
        )
        .subscribe((status: string, error?: Error) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('[board-realtime] sync channel error', { status, error, syncChannelName });
          }
        });

      if (cancelledRef.current) {
        void supabase.removeChannel(syncChannel);
        return;
      }

      syncChannelRef.current = syncChannel;
      await connectPresence();
    }

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (!session?.access_token) return;

      void (async () => {
        await supabase.realtime.setAuth(session.access_token);
        if (cancelledRef.current) return;

        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          if (presenceSubscribedRef.current) {
            lastTrackedPayloadRef.current = '';
            schedulePresenceTrack(0, true);
          } else {
            void connectPresence();
          }
        }
      })();
    });

    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible' || cancelledRef.current) return;

      void (async () => {
        await ensureSupabaseRealtimeAuth(supabase);
        if (cancelledRef.current) return;

        const channel = presenceChannelRef.current;
        if (!channel || !presenceSubscribedRef.current) {
          void connectPresence();
          return;
        }

        syncPresenceFromChannel(channel);
        schedulePresenceTrack(0, true);
      })();
    }

    function handleOnline() {
      if (cancelledRef.current) return;
      reconnectAttemptRef.current = 0;
      void connectPresence();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    void connect();

    return () => {
      cancelledRef.current = true;
      presenceSubscribedRef.current = false;
      setPresenceReady(false);
      authSubscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      clearHeartbeat();
      clearTrackTimer();
      clearReconnectTimer();

      const syncChannel = syncChannelRef.current;
      const presenceChannel = presenceChannelRef.current;
      syncChannelRef.current = null;
      presenceChannelRef.current = null;
      lastTrackedPayloadRef.current = '';
      presenceCache.clear();

      if (syncChannel) {
        void supabase.removeChannel(syncChannel);
      }
      if (presenceChannel) {
        void presenceChannel.untrack();
        void supabase.removeChannel(presenceChannel);
      }

      setOnlineUsers([]);
    };
  }, [boardId, boardRole, enabled, privatePresence, userId]);

  useEffect(() => {
    if (!enabled || !userId || !boardRole || !presenceReady) return;
    schedulePresenceTrackRef.current(false);
  }, [
    activeFieldId,
    activeSectionIndex,
    activeSectionLabel,
    boardRole,
    cursor,
    enabled,
    isDirty,
    presenceReady,
    userId,
  ]);

  const activeOnlineUsers = enabled && userId && boardRole ? onlineUsers : [];
  const presenceUsers = userId
    ? activeOnlineUsers.filter((user) => user.userId !== userId)
    : activeOnlineUsers;
  const connectionState: PresenceConnectionState =
    !enabled || !userId || !boardRole
      ? 'disabled'
      : channelState === 'error' && !presenceReady
        ? 'error'
        : !presenceReady
          ? 'connecting'
          : channelState;

  return { presenceUsers, onlineUsers: activeOnlineUsers, connectionState };
}
