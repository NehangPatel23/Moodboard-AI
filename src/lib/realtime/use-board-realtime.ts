'use client';

import { useEffect, useRef, useState } from 'react';
import type { AuthChangeEvent, RealtimeChannel, RealtimePostgresUpdatePayload, Session } from '@supabase/supabase-js';
import type { Board, BoardRole } from '@/types/board';
import { rowToBoard, type BoardRow } from '@/lib/db/board-mappers';
import { getLastLocalSaveAt } from '@/lib/board-store';
import { createClient, ensureSupabaseRealtimeAuth } from '@/lib/supabase/client';
import { usePrivateRealtimePresence } from '@/lib/realtime/config';

export type BoardPresenceStatus = 'editing' | 'viewing';

export type BoardPresenceUser = {
  userId: string;
  name: string;
  role: BoardRole;
  status: BoardPresenceStatus;
  sectionIndex?: number;
  sectionLabel?: string;
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
  onRemoteBoard: (board: Board, savedByName: string | null) => void;
};

const PRESENCE_HEARTBEAT_MS = 15_000;

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

function syncPresenceFromChannel(
  channel: RealtimeChannel,
  setOnlineUsers: (users: BoardPresenceUser[]) => void,
) {
  setOnlineUsers(collectPresenceUsers(channel.presenceState<BoardPresenceUser>()));
}

