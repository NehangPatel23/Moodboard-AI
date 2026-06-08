'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Board, BoardRole } from '@/types/board';
import { rowToBoard, type BoardRow } from '@/lib/db/board-mappers';
import { getLastLocalSaveAt } from '@/lib/board-store';
import { createClient } from '@/lib/supabase/client';

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
  activeSection?: { index: number; label: string };
  onRemoteBoard: (board: Board, savedByName: string | null) => void;
};

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

function collectPresenceUsers(
  state: Record<string, BoardPresenceUser[]>,
  currentUserId: string | null,
): BoardPresenceUser[] {
  const byUser = new Map<string, BoardPresenceUser>();

  Object.values(state).forEach((presences) => {
    presences.forEach((presence) => {
      if (currentUserId && presence.userId === currentUserId) return;
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
  activeSection?: { index: number; label: string },
): BoardPresenceUser {
  return {
    userId,
    name: userName,
    role: boardRole,
    status: isDirty ? 'editing' : 'viewing',
    sectionIndex: activeSection?.index,
    sectionLabel: activeSection?.label,
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
  activeSection,
  onRemoteBoard,
}: UseBoardRealtimeOptions) {
  const [presenceUsers, setPresenceUsers] = useState<BoardPresenceUser[]>([]);
  const onRemoteBoardRef = useRef(onRemoteBoard);
  const localUpdatedAtRef = useRef(localUpdatedAt);
  const isDirtyRef = useRef(isDirty);
  const activeSectionRef = useRef(activeSection);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const trackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    onRemoteBoardRef.current = onRemoteBoard;
    localUpdatedAtRef.current = localUpdatedAt;
    isDirtyRef.current = isDirty;
    activeSectionRef.current = activeSection;
  }, [activeSection, isDirty, localUpdatedAt, onRemoteBoard]);

  useEffect(() => {
    if (!enabled || !userId || !boardRole) {
      return;
    }

    const supabase = createClient();
    const channelName = `board:${boardId}`;

    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    });

    channelRef.current = channel;

    channel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'boards',
          filter: `id=eq.${boardId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const board = parseBoardRow(row);
          if (!board) return;

          if (!isNewerRemoteUpdate(boardId, board.updatedAt, localUpdatedAtRef.current)) {
            return;
          }

          onRemoteBoardRef.current(board, (row.last_saved_by_name as string | null) ?? null);
        },
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<BoardPresenceUser>();
        setPresenceUsers(collectPresenceUsers(state, userId));
      })
      .on('presence', { event: 'join' }, () => {
        const state = channel.presenceState<BoardPresenceUser>();
        setPresenceUsers(collectPresenceUsers(state, userId));
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel.presenceState<BoardPresenceUser>();
        setPresenceUsers(collectPresenceUsers(state, userId));
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;

        await channel.track(
          buildPresencePayload(
            userId,
            userName,
            boardRole,
            isDirtyRef.current,
            activeSectionRef.current,
          ),
        );
      });

    return () => {
      channelRef.current = null;
      if (trackTimerRef.current !== null) {
        window.clearTimeout(trackTimerRef.current);
      }
      void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, [boardId, boardRole, enabled, userId, userName]);

  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || !enabled || !userId || !boardRole) return;

    if (trackTimerRef.current !== null) {
      window.clearTimeout(trackTimerRef.current);
    }

    trackTimerRef.current = window.setTimeout(() => {
      void channel.track(
        buildPresencePayload(userId, userName, boardRole, isDirty, activeSection),
      );
    }, 80);

    return () => {
      if (trackTimerRef.current !== null) {
        window.clearTimeout(trackTimerRef.current);
      }
    };
  }, [activeSection, boardRole, enabled, isDirty, userId, userName]);

  const activePresence = enabled && userId && boardRole ? presenceUsers : [];

  return { presenceUsers: activePresence };
}
