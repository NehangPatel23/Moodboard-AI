'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel, RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import { apiFetch } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import type {
  BoardCollaborationStateResponse,
  CollaborationItemStateInput,
} from '@/types/board';

type UseBoardCollaborationStateOptions = {
  boardId: string;
  enabled: boolean;
  currentUserId?: string | null;
  /** Subscribe to new snapshots so unread badges update live for editors. */
  trackSnapshots?: boolean;
};

const emptyState: BoardCollaborationStateResponse = {
  commentsLastReadAt: null,
  activityLastReadAt: null,
  snapshotsLastReadAt: null,
  unreadComments: 0,
  unreadActivity: 0,
  unreadSnapshots: 0,
};

export function useBoardCollaborationState({
  boardId,
  enabled,
  currentUserId = null,
  trackSnapshots = false,
}: UseBoardCollaborationStateOptions) {
  const [state, setState] = useState<BoardCollaborationStateResponse>(emptyState);
  const [loading, setLoading] = useState(false);
  const currentUserIdRef = useRef(currentUserId);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    try {
      const data = await apiFetch<BoardCollaborationStateResponse>(
        `/api/boards/${boardId}/collaboration-state`,
      );
      setState(data);
    } catch {
      setState(emptyState);
    } finally {
      setLoading(false);
    }
  }, [boardId, enabled]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function loadState() {
      setLoading(true);
      try {
        const data = await apiFetch<BoardCollaborationStateResponse>(
          `/api/boards/${boardId}/collaboration-state`,
        );
        if (!cancelled) {
          setState(data);
        }
      } catch {
        if (!cancelled) {
          setState(emptyState);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadState();

    return () => {
      cancelled = true;
    };
  }, [boardId, enabled]);

  useEffect(() => {
    if (!enabled || !trackSnapshots) return;

    const supabase = createClient();
    let channel: RealtimeChannel | null = null;

    channel = supabase
      .channel(`board-snapshots-unread:${boardId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'board_snapshots',
          filter: `board_id=eq.${boardId}`,
        },
        (payload: RealtimePostgresInsertPayload<{ user_id?: string }>) => {
          const row = payload.new;
          if (row.user_id && row.user_id === currentUserIdRef.current) {
            return;
          }
          void refresh();
        },
      )
      .subscribe();

    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [boardId, enabled, refresh, trackSnapshots]);

  const patchState = useCallback(
    async (body: Record<string, unknown>): Promise<boolean> => {
      if (!enabled) return false;

      try {
        const data = await apiFetch<BoardCollaborationStateResponse>(
          `/api/boards/${boardId}/collaboration-state`,
          {
            method: 'PATCH',
            body: JSON.stringify(body),
          },
        );
        setState(data);
        return true;
      } catch {
        return false;
      }
    },
    [boardId, enabled],
  );

  const markCommentsRead = useCallback(async (): Promise<boolean> => {
    return patchState({ markCommentsRead: true });
  }, [patchState]);

  const markActivityRead = useCallback(async (): Promise<boolean> => {
    return patchState({ markActivityRead: true });
  }, [patchState]);

  const markSnapshotsRead = useCallback(async (): Promise<boolean> => {
    return patchState({ markSnapshotsRead: true });
  }, [patchState]);

  const markSnapshotRead = useCallback(
    async (snapshotId: string): Promise<boolean> => {
      return patchState({ markSnapshotId: snapshotId });
    },
    [patchState],
  );

  const setItemState = useCallback(
    async (item: CollaborationItemStateInput): Promise<boolean> => {
      return patchState({ item });
    },
    [patchState],
  );

  const setItemRead = useCallback(
    async (type: CollaborationItemStateInput['type'], id: string, isRead: boolean): Promise<boolean> => {
      return setItemState({ type, id, isRead });
    },
    [setItemState],
  );

  const hideItem = useCallback(
    async (type: CollaborationItemStateInput['type'], id: string): Promise<boolean> => {
      return setItemState({ type, id, isHidden: true });
    },
    [setItemState],
  );

  const unhideItem = useCallback(
    async (type: CollaborationItemStateInput['type'], id: string): Promise<boolean> => {
      return setItemState({ type, id, isHidden: false });
    },
    [setItemState],
  );

  return {
    ...state,
    loading: enabled ? loading : false,
    refresh,
    markCommentsRead,
    markActivityRead,
    markSnapshotsRead,
    markSnapshotRead,
    setItemRead,
    hideItem,
    unhideItem,
  };
}