function buildPresencePayload(
  userId: string,
  userName: string,
  boardRole: BoardRole,
  isDirty: boolean,
  activeSectionIndex: number,
  activeSectionLabel: string,
): BoardPresenceUser {
  return {
    userId,
    name: userName,
    role: boardRole,
    status: isDirty ? 'editing' : 'viewing',
    sectionIndex: activeSectionIndex,
    sectionLabel: activeSectionLabel,
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
  onRemoteBoard,
}: UseBoardRealtimeOptions) {
  const [onlineUsers, setOnlineUsers] = useState<BoardPresenceUser[]>([]);
  const [presenceReady, setPresenceReady] = useState(false);
  const onRemoteBoardRef = useRef(onRemoteBoard);
  const localUpdatedAtRef = useRef(localUpdatedAt);
  const isDirtyRef = useRef(isDirty);
  const activeSectionIndexRef = useRef(activeSectionIndex);
  const activeSectionLabelRef = useRef(activeSectionLabel);
  const syncChannelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const presenceSubscribedRef = useRef(false);
  const trackTimerRef = useRef<number | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);
  const privatePresence = usePrivateRealtimePresence();

  useEffect(() => {
    onRemoteBoardRef.current = onRemoteBoard;
    localUpdatedAtRef.current = localUpdatedAt;
    isDirtyRef.current = isDirty;
    activeSectionIndexRef.current = activeSectionIndex;
    activeSectionLabelRef.current = activeSectionLabel;
  }, [activeSectionIndex, activeSectionLabel, isDirty, localUpdatedAt, onRemoteBoard]);

  useEffect(() => {
    if (!enabled || !userId || !boardRole) {
      presenceSubscribedRef.current = false;
      setPresenceReady(false);
      setOnlineUsers([]);
      return;
    }

    let cancelled = false;
    const supabase = createClient();
    const syncChannelName = `board-sync:${boardId}`;
    const presenceChannelName = `board:${boardId}`;

    async function pushPresenceUpdate(channel = presenceChannelRef.current) {
      if (!channel || !presenceSubscribedRef.current || cancelled || !userId || !boardRole) {
        return;
      }

      const trackStatus = await channel.track(
        buildPresencePayload(
          userId!,
          userName,
          boardRole!,
          isDirtyRef.current,
          activeSectionIndexRef.current,
          activeSectionLabelRef.current,
        ),
      );

      if (trackStatus !== 'ok') {
        console.error('[board-realtime] presence track failed', {
          trackStatus,
          presenceChannelName,
          privatePresence,
        });
        return;
      }

      syncPresenceFromChannel(channel, setOnlineUsers);
    }

    function clearHeartbeat() {
      if (heartbeatTimerRef.current !== null) {
        window.clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    }

    function startHeartbeat(channel: RealtimeChannel) {
      clearHeartbeat();
      heartbeatTimerRef.current = window.setInterval(() => {
        syncPresenceFromChannel(channel, setOnlineUsers);
        void pushPresenceUpdate(channel);
      }, PRESENCE_HEARTBEAT_MS);
    }

    async function connectPresence() {
      await ensureSupabaseRealtimeAuth(supabase);
      if (cancelled) return;

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
          syncPresenceFromChannel(presenceChannel, setOnlineUsers);
        })
        .on('presence', { event: 'join' }, () => {
          syncPresenceFromChannel(presenceChannel, setOnlineUsers);
        })
        .on('presence', { event: 'leave' }, () => {
          syncPresenceFromChannel(presenceChannel, setOnlineUsers);
        })
        .subscribe(async (status: string, error?: Error) => {
          if (cancelled) {
            void supabase.removeChannel(presenceChannel);
            return;
          }

          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            presenceSubscribedRef.current = false;
            setPresenceReady(false);
            console.error('[board-realtime] presence channel error', {
              status,
              error,
              presenceChannelName,
              privatePresence,
            });
            return;
          }

          if (status === 'CLOSED') {
            presenceSubscribedRef.current = false;
            setPresenceReady(false);
            clearHeartbeat();
            return;
          }

          if (status !== 'SUBSCRIBED') return;

          presenceChannelRef.current = presenceChannel;
          presenceSubscribedRef.current = true;
          setPresenceReady(true);
          await pushPresenceUpdate(presenceChannel);
          if (!cancelled) {
            startHeartbeat(presenceChannel);
          }
        });
    }

    async function connect() {
      await ensureSupabaseRealtimeAuth(supabase);
      if (cancelled) return;

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

      if (cancelled) {
        void supabase.removeChannel(syncChannel);
        return;
      }

      syncChannelRef.current = syncChannel;
      await connectPresence();
    }

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (session?.access_token) {
        void supabase.realtime.setAuth(session.access_token);
      }
    });

    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible' || cancelled) return;

      void (async () => {
        await ensureSupabaseRealtimeAuth(supabase);
        if (cancelled) return;

        const channel = presenceChannelRef.current;
        if (!channel || !presenceSubscribedRef.current) {
          await connectPresence();
          return;
        }

        syncPresenceFromChannel(channel, setOnlineUsers);
        await pushPresenceUpdate(channel);
      })();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    void connect();

    return () => {
      cancelled = true;
      presenceSubscribedRef.current = false;
      setPresenceReady(false);
      authSubscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearHeartbeat();

      if (trackTimerRef.current !== null) {
        window.clearTimeout(trackTimerRef.current);
        trackTimerRef.current = null;
      }

      const syncChannel = syncChannelRef.current;
      const presenceChannel = presenceChannelRef.current;
      syncChannelRef.current = null;
      presenceChannelRef.current = null;

      if (syncChannel) {
        void supabase.removeChannel(syncChannel);
      }
      if (presenceChannel) {
        void presenceChannel.untrack();
        void supabase.removeChannel(presenceChannel);
      }

      setOnlineUsers([]);
    };
  }, [boardId, boardRole, enabled, privatePresence, userId, userName]);

  useEffect(() => {
    if (!enabled || !userId || !boardRole || !presenceReady) return;

    const channel = presenceChannelRef.current;
    if (!channel) return;

    void channel
      .track(
        buildPresencePayload(
          userId,
          userName,
          boardRole,
          isDirtyRef.current,
          activeSectionIndex,
          activeSectionLabel,
        ),
      )
      .then((trackStatus) => {
        if (trackStatus !== 'ok') {
          console.error('[board-realtime] presence section update failed', trackStatus);
          return;
        }
        syncPresenceFromChannel(channel, setOnlineUsers);
      });
  }, [activeSectionIndex, activeSectionLabel, boardRole, enabled, presenceReady, userId, userName]);

  useEffect(() => {
    if (!enabled || !userId || !boardRole || !presenceReady) return;

    if (trackTimerRef.current !== null) {
      window.clearTimeout(trackTimerRef.current);
    }

    trackTimerRef.current = window.setTimeout(() => {
      const channel = presenceChannelRef.current;
      if (!channel) return;

      void channel
        .track(
          buildPresencePayload(
            userId,
            userName,
            boardRole,
            isDirty,
            activeSectionIndexRef.current,
            activeSectionLabelRef.current,
          ),
        )
        .then((trackStatus) => {
          if (trackStatus !== 'ok') {
            console.error('[board-realtime] presence dirty update failed', trackStatus);
            return;
          }
          syncPresenceFromChannel(channel, setOnlineUsers);
        });
    }, 250);

    return () => {
      if (trackTimerRef.current !== null) {
        window.clearTimeout(trackTimerRef.current);
      }
    };
  }, [boardRole, enabled, isDirty, presenceReady, userId, userName]);

  const activeOnlineUsers = enabled && userId && boardRole ? onlineUsers : [];
  const presenceUsers = userId
    ? activeOnlineUsers.filter((user) => user.userId !== userId)
    : activeOnlineUsers;

  return { presenceUsers, onlineUsers: activeOnlineUsers };
}
